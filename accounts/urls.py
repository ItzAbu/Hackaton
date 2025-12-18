from django.urls import path
from django.contrib.auth import views as auth_views

from accounts.forms import EmailLoginForm
from . import views

urlpatterns = [
    path("login/", auth_views.LoginView.as_view(
        template_name="registration/login.html",
        authentication_form=EmailLoginForm,
        redirect_authenticated_user=True,
    ), name="login"),

    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("register/", views.register, name="register"),

    # compat / redirect
    path("after-login/", views.after_login, name="after_login"),

    # landing
    path("", views.home, name="lobby"),
    path("home/", views.home, name="home"),
]
