from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from accounts.models import Profile

@login_required
def dashboard(request):
    profile, _ = Profile.objects.get_or_create(
        user=request.user,
        defaults={"user_type": Profile.Type.PRIVATE},
    )
    return render(request, "dashboard/dashboard.html", {"profile": profile})
