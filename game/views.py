from django.shortcuts import render

def kaboom(request):
    return render(request, "game/kaboom.html")
