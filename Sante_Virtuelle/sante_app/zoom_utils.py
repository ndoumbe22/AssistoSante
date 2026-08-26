# zoom_utils.py

import requests
from datetime import datetime, timedelta
import pytz
from django.conf import settings
from django.utils import timezone as dj_timezone
from .models import ZoomToken, RendezVous
from django.core.mail import send_mail


# ==========================
# Obtenir un token OAuth Zoom valide (Account-Level)
# ==========================
def get_zoom_access_token():
    """
    Récupère un token OAuth Zoom valide.
    Stocke le token dans la base pour éviter de le régénérer à chaque fois.
    """
    # Vérifie s'il existe déjà un token encore valide
    token_obj = ZoomToken.objects.filter(expires_at__gt=dj_timezone.now()).first()
    if token_obj:
        return token_obj.access_token

    # Générer un nouveau token via l'API Zoom
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={settings.ZOOM_ACCOUNT_ID}"
    auth = (settings.ZOOM_CLIENT_ID, settings.ZOOM_CLIENT_SECRET)
    response = requests.post(url, auth=auth)
    data = response.json()

    access_token = data.get("access_token")
    expires_in = data.get("expires_in", 3600)

    if not access_token:
        raise Exception(f"Impossible d'obtenir le token Zoom : {data}")

    # Stocker le token dans la base
    expires_at = dj_timezone.now() + timedelta(seconds=expires_in - 60)
    ZoomToken.objects.all().delete()  # Supprimer l'ancien token pour éviter les doublons
    ZoomToken.objects.create(access_token=access_token, expires_at=expires_at)

    return access_token


# ==========================
# Créer une réunion Zoom pour un RDV
# ==========================
def create_zoom_meeting(rdv: RendezVous):
    """
    Crée une réunion Zoom pour le RDV donné.
    Retourne le JSON de la réunion ou une erreur.
    """
    token = get_zoom_access_token()
    url = f"https://api.zoom.us/v2/users/{settings.ZOOM_USER_ID}/meetings"

    # ==========================
    # Gestion timezone locale et conversion en UTC
    # ==========================
    tz_local = pytz.timezone("Africa/Dakar")
    start_time_local = tz_local.localize(datetime.combine(rdv.date, rdv.heure))
    start_time_utc = start_time_local.astimezone(pytz.utc).isoformat()

    # ==========================
    # Récupération du profil médecin
    # ==========================
    # Si ton modèle RendezVous contient un champ ForeignKey vers Medecin :
    if hasattr(rdv.medecin, "specialite"):
        specialite = rdv.medecin.specialite
    else:
        specialite = "Médecin"

    # ==========================
    # Création du payload pour l'API Zoom
    # ==========================
    payload = {
        "topic": f"Consultation avec {rdv.patient.username} ({specialite})",
        "type": 2,  # Réunion planifiée
        "start_time": start_time_utc,
        "duration": getattr(rdv, "duree", 30),  # durée par défaut 30 min
        "timezone": "Africa/Dakar",
        "settings": {
            "host_video": True,
            "participant_video": True,
            "waiting_room": True,
            "join_before_host": False
        }
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, json=payload)

    # ==========================
    # Vérifier le résultat de l'appel API
    # ==========================
    if response.status_code != 201:
        return {"error": response.json()}

    meeting_data = response.json()

    # ==========================
    # Mise à jour du RDV avec les infos Zoom
    # ==========================
    rdv.zoom_start_url = meeting_data.get("start_url", "")[:200]
    rdv.zoom_join_url = meeting_data.get("join_url", "")[:200]
    rdv.zoom_meeting_id = meeting_data.get("id")
    rdv.zoom_password = meeting_data.get("password", "")
    rdv.save()


    # ==========================
    # 🔔 Notification patient par email
    # ==========================
    sujet = "Lien de votre téléconsultation médicale"
    message = f"""
Bonjour {rdv.patient.username},

Votre consultation avec le Dr {rdv.medecin.username} est programmée.

📅 Date : {rdv.date.strftime('%d/%m/%Y')}
🕒 Heure : {rdv.heure.strftime('%H:%M')}
💻 Lien Zoom : {rdv.zoom_join_url}

Veuillez cliquer sur le lien quelques minutes avant le début de la séance.

Merci,
L’équipe Santé Virtuelle
"""

    try:
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [rdv.patient.email],
            fail_silently=False
        )
        print("Email envoyé avec succès à", rdv.patient.email)
    except Exception as e:
        print("Erreur envoi mail patient :", e)

    return meeting_data
