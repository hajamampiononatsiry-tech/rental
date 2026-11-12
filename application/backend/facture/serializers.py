from rest_framework import serializers
from .models import Facture

class FactureSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    client_phone = serializers.SerializerMethodField()
    
    car_name = serializers.CharField(source='reservation.car_name', read_only=True, default='Véhicule')
    car_category = serializers.CharField(source='reservation.car.category', read_only=True, default='Berline')
    car_registration = serializers.CharField(source='reservation.car.registration', read_only=True, default='N/A')
    
    # Ajout du champ deposit récupéré depuis la voiture liée à la réservation
    deposit = serializers.DecimalField(source='reservation.car.deposit', max_digits=12, decimal_places=2, read_only=True, default=0)
    
    car_image = serializers.SerializerMethodField()

    duration_days = serializers.IntegerField(source='reservation.duration_days', read_only=True, default=1)
    prix_jour = serializers.FloatField(source='reservation.prix_jour', read_only=True, default=0.0)

    montant_total = serializers.DecimalField(source='reservation.total_price', max_digits=12, decimal_places=2, read_only=True, default=0)
    type_reservation = serializers.CharField(source='reservation.get_origin_display', read_only=True, default='Sur place')

    date_emission = serializers.DateTimeField(read_only=True, format="%Y-%m-%d")

    class Meta:
        model = Facture
        fields = [
            'id',
            'reference',
            'reservation',
            'client_name',
            'client_email',
            'client_phone',
            'car_name',
            'car_category',
            'car_registration',
            'deposit', # <--- Ajouté ici dans la liste des champs renvoyés par l'API
            'car_image',
            'duration_days',
            'prix_jour',
            'montant_total',
            'montant_paye',
            'reste_a_payer',
            'mode_paiement',
            'reference_transaction',
            'telephone_paiement',
            'type_reservation',
            'date_emission',
            'statut',
        ]

    def get_car_image(self, obj):
        request = self.context.get('request')
        if obj.reservation and hasattr(obj.reservation, 'car') and obj.reservation.car:
            car = obj.reservation.car
            if hasattr(car, 'photos') and car.photos and len(car.photos) > 0:
                image_url = car.photos[0]
                if image_url:
                    if not image_url.startswith('http') and request:
                        return request.build_absolute_uri(image_url)
                    return image_url
        return None

    def _get_res_client(self, obj):
        if hasattr(obj, 'reservation') and obj.reservation:
            res = obj.reservation
            if hasattr(res, 'client') and res.client:
                return res.client
            if hasattr(res, 'user') and res.user:
                return res.user
            return res
        return None

    def get_client_name(self, obj):
        client = self._get_res_client(obj)
        if not client:
            return 'Client inconnu'
        
        if hasattr(client, 'client_name') and client.client_name:
            return str(client.client_name)
        
        first_name = getattr(client, 'first_name', getattr(client, 'prenom', ''))
        last_name = getattr(client, 'last_name', getattr(client, 'nom', ''))
        full_name = f"{first_name} {last_name}".strip()
        if full_name:
            return full_name

        if hasattr(client, 'get_full_name') and callable(client.get_full_name):
            res_name = client.get_full_name()
            if res_name:
                return res_name

        return str(getattr(client, 'name', getattr(client, 'username', 'Client inconnu')))

    def get_client_email(self, obj):
        client = self._get_res_client(obj)
        if not client:
            return ''
        return str(getattr(client, 'client_email', getattr(client, 'email', '')))

    def get_client_phone(self, obj):
        client = self._get_res_client(obj)
        if not client:
            return ''
        return str(getattr(client, 'client_phone', getattr(client, 'telephone', getattr(client, 'phone', ''))))