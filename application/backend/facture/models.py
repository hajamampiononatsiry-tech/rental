import uuid
from django.db import models
from django.utils import timezone
from reservation.models import Reservation

class Facture(models.Model):
    STATUT_CHOICES = [
        ('En attente', 'En attente'),
        ('Partielle', 'Partiellement payée'),
        ('Payée', 'Payée'),
    ]

    reservation = models.OneToOneField(
        Reservation, 
        on_delete=models.CASCADE, 
        related_name='facture'
    )
    reference = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Nouveaux champs de suivi financier et mode de paiement
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reste_a_payer = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En attente')
    mode_paiement = models.CharField(max_length=50, blank=True, null=True, default='Non spécifié')
    reference_transaction = models.CharField(max_length=100, blank=True, null=True)
    telephone_paiement = models.CharField(max_length=20, blank=True, null=True)
    
    date_emission = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # 1. Calcul automatique des montants et mise à jour du statut
        total = float(getattr(self.reservation, 'total_price', 0.0) or 0.0)
        paye = float(self.montant_paye or 0.0)
        
        self.reste_a_payer = max(0.0, total - paye)

        if paye <= 0:
            self.statut = 'En attente'
        elif paye < total:
            self.statut = 'Partielle'
        else:
            self.statut = 'Payée'

        # 2. Génération de la référence unique
        if not self.reference:
            self.reference = f"TEMP-{uuid.uuid4().hex[:8]}"
            super().save(*args, **kwargs)

            year = self.date_emission.year if self.date_emission else timezone.now().year
            self.reference = f"FAC-{year}-{self.id:03d}"
            
            # Mise à jour ciblée des champs modifiés
            super().save(update_fields=['reference', 'reste_a_payer', 'statut'])
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - Statut: {self.statut}"