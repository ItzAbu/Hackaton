from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def kaboom(request):
    return render(request, "game/kaboom.html")
