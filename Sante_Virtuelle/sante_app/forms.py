from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User, Patient, Medecin, RendezVous, Consultation, MessageContact


# -------------------- Création d’utilisateur --------------------
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "password1", "password2")


# -------------------- Formulaire Patient --------------------
class PatientForm(forms.ModelForm):
    class Meta:
        model = Patient
        fields = ("adresse",)


# -------------------- Formulaire Médecin --------------------
class MedecinForm(forms.ModelForm):
    class Meta:
        model = Medecin
        fields = ("specialite", "disponibilite")


# -------------------- Formulaire Rendez-vous --------------------
class RendezVousForm(forms.ModelForm):
    class Meta:
        model = RendezVous
        fields = ("description", "date", "heure", "patient", "medecin")

        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "heure": forms.TimeInput(attrs={"type": "time"}),
        }


# -------------------- Formulaire Consultation --------------------
class ConsultationForm(forms.ModelForm):
    class Meta:
        model = Consultation
        fields = ("date", "heure", "patient", "medecin", "rendez_vous")

        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "heure": forms.TimeInput(attrs={"type": "time"}),
        }


class MessageContactForm(forms.ModelForm):
    class Meta:
        model = MessageContact
        fields = ['nom', 'email', 'sujet', 'message']
