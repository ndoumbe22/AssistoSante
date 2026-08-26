# zoom_utils.py

import requests
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
import jwt
from .models import ZoomToken, RendezVous
from django.core.mail import send_mail

# ==========================
# Gestion token Zoom (OAuth ou JWT)
# ==========================
def get_zoom_access_token():
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={settings.ZOOM_ACCOUNT_ID}"
    auth = (settings.ZOOM_USER_ID, settings.ZOOM_API_SECRET)
    response = requests.post(url, auth=auth)
    data = response.json()
    access_token = data.get("access_token")
    if not access_token:
        raise Exception(f"Impossible d'obtenir le token Zoom : {data}")
    return access_token



def send_medication_reminder(email, medicament_name, dosage, quantity, heure):
    subject = f"Rappel Médicament: {medicament_name}"
    message = f"""
Bonjour,

C'est l'heure de prendre votre médicament :

- Médicament : {medicament_name}
- Dosage : {dosage}
- Quantité : {quantity} comprimé(s)
- Heure prévue : {heure}

Prenez soin de votre santé !
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )