from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Reservation, Facture

@receiver(post_save, sender=Reservation)
def create_facture_for_reservation(sender, instance, created, **kwargs):
    if created:
        Facture.objects.create(
            reservation=instance,
            statut='En attente'
        )