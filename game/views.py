from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def demo(request):
    """UrbanKnowledge demo game (Vite build)"""
    return render(request, "game/demo.html")

