from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Car
from .serializers import CarSerializer


class CarViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Car.objects.all()
    serializer_class = CarSerializer

    def _refresh_cars_status_if_needed(self, force=False):
        """Met à jour le statut automatique des véhicules au maximum une fois par minute."""
        if not force and cache.get('fleet_auto_status_updated'):
            return

        cache.set('fleet_auto_status_updated', True, timeout=60)
        for car in Car.objects.only('id', 'status'):
            car.update_status_auto()

    def get_queryset(self):
        self._refresh_cars_status_if_needed()
        return Car.objects.all().order_by('-id')

    def perform_create(self, serializer):
        car = serializer.save()
        car.update_status_auto()
        cache.delete('fleet_auto_status_updated')

    def perform_update(self, serializer):
        car = serializer.save()
        car.update_status_auto()
        cache.delete('fleet_auto_status_updated')

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('fleet_auto_status_updated')