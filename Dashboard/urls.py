from django.urls import path
from django.contrib.auth import views as auth_views

from accounts.forms import EmailLoginForm
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    
]
