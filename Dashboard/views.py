from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from accounts.models import Profile


def _get_profile(user):
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"user_type": Profile.Type.PRIVATE},
    )
    return profile


@login_required
def dashboard(request):
    profile = _get_profile(request.user)
    if profile.user_type == Profile.Type.PRIVATE:
        return redirect("private_page")
    return render(request, "dashboard/dashboard.html", {"profile": profile})


@login_required
def private_page(request, tab=None):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")

    # tab da URL (kwargs) oppure querystring ?tab=
    selected = tab or request.GET.get("tab") or "companies"
    if selected not in ("companies", "discovery", "search"):
        selected = "companies"

    return render(request, "dashboard/private_page.html", {
        "profile": profile,
        "selected_tab": selected,
    })


# ✅ non più pagine separate: puntano tutte alla stessa
@login_required
def discovery(request):
    return redirect("/dashboard/private/?tab=discovery")

@login_required
def companies(request):
    return redirect("/dashboard/private/?tab=companies")

@login_required
def search_page(request):
    return redirect("/dashboard/private/?tab=search")


@login_required
def profile_page(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/profile.html", {"profile": profile})