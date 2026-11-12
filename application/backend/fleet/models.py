from django.db import models
from django.utils import timezone

class Car(models.Model):
    STATUS_CHOICES = [
        ('Disponible', 'Disponible'),
        ('En location', 'En location'),
        ('En maintenance', 'En maintenance'),
        ('Indisponible', 'Indisponible'),
    ]

    name = models.CharField(max_length=150)
    registration = models.CharField(max_length=50, unique=True)
    year = models.IntegerField(default=2024)
    category = models.CharField(max_length=50, default='Citadine')
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.IntegerField(default=0)
    fuel = models.CharField(max_length=50, default='Essence')
    transmission = models.CharField(max_length=50, default='Manuelle')
    seats = models.IntegerField(default=5)
    doors = models.IntegerField(default=5)
    airConditioning = models.BooleanField(default=True)
    mileage = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Disponible')
    deposit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    includedMileage = models.CharField(max_length=100, default='Illimité')
    driverOption = models.CharField(max_length=100, default='Sans chauffeur')
    photos = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, null=True)

    def update_status_auto(self):
        # 1. Si le véhicule est manuellement mis en maintenance ou indisponible, ne pas modifier
        if self.status in ['En maintenance', 'Indisponible']:
            return 

        today = timezone.now().date()
        
        # 2. Vérifier en SQL si une réservation active couvre la journée d'aujourd'hui
        is_currently_rented = self.reservations.filter(
            status__in=['Validée', 'Confirmée', 'En cours', 'En attente'],  # Ajout de 'En cours' et 'Confirmée'
            start_date__lte=today,                 # La réservation a démarré (ou démarre aujourd'hui)
            end_date__gte=today                    # La réservation n'est pas encore terminée
        ).exists()

        # 3. Mettre à jour uniquement si le statut change
        new_status = 'En location' if is_currently_rented else 'Disponible'
        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=['status'])

    def __str__(self):
        return f"{self.name} ({self.registration})"