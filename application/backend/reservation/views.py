from datetime import date
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Reservation
from .serializers import ReservationSerializer
from clients.models import Client

class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ReservationSerializer

    def auto_update_reservation_statuses(self):
        """
        Met à jour automatiquement les statuts en fonction de la date du jour :
        - 'Confirmée' -> 'En cours' si aujourd'hui >= start_date et aujourd'hui <= end_date
        - 'En cours' ou 'Confirmée' -> 'Terminée' si aujourd'hui > end_date
        """
        today = date.today()

        # 1. Passage en 'En cours' pour les réservations confirmées dont la date de début est atteinte
        starting_reservations = Reservation.objects.filter(
            status='Validée',
            start_date__lte=today,
            end_date__gte=today
        )
        for res in starting_reservations:
            res.status = 'En cours'
            res.save(update_fields=['status'])
            if hasattr(res, 'car') and res.car:
                res.car.update_status_auto()

        # 2. Passage en 'Terminée' pour les réservations dont la date de fin est dépassée
        ending_reservations = Reservation.objects.filter(
            status__in=['Validée', 'En cours'],
            end_date__lt=today
        )
        for res in ending_reservations:
            res.status = 'Terminée'
            res.save(update_fields=['status'])
            if hasattr(res, 'car') and res.car:
                res.car.update_status_auto()

    def get_queryset(self):
        # Exécute la mise à jour automatique des statuts selon la date du jour
        self.auto_update_reservation_statuses()

        queryset = Reservation.objects.all().order_by('-created_at')

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
        if hasattr(reservation, 'client') and reservation.client:
            reservation.client.update_stats()
        elif getattr(reservation, 'client_email', None):
            client, created = Client.objects.get_or_create(
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
        if hasattr(reservation, 'car') and reservation.car:
            reservation.car.update_status_auto()
        self.sync_client(reservation)

    def perform_update(self, serializer):
        reservation = serializer.save()
        if hasattr(reservation, 'car') and reservation.car:
            reservation.car.update_status_auto()
        self.sync_client(reservation)

    def perform_destroy(self, instance):
        client = getattr(instance, 'client', None)
        car = getattr(instance, 'car', None)
        instance.delete()
        if car:
            car.update_status_auto()
        if client:
            client.update_stats()