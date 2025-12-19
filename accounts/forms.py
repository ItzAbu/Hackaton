from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.exceptions import ValidationError

from .models import Profile

User = get_user_model()


class EmailLoginForm(AuthenticationForm):
    """Login usando username, ma lo trattiamo come email (username=email)."""

    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(
            attrs={
                "placeholder": "nome@email.it",
                "autocomplete": "email",
                "class": "input",
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
                "class": "input",
            }
        ),
    )

    def clean_username(self):
        # ✅ normalizza per combaciare con user.username salvato in lowercase
        return (self.cleaned_data.get("username") or "").strip().lower()


class RegisterForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={
                "placeholder": "nome@email.it",
                "autocomplete": "email",
                "class": "input",
            }
        ),
    )

    user_type = forms.ChoiceField(choices=Profile.Type.choices)

    # Privato
    first_name = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))
    last_name = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))

    # Azienda
    company_name = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))
    piva = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))
    city = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))

    # Comune
    phone = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "input"}))

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
