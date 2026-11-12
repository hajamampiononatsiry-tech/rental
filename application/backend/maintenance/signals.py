from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Maintenance

@receiver(post_save, sender=Maintenance)
def update_car_status_on_maintenance(sender, instance, **kwargs):
    car = instance.car
    today = timezone.now().date()

    # Si la maintenance est en cours ou se déroule aujourd'hui
    if instance.statut == 'En cours' or (instance.date_debut <= today and (not instance.date_fin or instance.date_fin >= today)):
        if car.status != 'En maintenance':
            car.status = 'En maintenance'
            car.save()

    # Si la maintenance est terminée
    elif instance.statut == 'Terminée':
        # Vérifier si la voiture n'a pas d'autre maintenance active
        active_maintenances = Maintenance.objects.filter(
            car=car, 
            statut='En cours'
        ).exclude(id=instance.id).exists()
        
        if not active_maintenances and car.status == 'En maintenance':
            car.status = 'Disponible'
            car.save()