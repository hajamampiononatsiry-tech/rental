from rest_framework import viewsets
from .models import Car
from rest_framework.permissions import AllowAny
from .serializers import CarSerializer

class CarViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]  
    queryset = Car.objects.all()
    serializer_class = CarSerializer

    def get_queryset(self):
        cars = Car.objects.all()
        for car in cars:
            car.update_status_auto()
        return cars