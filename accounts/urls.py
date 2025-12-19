from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path("login/", views.CustomLoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="login"), name="logout"),
    path("register/", views.CustomLoginView.register, name="register"),

    # compat / redirect
    path("after-login/", views.CustomLoginView.after_login, name="after_login"),

    # landing
    path("", views.CustomLoginView.home, name="lobby"),
    path("home/", views.CustomLoginView.home, name="home"),
]
