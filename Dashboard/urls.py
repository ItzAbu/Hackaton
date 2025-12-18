from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),

    # ✅ area privati
    path("private/", views.private_page, name="private_page"),
    path("private/discovery/", views.discovery, name="private_discovery"),
    path("private/companies/", views.companies, name="private_companies"),
    path("private/search/", views.search_page, name="private_search"),
    path("private/profile/", views.profile_page, name="private_profile"),
]
