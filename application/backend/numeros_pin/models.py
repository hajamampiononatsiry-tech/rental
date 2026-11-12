from django.db import models
from django.conf import settings

class NumeroPinMobile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='numeros_pins')
    telephone = models.CharField(max_length=20, unique=True, verbose_name="Numéro de téléphone")
    code_pin = models.CharField(max_length=4, verbose_name="Code PIN unique")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.telephone} (PIN sécurisé)"