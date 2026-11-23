from datetime import date
from django.core.cache import cache
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Reservation
from .serializers import ReservationSerializer
from clients.models import Client


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ReservationSerializer

    def auto_update_reservation_statuses(self, force=False):
        """
        Met à jour automatiquement les statuts en fonction de la date du jour :
        - 'Validée' -> 'En cours' si aujourd'hui >= start_date et aujourd'hui <= end_date
        - 'Validée' ou 'En cours' -> 'Terminée' si aujourd'hui > end_date
        Limité à une exécution toutes les 60s sur les lectures pour préserver la RAM et le CPU.
        """
        if not force and cache.get('reservation_auto_status_updated'):
            return

        cache.set('reservation_auto_status_updated', True, timeout=60)
        today = date.today()
        cars_to_refresh = {}

        # 1. Passage en 'En cours' pour les réservations validées dont la date de début est atteinte
        starting_reservations = list(
            Reservation.objects.select_related('car').filter(
                status='Validée',
                start_date__lte=today,
                end_date__gte=today
            )
        )
        if starting_reservations:
            starting_ids = [res.id for res in starting_reservations]
            Reservation.objects.filter(id__in=starting_ids).update(status='En cours')
            for res in starting_reservations:
                if getattr(res, 'car', None):
                    cars_to_refresh[res.car.id] = res.car

        # 2. Passage en 'Terminée' pour les réservations dont la date de fin est dépassée
        ending_reservations = list(
            Reservation.objects.select_related('car').filter(
                status__in=['Validée', 'En cours'],
                end_date__lt=today
            )
        )
        if ending_reservations:
            ending_ids = [res.id for res in ending_reservations]
            Reservation.objects.filter(id__in=ending_ids).update(status='Terminée')
            for res in ending_reservations:
                if getattr(res, 'car', None):
                    cars_to_refresh[res.car.id] = res.car

        for car in cars_to_refresh.values():
            car.update_status_auto()

    def get_queryset(self):
        self.auto_update_reservation_statuses()

        queryset = Reservation.objects.select_related('car', 'client').order_by('-created_at')

        user = self.request.user
        client_email = self.request.query_params.get('client_email') or self.request.query_params.get('email')

        if client_email:
            queryset = queryset.filter(
                Q(client_email__iexact=client_email) |
                Q(client__email__iexact=client_email)
            )
        elif user and user.is_authenticated and not user.is_staff:
            queryset = queryset.filter(
                Q(client_email__iexact=user.email) |
                Q(client__email__iexact=user.email)
            )

        return queryset

    def sync_client(self, reservation):
        """Crée ou met à jour le client et ses statistiques lors d'une réservation."""
        if getattr(reservation, 'client', None):
            reservation.client.update_stats()
        elif getattr(reservation, 'client_email', None):
            client, _ = Client.objects.get_or_create(
                email=reservation.client_email,
                defaults={
                    'name': getattr(reservation, 'client_name', None) or reservation.client_email.split('@')[0],
                    'phone': getattr(reservation, 'client_phone', '') or ''
                }
            )
            reservation.client = client
            reservation.save(update_fields=['client'])
            client.update_stats()

    def perform_create(self, serializer):
        user = self.request.user
        client_obj = None

        if user and user.is_authenticated:
            client_obj = Client.objects.filter(email=user.email).first()
            if not client_obj:
                client_obj = getattr(user, 'client', None)

        save_kwargs = {}
        if client_obj:
            save_kwargs['client'] = client_obj
            save_kwargs['origin'] = 'EN_LIGNE'

        reservation = serializer.save(**save_kwargs)
        if getattr(reservation, 'car', None):
            reservation.car.update_status_auto()
        self.sync_client(reservation)
        cache.delete('reservation_auto_status_updated')

    def perform_update(self, serializer):
        reservation = serializer.save()
        if getattr(reservation, 'car', None):
            reservation.car.update_status_auto()
        self.sync_client(reservation)
        cache.delete('reservation_auto_status_updated')

    def perform_destroy(self, instance):
        client = getattr(instance, 'client', None)
        car = getattr(instance, 'car', None)
        instance.delete()
        if car:
            car.update_status_auto()
        if client:
            client.update_stats()
        cache.delete('reservation_auto_status_updated')