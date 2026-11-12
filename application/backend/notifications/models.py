from django.db import models

class Notification(models.Model):
    notification_key = models.CharField(max_length=255, unique=True) # Ex: "res-12", "pay-45", "email-102"
    type = models.CharField(max_length=50) # 'panne', 'proposition', 'inscription', 'reservation', 'paiement'
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_by = models.CharField(max_length=255, null=True, blank=True) # Nom/Email du travailleur qui l'a lu
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {'Lu' if self.is_read else 'Non lu'}"