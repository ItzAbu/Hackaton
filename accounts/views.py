from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .forms import RegisterForm
from .models import Profile


def register(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect("dashboard")
    return render(request, "registration/register.html", {"form": form})


@login_required
def after_login(request):
    # compat: se qualche parte del progetto usa ancora after_login
    return redirect("dashboard")


def home(request):
    return render(request, "lobby/index.html")
