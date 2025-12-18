from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
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
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)

        profile = getattr(user, "profile", None)
        if profile and profile.user_type == Profile.Type.PRIVATE:
            return redirect("private_page")
        return redirect("dashboard")

    return render(request, "registration/register.html", {"form": form})


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
