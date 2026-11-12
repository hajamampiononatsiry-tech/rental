from django.db import models
from fleet.models import Car
from clients.models import Client

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('En attente', 'En attente'),
        ('Validée', 'Validée'),
        ('Annulée', 'Annulée'),
        ('En cours', 'En cours'),
        ('Terminée', 'Terminée'),
    ]

    ORIGIN_CHOICES = [
        ('SUR_PLACE', 'Sur place'),
        ('EN_LIGNE', 'En ligne'),
    ]

    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='reservations'
    )
    client_name = models.CharField(max_length=150)
    client_email = models.EmailField(blank=True, null=True)
    client_phone = models.CharField(max_length=50, blank=True, null=True)
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='reservations')
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='En attente')
    origin = models.CharField(max_length=20, choices=ORIGIN_CHOICES, default='SUR_PLACE')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RES-{self.id} | {self.client_name} - {self.car_name}"

    @property
    def duration_days(self):
        if self.start_date and self.end_date:
            nb_jours = (self.end_date - self.start_date).days
            return nb_jours if nb_jours > 0 else 1
        return 1

    @property
    def prix_jour(self):
        if self.duration_days > 0 and self.total_price:
            return round(float(self.total_price) / self.duration_days, 2)
        return 0.0

    @property
    def car_name(self):
        return getattr(self.car, 'name', str(self.car))