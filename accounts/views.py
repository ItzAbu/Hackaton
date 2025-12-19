from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.shortcuts import render, redirect
from django.urls import reverse

from .forms import RegisterForm, EmailLoginForm
from .models import Profile


class CustomLoginView(LoginView):
    template_name = "registration/login.html"
    authentication_form = EmailLoginForm
    redirect_authenticated_user = True

    def get_success_url(self):
        nxt = self.get_redirect_url()
        if nxt:
            return nxt

        profile, _ = Profile.objects.get_or_create(
            user=self.request.user,
            defaults={"user_type": Profile.Type.PRIVATE},
        )

        if profile.user_type == Profile.Type.PRIVATE:
            return reverse("private_page")
        return reverse("dashboard")


def register(request):
    if request.method == "POST":
        email = request.POST.get("email","").strip().lower()
        password = request.POST.get("password1","")
        password2 = request.POST.get("password2","")

        if password != password2:
            messages.error(request, "Le password non coincidono.")
            return render(request, "register.html")

        if User.objects.filter(username=email).exists():
            messages.error(request, "Email già registrata.")
            return render(request, "register.html")

        user = User(username=email, email=email)
        user.set_password(password)
        user.save()

        profile = getattr(user, "profile", None)
        if profile and profile.user_type == Profile.Type.PRIVATE:
            return redirect("private_page")
        return redirect("dashboard")

    return render(request, "register.html")


@login_required
def after_login(request):
    profile, _ = Profile.objects.get_or_create(
        user=request.user,
        defaults={"user_type": Profile.Type.PRIVATE},
    )
    if profile.user_type == Profile.Type.PRIVATE:
        return redirect("private_page")
    return redirect("dashboard")


def home(request):
    return render(request, "lobby/index.html")

def lobby(request):
    if request.method == "POST":
        email = request.POST.get("email","").strip().lower()
        password = request.POST.get("password","")

        user = authenticate(request, username=email, password=password)
        if user is None:
            messages.error(request, "Credenziali non valide.")
            return render(request, "login.html")

        profile = getattr(user, "profile", None)
        if profile and profile.user_type == Profile.Type.PRIVATE:
            return redirect("private_page")
        return redirect("dashboard")

    return render(request, "login.html")
