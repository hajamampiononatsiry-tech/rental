import random
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    solde_depot = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Solde du compte (Ar)")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Champs pour le système OTP
    is_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)

    def generate_otp(self):
        code = str(random.randint(100000, 999999))
        self.otp_code = code
        self.save()
        return code

    def __str__(self):
        return self.email or self.username