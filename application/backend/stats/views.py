import json
from datetime import timedelta
from django.core.cache import cache
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from reservation.models import Reservation
from facture.models import Facture

try:
    from fleet.models import Car
except ImportError:
    Car = None

try:
    from maintenance.models import Maintenance
except ImportError:
    Maintenance = None


def _extract_car_image(car_obj, request):
    if not car_obj or not hasattr(car_obj, 'photos') or not car_obj.photos:
        return ""

    photos_val = car_obj.photos
    if isinstance(photos_val, str):
        try:
            photos_val = json.loads(photos_val)
        except Exception:
            photos_val = [photos_val]

    car_image = ""
    if isinstance(photos_val, list) and photos_val:
        first_p = photos_val[0]
        if isinstance(first_p, dict):
            car_image = first_p.get('image') or first_p.get('file') or first_p.get('url') or first_p.get('photo') or ''
        elif isinstance(first_p, str):
            car_image = first_p

    if not car_image or car_image.startswith('data:image/'):
        return ""

    if not car_image.startswith('http'):
        try:
            car_image = request.build_absolute_uri(car_image)
        except Exception:
            pass

    return car_image


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    period = request.query_params.get('period', 'day')
    cache_key = f"dashboard_stats_{period}"
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return Response(cached_payload, status=status.HTTP_200_OK)

    now = timezone.now()

    # 1. Total des véhicules
    total_cars = Car.objects.count() if Car else 0

    # 2. Réservations actives globales
    active_orders = Reservation.objects.filter(
        Q(status__iexact='validated')
        | Q(status__iexact='validée')
        | Q(status__iexact='confirmée')
        | Q(status__iexact='confirmee')
        | Q(status__iexact='en_cours')
        | Q(status__iexact='en cours')
    ).count()

    # 3. Chiffre d'affaires payé
    revenue_data = Facture.objects.aggregate(total_encaisse=Sum('montant_paye'))
    daily_revenue = float(revenue_data['total_encaisse'] or 0.0)

    # 4. RESTE À PAYER
    unpaid_query = Facture.objects.exclude(statut__iexact='Payée')
    if hasattr(Facture, 'reservation'):
        unpaid_query = unpaid_query.filter(
            Q(reservation__status__iexact='validated')
            | Q(reservation__status__iexact='validée')
            | Q(reservation__status__iexact='confirmée')
            | Q(reservation__status__iexact='en_cours')
            | Q(statut__iexact='Partielle')
            | Q(statut__iexact='Validee')
        )
    unpaid_data = unpaid_query.aggregate(total_reste=Sum('reste_a_payer'))
    unpaid_revenue = float(unpaid_data['total_reste'] or 0.0)

    # 5. Dépenses de maintenance
    maintenance_cost = 0.0
    if Maintenance:
        if hasattr(Maintenance, 'statut'):
            maint_query = Maintenance.objects.filter(statut__in=['En cours', 'Terminée', 'en_cours', 'terminée'])
        elif hasattr(Maintenance, 'status'):
            maint_query = Maintenance.objects.filter(status__in=['En cours', 'Terminée', 'en_cours', 'terminée'])
        else:
            maint_query = Maintenance.objects.all()
        maint_data = maint_query.aggregate(total=Sum('cout'))
        maintenance_cost = float(maint_data['total'] or 0.0)

    # 6. Taux d'occupation
    occupancy_rate = 0
    if total_cars > 0 and Car:
        rented_cars_count = Car.objects.filter(
            Q(status__iexact='En location')
            | Q(status__iexact='Loué')
            | Q(status__iexact='loue')
            | Q(status__iexact='en location')
            | Q(status__iexact='en_cours')
        ).count()
        occupancy_rate = min(100, round((rented_cars_count / total_cars) * 100))

    # 7. TOP 3 DES VOITURES (chargées en 1 seule requête)
    top_cars = []
    car_field = 'car' if 'car' in [f.name for f in Reservation._meta.get_fields()] else 'car_id'
    car_rankings = list(
        Reservation.objects.values(car_field)
        .annotate(total_res=Count('id'))
        .order_by('-total_res')[:3]
    )

    car_ids = [item[car_field] for item in car_rankings if item[car_field]]
    cars_map = {}
    if car_ids and Car:
        cars_map = {c.pk: c for c in Car.objects.filter(pk__in=car_ids)}

    for item in car_rankings:
        car_identifier = item[car_field]
        count = item['total_res']
        car_name = "Véhicule"
        category = "Standard"
        car_image = ""
        car_plate = ""
        car_price = 0.0

        car_obj = cars_map.get(car_identifier) if car_identifier else None
        if car_obj:
            car_name = getattr(car_obj, 'name', getattr(car_obj, 'model', f"Voiture #{car_identifier}"))
            category = getattr(car_obj, 'category', 'Standard')
            car_plate = (
                getattr(car_obj, 'car_plate', None)
                or getattr(car_obj, 'plate', None)
                or getattr(car_obj, 'plaque', None)
                or getattr(car_obj, 'immatriculation', None)
                or getattr(car_obj, 'registration', None)
                or getattr(car_obj, 'matricule', None)
                or ""
            )
            car_price = float(
                getattr(car_obj, 'price', None)
                or getattr(car_obj, 'prix_journalier', None)
                or getattr(car_obj, 'daily_price', None)
                or 0.0
            )
            car_image = _extract_car_image(car_obj, request)
        elif car_identifier:
            car_name = f"Voiture #{car_identifier}"

        top_cars.append({
            'name': car_name,
            'count': count,
            'category': category,
            'image': car_image,
            'car_plate': car_plate,
            'price': car_price
        })

    # 8. Graphique des réservations
    chart_data = []
    if period == 'day':
        days_fr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        for i in range(6, -1, -1):
            date_target = (now - timedelta(days=i)).date()
            if hasattr(Reservation, 'date_reservation'):
                count = Reservation.objects.filter(date_reservation__date=date_target).count()
            elif hasattr(Reservation, 'created_at'):
                count = Reservation.objects.filter(created_at__date=date_target).count()
            else:
                count = Reservation.objects.count()

            chart_data.append({
                'label': days_fr[int(date_target.strftime('%w'))],
                'date': date_target.strftime('%d/%m'),
                'locations': count
            })
    elif period == 'month':
        months_fr = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
        for i in range(5, -1, -1):
            m_date = now - timedelta(days=i * 30)
            if hasattr(Reservation, 'created_at'):
                count = Reservation.objects.filter(created_at__year=m_date.year, created_at__month=m_date.month).count()
            else:
                count = Reservation.objects.count()

            chart_data.append({
                'label': months_fr[m_date.month - 1],
                'locations': count
            })
    elif period == 'year':
        for i in range(2, -1, -1):
            y = now.year - i
            if hasattr(Reservation, 'created_at'):
                count = Reservation.objects.filter(created_at__year=y).count()
            else:
                count = Reservation.objects.count()

            chart_data.append({
                'label': str(y),
                'locations': count
            })

    # 9. Dernières réservations (avec select_related pour éviter N+1)
    recent_qs = Reservation.objects.order_by('-id')
    if 'car' in [f.name for f in Reservation._meta.get_fields()]:
        recent_qs = recent_qs.select_related('car')
    if 'client' in [f.name for f in Reservation._meta.get_fields()]:
        recent_qs = recent_qs.select_related('client')

    recent_orders = []
    for res in recent_qs[:5]:
        client_name = getattr(res, 'client_name', None)
        if not client_name and hasattr(res, 'client') and res.client:
            first = getattr(res.client, 'first_name', getattr(res.client, 'prenom', ''))
            last = getattr(res.client, 'last_name', getattr(res.client, 'nom', ''))
            client_name = f"{first} {last}".strip() or getattr(res.client, 'name', 'Client')
        client_name = client_name or 'Client inconnu'

        car_name = "Véhicule"
        car_obj = getattr(res, 'car', None)
        if car_obj and hasattr(car_obj, 'name'):
            car_name = getattr(car_obj, 'name', getattr(car_obj, 'model', 'Véhicule'))

        res_date = ''
        if hasattr(res, 'created_at') and res.created_at:
            res_date = res.created_at.strftime('%d/%m/%Y')

        recent_orders.append({
            'id': res.id,
            'client': client_name,
            'car': car_name,
            'date': res_date,
            'status': getattr(res, 'status', 'En attente')
        })

    payload = {
        'total_cars': total_cars,
        'active_orders': active_orders,
        'daily_revenue': daily_revenue,
        'unpaid_revenue': unpaid_revenue,
        'maintenance_cost': maintenance_cost,
        'occupancy_rate': occupancy_rate,
        'top_cars': top_cars,
        'chart_data': chart_data,
        'recent_orders': recent_orders
    }

    cache.set(cache_key, payload, timeout=30)
    return Response(payload, status=status.HTTP_200_OK)
