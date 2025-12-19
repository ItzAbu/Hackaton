from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path("login/", views.CustomLoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="login"), name="logout"),
    path("register/", views.register, name="register"),

    # compat / redirect
    path("after-login/", views.after_login, name="after_login"),

    # landing
    path("", views.home, name="lobby"),
    path("home/", views.home, name="home"),
]
