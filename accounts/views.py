from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from .forms import RegisterForm
from .models import Profile

# Create your views here.


def register(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect("after_login")
    return render(request, "registration/register.html", {"form": form})

@login_required
def after_login(request):
    profile = Profile.objects.get(user=request.user)
    if profile.user_type == Profile.Type.COMPANY:
        return redirect("/company/")   # metti la tua pagina azienda
    return redirect("/private/")       # metti la tua pagina privato