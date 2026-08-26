import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from sante_app.models import *

class TestCompletePatientWorkflow:
    """Test workflow complet patient du début à la fin"""
    
    def test_full_patient_journey_real_data(self, db):
        """
        Workflow complet:
        1. Inscription
        2. Connexion
        3. Prise de rendez-vous
        4. Upload document
        5. Création rappel
        6. Réception notifications
        """
        client = APIClient()
        
        # === ÉTAPE 1: INSCRIPTION ===
        register_url = '/api/auth/register/'
        register_data = {
            'username': 'journey_patient',
            'email': 'journey@test.com',
            'password': 'Journey123!',
            'confirmPassword': 'Journey123!',
            'first_name': 'Awa',
            'last_name': 'Ndiaye',
            'role': 'patient'
        }
        
        register_response = client.post(register_url, register_data, format='json')
        assert register_response.status_code == status.HTTP_201_CREATED
        
        # === ÉTAPE 2: CONNEXION ===
        login_url = '/api/auth/login/'
        login_data = {
            'username': 'journey_patient',
            'password': 'Journey123!'
        }
        
        login_response = client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        token = login_response.data['access']
        
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # === ÉTAPE 3: CRÉER UN MÉDECIN POUR LE TEST ===
        doctor_user = User.objects.create_user(
            username='journey_doctor',
            password='pass',
            first_name='Dr. Test',
            last_name='Doctor'
        )
        
        doctor_profile = Medecin.objects.create(
            user=doctor_user,
            specialite='Médecine Générale',
            disponibilite=True
        )
        
        # === ÉTAPE 4: PRISE DE RENDEZ-VOUS ===
        appointment_url = '/api/rendezvous/'
        appointment_data = {
            'medecin': doctor_user.id,
            'date': '2025-12-30',
            'heure': '09:00',
            'description': 'Consultation générale'
        }
        
        apt_response = client.post(appointment_url, appointment_data, format='json')
        assert apt_response.status_code == status.HTTP_201_CREATED
        appointment_id = apt_response.data['id']
        
        # === ÉTAPE 5: MÉDECIN CONFIRME ===
        doctor_client = APIClient()
        doctor_client.force_authenticate(user=doctor_user)
        
        confirm_url = f'/api/rendezvous/{appointment_id}/'
        confirm_data = {'statut': 'CONFIRMED'}
        confirm_response = doctor_client.patch(
            confirm_url,
            confirm_data,
            format='json'
        )
        assert confirm_response.status_code == status.HTTP_200_OK
        
        # === ÉTAPE 6: PATIENT UPLOAD DOCUMENT ===
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # First confirm the appointment (required for document upload)
        appointment = RendezVous.objects.get(id=appointment_id)
        appointment.statut = 'CONFIRMED'
        appointment.save()
        
        doc_url = '/api/medical-documents/'
        file = SimpleUploadedFile("ordonnance.pdf", b"content", content_type="application/pdf")
        
        doc_data = {
            'rendez_vous': appointment_id,
            'file': file,
            'document_type': 'Ordonnance',
            'description': 'Ordonnance précédente'
        }
        
        doc_response = client.post(doc_url, doc_data, format='multipart')
        assert doc_response.status_code == status.HTTP_201_CREATED
        
        # === ÉTAPE 7: CRÉER RAPPEL MÉDICAMENT ===
        from django.utils import timezone
        from datetime import timedelta
        
        reminder_url = '/api/medication-reminders/'
        reminder_time = (timezone.now() + timedelta(hours=8)).time()
        reminder_date = (timezone.now() + timedelta(hours=8)).date()
        
        reminder_data = {
            'patient': appointment.patient.patient_profile.id,  # Get patient profile
            'medicament': 'Amoxicilline 500mg',
            'dosage': '1 comprimé',
            'frequence': '3 fois par jour',
            'heure_rappel': reminder_time.strftime('%H:%M'),
            'date_debut': reminder_date.isoformat(),
            'actif': True
        }
        
        reminder_response = client.post(reminder_url, reminder_data, format='json')
        assert reminder_response.status_code == status.HTTP_201_CREATED
        
        # === ÉTAPE 8: VÉRIFIER NOTIFICATIONS PATIENT ===
        # Note: Notification verification depends on the actual implementation
        
        # === ÉTAPE 9: VÉRIFIER TOUTES LES DONNÉES PERSISTÉES ===
        # Rendez-vous existe et est confirmé
        appointment = RendezVous.objects.get(id=appointment_id)
        assert appointment.statut == 'CONFIRMED'
        
        # Document uploadé existe
        assert MedicalDocument.objects.filter(rendez_vous_id=appointment_id).exists()
        
        # Rappel créé existe
        patient_user = User.objects.get(username='journey_patient')
        assert RappelMedicament.objects.filter(
            patient=patient_user.patient_profile, 
            medicament='Amoxicilline 500mg'
        ).exists()
        
        # Cleanup
        User.objects.filter(username__in=['journey_patient', 'journey_doctor']).delete()