from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings

class Client(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='client_profile',
        null=True,
        blank=True
    )
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    first_name = models.CharField(max_length=100, verbose_name="Prénom(s)")
    email = models.EmailField(unique=True, verbose_name="Adresse E-mail")
    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Téléphone")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Adresse")
    image = models.ImageField(upload_to='clients_photos/', blank=True, null=True, verbose_name="Photo de profil")
    total_rentals = models.PositiveIntegerField(default=0, verbose_name="Nombre de locations")
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Dépenses Totales")
    is_banned = models.BooleanField(default=False, verbose_name="Est banni")
    ban_reason = models.TextField(blank=True, null=True, verbose_name="Motif du bannissement")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}".strip()

    @property
    def loyalty_status(self):
        if self.is_banned:
            return "Banni"
        if self.total_rentals >= 5:
            return "VIP Gold"
        elif self.total_rentals >= 3:
            return "VIP Bronze"
        return "Standard"

    @property
    def discount_percent(self):
        if self.is_banned:
            return 0
        if self.total_rentals >= 5:
            return 15
        elif self.total_rentals >= 3:
            return 5
        return 0

    def update_stats(self):
        """
        Recalcule automatiquement les statistiques pour les réservations 
        validées, confirmées, en cours et terminées (avec/sans accents).
        """
        valid_statuses = [
            'Validée', 'Validé', 'validée', 'validee',
            'Confirmée', 'Confirmé', 'confirmée', 'confirmee',
            'En cours', 'en cours',
            'Terminée', 'Terminé', 'terminée', 'terminee'
        ]
        
        # Filtre sur tous les statuts valides/effectués
        validees = self.reservations.filter(status__in=valid_statuses)
        
        self.total_rentals = validees.count()
        self.total_spent = sum(r.total_price for r in validees) or 0.00
        self.save()


# SIGNAL 1 : Met à jour le client automatiquement dès qu'une réservation change
@receiver([post_save, post_delete], sender='reservation.Reservation')
def auto_update_client_stats(sender, instance, **kwargs):
    if instance.client:
        instance.client.update_stats()


# SIGNAL 2 : Crée automatiquement une fiche Client dès l'inscription d'un utilisateur
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_client_profile_on_signup(sender, instance, created, **kwargs):
    if created and not instance.is_staff and not instance.is_superuser:
        Client.objects.get_or_create(
            user=instance,
            defaults={
                'last_name': instance.last_name or instance.username or "Client",
                'first_name': instance.first_name or "",
                'email': instance.email,
                'phone': getattr(instance, 'phone_number', None) or getattr(instance, 'phone', ''),
                'address': getattr(instance, 'address', '')
            }
        )