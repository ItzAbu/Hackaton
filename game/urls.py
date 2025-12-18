from django.urls import path
from . import views


urlpatterns = [
    path("kaboom/", views.kaboom, name="kaboom"),
]