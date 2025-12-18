from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import Profile

class EmailLoginForm(AuthenticationForm):
    # etichetta più chiara, ma tecnicamente è sempre "username"
    username = forms.CharField(label="Email", max_length=150)

class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    user_type = forms.ChoiceField(choices=Profile.Type.choices)

    # Privato
    first_name = forms.CharField(max_length=60, required=False)
    last_name = forms.CharField(max_length=60, required=False)

    # Azienda
    company_name = forms.CharField(max_length=120, required=False)
    piva = forms.CharField(max_length=20, required=False)
    city = forms.CharField(max_length=80, required=False)

    # comune
    phone = forms.CharField(max_length=30, required=False)

    class Meta:
        model = User
        fields = ("email", "password1", "password2")

    def clean(self):
        cleaned = super().clean()
        t = cleaned.get("user_type")

        if t == Profile.Type.PRIVATE:
            if not cleaned.get("first_name") or not cleaned.get("last_name"):
                raise forms.ValidationError("Per Privato servono Nome e Cognome.")
        elif t == Profile.Type.COMPANY:
            missing = [k for k in ("company_name", "piva", "city") if not cleaned.get(k)]
            if missing:
                raise forms.ValidationError("Per Azienda servono Nome Azienda, P.IVA e Città.")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=False)

        # Trucco semplice: usiamo l’email come username così il login resta standard
        email = self.cleaned_data["email"]
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
