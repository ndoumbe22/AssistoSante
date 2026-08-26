import pytest
from sante_app.models import User, Patient, Medecin, RendezVous, MedicalDocument, RappelMedicament

@pytest.fixture
def api_client():
    """Client API pour les tests"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def test_patient(db):
    """Créer un vrai patient dans la DB de test"""
    user = User.objects.create_user(
        username='patient_test',
        email='patient@test.com',
        password='TestPass123!',
        first_name='Amadou',
        last_name='Diallo',
        role='patient'
    )
    # Create patient profile
    patient_profile = Patient.objects.create(
        user=user,
        adresse='Dakar, Sénégal'
    )
    user.patient_profile = patient_profile
    return user

@pytest.fixture
def test_doctor(db):
    """Créer un vrai médecin dans la DB de test"""
    user = User.objects.create_user(
        username='doctor_test',
        email='doctor@test.com',
        password='TestPass123!',
        first_name='Dr. Fatou',
        last_name='Sow',
        role='medecin'
    )
    
    # Create doctor profile
    doctor_profile = Medecin.objects.create(
        user=user,
        specialite='Cardiologie',
        disponibilite=True
    )
    user.medecin = doctor_profile
    return user

@pytest.fixture
def authenticated_patient_client(api_client, test_patient):
    """Client authentifié en tant que patient"""
    api_client.force_authenticate(user=test_patient)
    return api_client

@pytest.fixture
def authenticated_doctor_client(api_client, test_doctor):
    """Client authentifié en tant que médecin"""
    api_client.force_authenticate(user=test_doctor)
    return api_client

@pytest.fixture
def sample_appointment(test_patient, test_doctor, db):
    """Créer un vrai rendez-vous dans la DB"""
    appointment = RendezVous.objects.create(
        patient=test_patient,
        medecin=test_doctor,
        date='2025-12-15',
        heure='10:00',
        description='Consultation cardiaque',
        statut='PENDING'
    )
    return appointment

@pytest.fixture
def sample_medical_document(test_patient, sample_appointment, db):
    """Créer un vrai document médical"""
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    file = SimpleUploadedFile(
        "test_document.pdf",
        b"file_content",
        content_type="application/pdf"
    )
    
    document = MedicalDocument.objects.create(
        rendez_vous=sample_appointment,
        uploaded_by=test_patient,
        file=file,
        document_type='Analyses médicales',
        description='Résultats analyses sanguines'
    )
    return document

@pytest.fixture
def sample_medication_reminder(test_patient, db):
    """Créer un vrai rappel de médicament"""
    from datetime import datetime, timedelta
    
    reminder = RappelMedicament.objects.create(
        patient=test_patient.patient_profile,  # Using the patient profile
        medicament='Paracétamol 500mg',
        dosage='2 comprimés',
        frequence='3 fois par jour',
        heure_rappel='10:00',
        date_debut=datetime.now().date(),
        actif=True
    )
    return reminder