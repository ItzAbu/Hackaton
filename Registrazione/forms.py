from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterForm(UserCreationForm):
    USER_TYPES = (
        ("PRIVATE", "Privato"),
        ("COMPANY", "Azienda"),
    )

    # Questo è quello che aggiorni via JS nel template
    user_type = forms.ChoiceField(
        choices=USER_TYPES,
        widget=forms.HiddenInput(),
        initial="PRIVATE",
        required=True,
    )

    # Comuni
    email = forms.EmailField(required=True)
    phone = forms.CharField(required=True)

    # Privato
    first_name = forms.CharField(required=False)
    last_name = forms.CharField(required=False)

    # Azienda (per ora campi form, non salvati su User standard)
    company_name = forms.CharField(required=False)
    piva = forms.CharField(required=False)
    city = forms.CharField(required=False)

    class Meta:
        model = User
        fields = (
            "user_type",
            "email", "phone",
            "first_name", "last_name",
            "company_name", "piva", "city",
            "password1", "password2",
        )

    def clean(self):
        cleaned = super().clean()
        t = cleaned.get("user_type")

        if t == "PRIVATE":
            if not cleaned.get("first_name"):
                self.add_error("first_name", "Campo obbligatorio.")
            if not cleaned.get("last_name"):
                self.add_error("last_name", "Campo obbligatorio.")

        if t == "COMPANY":
            for f in ("company_name", "piva", "city"):
                if not cleaned.get(f):
                    self.add_error(f, "Campo obbligatorio.")

        return cleaned

    def save(self, commit=True):
        user = super().save(commit=False)

        # campi che esistono sul modello User standard
        user.email = self.cleaned_data["email"]
        user.first_name = self.cleaned_data.get("first_name", "")
        user.last_name = self.cleaned_data.get("last_name", "")

        if commit:
            user.save()

        # NOTA: phone/user_type/company_name/piva/city
        # non esistono sul User standard -> per salvarli serve un Profile o CustomUser.
        return user
