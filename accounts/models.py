from django.db import models
from django.conf import settings


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
    piva = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=80, blank=True)

    # comune
    phone = models.CharField(max_length=30, blank=True)

    # ✅ EU Standard (valori 0–5, per ora solo mostrati nel profilo)
    eu_math_science = models.PositiveSmallIntegerField(
        default=0,
        help_text="0-5 — Competenza matematica e base in scienze/tecnologie",
    )
    eu_digital = models.PositiveSmallIntegerField(
        default=0,
        help_text="0-5 — Competenza digitale",
    )
    eu_personal_social_learning = models.PositiveSmallIntegerField(
        default=0,
        help_text="0-5 — Competenza personale/sociale e imparare ad imparare",
    )

    def __str__(self):
        return f"{self.user.username} ({self.get_user_type_display()})"