from rest_framework import serializers
from datetime import timedelta
import json
from .models import Reservation
from clients.models import Client

class ReservationSerializer(serializers.ModelSerializer):
    car_name = serializers.ReadOnlyField(source='car.name')
    car_plate = serializers.SerializerMethodField()
    car_photo = serializers.SerializerMethodField()

    client_name = serializers.ReadOnlyField(source='client.name')
    client_email = serializers.ReadOnlyField(source='client.email')
    client_phone = serializers.ReadOnlyField(source='client.phone')

    class Meta:
        model = Reservation
        fields = '__all__'
        extra_kwargs = {
            'client': {'required': False, 'allow_null': True}
        }

    def get_car_plate(self, obj):
        if obj.car:
            return (
                getattr(obj.car, 'plate', None) or 
                getattr(obj.car, 'plaque', None) or 
                getattr(obj.car, 'immatriculation', None) or 
                getattr(obj.car, 'matricule', None) or 
                getattr(obj.car, 'registration', None) or ''
            )
        return ''

    def get_car_photo(self, obj):
        request = self.context.get('request')
        if obj.car:
            car = obj.car
            
            car_image = (
                getattr(car, 'image', None) or 
                getattr(car, 'photo', None) or 
                getattr(car, 'car_photo', None) or
                getattr(car, 'picture', None)
            )

            if not car_image and hasattr(car, 'photos'):
                photos_val = car.photos
                if isinstance(photos_val, str):
                    try:
                        photos_val = json.loads(photos_val)
                    except Exception:
                        pass
                
                if isinstance(photos_val, list) and len(photos_val) > 0:
                    first_p = photos_val[0]
                    if isinstance(first_p, dict):
                        car_image = first_p.get('image') or first_p.get('file') or first_p.get('url') or first_p.get('photo')
                    else:
                        car_image = first_p
                elif hasattr(photos_val, 'all'):
                    try:
                        related_photos = photos_val.all()
                        if related_photos.exists():
                            first_photo = related_photos.first()
                            car_image = getattr(first_photo, 'image', None) or getattr(first_photo, 'file', None) or str(first_photo)
                    except Exception:
                        pass

            if car_image:
                try:
                    image_url = car_image.url if hasattr(car_image, 'url') else str(car_image)
                except Exception:
                    image_url = str(car_image) if car_image else ''

                if image_url:
                    if image_url.startswith('data:image/') or image_url.startswith('http://') or image_url.startswith('https://'):
                        return image_url

                    if request:
                        return request.build_absolute_uri(image_url)

                    if image_url.startswith('/'):
                        return f"http://127.0.0.1:8000{image_url}"
                    return f"http://127.0.0.1:8000/{image_url}"
        return ''

    def validate(self, data):
        instance = getattr(self, 'instance', None)

        start_date = data.get('start_date', getattr(instance, 'start_date', None))
        end_date = data.get('end_date', getattr(instance, 'end_date', None))
        car = data.get('car', getattr(instance, 'car', None))
        status = data.get('status', getattr(instance, 'status', 'En attente'))
        
        # 1. Récupération ou résolution du Client
        client = data.get('client', getattr(instance, 'client', None))
        
        if not client:
            request = self.context.get('request')
            if request and request.user and request.user.is_authenticated:
                user = request.user
                client = Client.objects.filter(email=user.email).first()
                if not client:
                    client = getattr(user, 'client', None)

        # Vérification du bannissement du client
        if client:
            if isinstance(client, int):
                client = Client.objects.filter(pk=client).first()

            if client and getattr(client, 'is_banned', False):
                first_name = getattr(client, 'first_name', '') or ''
                last_name = getattr(client, 'last_name', '') or ''
                full_name = f"{first_name} {last_name}".strip() if (first_name or last_name) else getattr(client, 'name', 'Sélectionné')
                ban_reason = getattr(client, 'ban_reason', None) or 'Motif non spécifié'

                raise serializers.ValidationError({
                    "non_field_errors": [
                        f"Réservation impossible : Le client {full_name} est actuellement banni ({ban_reason})."
                    ]
                })

        # 2. Validation des dates
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                "end_date": "La date de fin ne peut pas être antérieure à la date de début."
            })

        # 3. Vérification de la disponibilité (Seules les réservations non rejetées/annulées bloquent les dates)
        non_blocking_statuses = ['Annulée', 'Refusée']
        if status not in non_blocking_statuses and car and start_date and end_date:
            new_blocked_start = start_date - timedelta(days=1)
            new_blocked_end = end_date + timedelta(days=2)

            existing_reservations = Reservation.objects.filter(car=car).exclude(status__in=non_blocking_statuses)

            if instance and instance.pk:
                existing_reservations = existing_reservations.exclude(pk=instance.pk)

            for res in existing_reservations:
                existing_blocked_start = res.start_date - timedelta(days=1)
                existing_blocked_end = res.end_date + timedelta(days=2)

                if new_blocked_start < existing_blocked_end and new_blocked_end > existing_blocked_start:
                    raise serializers.ValidationError({
                        "non_field_errors": [
                            f"Véhicule indisponible du {existing_blocked_start.strftime('%d/%m/%Y')} "
                            f"au {existing_blocked_end.strftime('%d/%m/%Y')} (marges incluses)."
                        ]
                    })

        return data