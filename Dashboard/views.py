from cProfile import Profile
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.validators import validate_email
from django.http import HttpResponseNotAllowed
from django.shortcuts import redirect, render

def _company_required(request):
    """Ritorna (profile, redirect_response|None)."""
    profile = _get_profile(request.user)
    if profile.user_type != Profile.Type.COMPANY:
        return profile, redirect("private_page")
    return profile, None

def _get_company_emails_session(request):
    emails = request.session.get("company_employee_emails")
    if not isinstance(emails, list):
        emails = []

    # normalizza + deduplica
    seen = set()
    cleaned = []
    for e in emails:
        if not isinstance(e, str):
            continue
        e2 = e.strip().lower()
        if e2 and e2 not in seen:
            seen.add(e2)
            cleaned.append(e2)

    request.session["company_employee_emails"] = cleaned
    return cleaned

@login_required
def add_employee_email(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    profile, redir = _company_required(request)
    if redir:
        return redir

    email = (request.POST.get("email") or "").strip().lower()
    if not email:
        messages.error(request, "Inserisci un'email.")
        return redirect("dashboard")

    try:
        validate_email(email)
    except Exception:
        messages.error(request, "Formato email non valido.")
        return redirect("dashboard")

    User = get_user_model()
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        messages.error(request, "Quell'email non risulta registrata (puoi aggiungere solo utenti già iscritti).")
        return redirect("dashboard")

    u_profile = Profile.objects.filter(user=user).first()
    if u_profile and u_profile.user_type == Profile.Type.COMPANY:
        messages.error(request, "Quell'utente è un account Azienda. Aggiungi solo dipendenti (account Privato).")
        return redirect("dashboard")

    emails = _get_company_emails_session(request)
    if email in emails:
        messages.info(request, "Email già presente nella lista.")
        return redirect("dashboard")

    emails.append(email)
    request.session["company_employee_emails"] = emails
    messages.success(request, "Email aggiunta (bozza in sessione, non è ancora un'associazione definitiva).")
    return redirect("dashboard")

@login_required
def remove_employee_email(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    profile, redir = _company_required(request)
    if redir:
        return redir

    email = (request.POST.get("email") or "").strip().lower()
    emails = _get_company_emails_session(request)

    if email in emails:
        request.session["company_employee_emails"] = [e for e in emails if e != email]
        messages.success(request, "Email rimossa.")
    return redirect("dashboard")


@login_required
def dashboard(request):
    profile, redir = _company_required(request)
    if redir:
        return redir
    employee_emails = _get_company_emails_session(request)
    return render(request, "dashboard/dashboard.html", {
        "profile": profile,
        "employee_emails": employee_emails,
    })