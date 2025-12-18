from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from .models import Profile


class EmailLoginForm(AuthenticationForm):
    """Login form che usa il campo 'username' ma lo presenta come Email."""

    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(
            attrs={
                "placeholder": "nome@email.it",
                "autocomplete": "email",
            }
        ),
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "placeholder": "••••••••",
                "autocomplete": "current-password",
            }
        ),
    )


class RegisterForm(UserCreationForm):
    """Registrazione con email + profilo (privato/azienda)."""

    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "placeholder": "nome@email.it",
                "autocomplete": "email",
            }
        ),
    )

    user_type = forms.ChoiceField(choices=Profile.Type.choices)

    # Privato
    first_name = forms.CharField(required=False)
    last_name = forms.CharField(required=False)

    # Azienda
    company_name = forms.CharField(required=False)
    piva = forms.CharField(required=False)
    city = forms.CharField(required=False)

    # Comune
    phone = forms.CharField(required=False)

    class Meta:
        model = User
        fields = ("email", "password1", "password2")

    def clean_email(self):
        email = (self.cleaned_data.get("email") or "").strip().lower()
        if not email:
            raise ValidationError("Inserisci una email valida.")
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError("Questa email è già registrata.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)

        email = self.cleaned_data["email"].strip().lower()

        # Usiamo l'email anche come username così il login funziona subito.
        user.username = email
        user.email = email

        if commit:
            user.save()
            Profile.objects.create(
                user=user,
                user_type=self.cleaned_data["user_type"],
                first_name=self.cleaned_data.get("first_name", ""),
                last_name=self.cleaned_data.get("last_name", ""),
                company_name=self.cleaned_data.get("company_name", ""),
                piva=self.cleaned_data.get("piva", ""),
                city=self.cleaned_data.get("city", ""),
                phone=self.cleaned_data.get("phone", ""),
            )
        return user
