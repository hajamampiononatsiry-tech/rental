from django.db import models
from fleet.models import Car  # Modifiez l'import selon l'emplacement exact de votre modèle Car

class Maintenance(models.Model):
    TYPE_CHOICES = [
        ('Vidange', 'Vidange'),
        ('Réparation', 'Réparation'),
        ('Contrôle technique', 'Contrôle technique'),
        ('Pneumatique', 'Pneumatique'),
        ('Autre', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('Planifiée', 'Planifiée'),
        ('En cours', 'En cours'),
        ('Terminée', 'Terminée'),
    ]

    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='maintenances')
    type_service = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Vidange')
    description = models.TextField(blank=True, null=True)
    cout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Planifiée')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type_service} - {self.car} ({self.statut})"