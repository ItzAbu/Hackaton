from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),

    # ✅ pagina unica privati
    path("private/", views.private_page, name="private_page"),

    # ✅ compat: anche queste aprono la stessa pagina ma con tab diverso
    path("private/companies/", views.private_page, {"tab": "companies"}, name="private_companies"),
    path("private/discovery/", views.private_page, {"tab": "discovery"}, name="private_discovery"),
    path("private/search/", views.private_page, {"tab": "search"}, name="private_search"),

    path("private/profile/", views.profile_page, name="private_profile"),
]
