from rest_framework import viewsets
from .models import Maintenance
from .serializers import MaintenanceSerializer


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.select_related('car').order_by('-date_debut')
    serializer_class = MaintenanceSerializer