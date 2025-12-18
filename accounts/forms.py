from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import Profile

class EmailLoginForm(AuthenticationForm):
    username = forms.CharField(label="Email", max_length=150)

class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    user_type = forms.ChoiceField(choices=Profile.Type.choices)

    first_name = forms.CharField(required=False)
    last_name = forms.CharField(required=False)

    company_name = forms.CharField(required=False)
    piva = forms.CharField(required=False)
    city = forms.CharField(required=False)

    phone = forms.CharField(required=False)

    class Meta:
        model = User
        fields = ("email", "password1", "password2")

    def clean(self):
        c = super().clean()
        t = c.get("user_type")

        if t == Profile.Type.PRIVATE:
            if not c.get("first_name") or not c.get("last_name"):
                raise forms.ValidationError("Per Privato servono Nome e Cognome.")
        elif t == Profile.Type.COMPANY:
            if not c.get("company_name") or not c.get("piva") or not c.get("city") or not c.get("phone"):
                raise forms.ValidationError("Per Azienda servono Nome azienda, P.IVA, Città e Telefono.")
        return c

    def save(self, commit=True):
        user = super().save(commit=False)
        email = self.cleaned_data["email"]

        # login via email usando username=email (così Django auth standard funziona)
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