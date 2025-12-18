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
    # ✅ se è privato, niente dashboard azienda
    if profile.user_type == Profile.Type.PRIVATE:
        return redirect("private_page")
    return render(request, "dashboard/dashboard.html", {"profile": profile})


@login_required
def private_page(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/private_page.html", {"profile": profile})


@login_required
def discovery(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/discovery.html", {"profile": profile})


@login_required
def companies(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/companies.html", {"profile": profile})


@login_required
def search_page(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/search.html", {"profile": profile})


@login_required
def profile_page(request):
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.PRIVATE:
        return redirect("dashboard")
    return render(request, "dashboard/profile.html", {"profile": profile})
