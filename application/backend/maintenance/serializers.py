from rest_framework import serializers
from .models import Maintenance

class MaintenanceSerializer(serializers.ModelSerializer):
    car_name = serializers.CharField(source='car.name', read_only=True)
    car_immatriculation = serializers.SerializerMethodField()

    class Meta:
        model = Maintenance
        fields = [
            'id',
            'car',
            'car_name',
            'car_immatriculation',
            'type_service',
            'description',
            'cout',
            'date_debut',
            'date_fin',
            'statut',
            'created_at',
        ]

    def get_car_immatriculation(self, obj):
        car = obj.car
        if not car:
            return ''
        return getattr(car, 'immatriculation', None) or \
               getattr(car, 'car_plate', None) or \
               getattr(car, 'plate', None) or \
               getattr(car, 'plaque', None) or \
               getattr(car, 'registration', '')