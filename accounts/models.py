from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
# Create your models here.
class Profile(models.Model):
    class Type(models.TextChoices):
        PRIVATE = "PRIVATE", "Privato"
        COMPANY = "COMPANY", "Azienda"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=20, choices=Type.choices)

    # Privato
    first_name = models.CharField(max_length=60, blank=True)
    last_name = models.CharField(max_length=60, blank=True)

    # Azienda
    company_name = models.CharField(max_length=120, blank=True)
    piva = models.CharField(max_length=20, blank=True)   # (se vuoi unique, poi lo metti)
    city = models.CharField(max_length=80, blank=True)

    phone = models.CharField(max_length=30, blank=True)