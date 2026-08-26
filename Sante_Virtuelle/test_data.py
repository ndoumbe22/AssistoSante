import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

# Import models
from sante_app.models import Pathologie, Medecin, User
from django.contrib.auth import get_user_model

UserModel = get_user_model()

# Create specialties
print("Creating specialties...")
cardio, created = Pathologie.objects.get_or_create(
    nom='Cardiologie',
    defaults={'description': 'Spécialité cardiaque'}
)
print(f"Cardiologie: {created}")

dermato, created = Pathologie.objects.get_or_create(
    nom='Dermatologie',
    defaults={'description': 'Spécialité de la peau'}
)
print(f"Dermatologie: {created}")

pediatrie, created = Pathologie.objects.get_or_create(
    nom='Pédiatrie',
    defaults={'description': 'Spécialité enfants'}
)
print(f"Pédiatrie: {created}")

print(f"Total specialties: {Pathologie.objects.count()}")

# Create doctor users
print("Creating doctors...")
user1, created = UserModel.objects.get_or_create(
    username='dr_martin',
    defaults={
        'first_name': 'Martin',
        'last_name': 'Dubois',
        'email': 'martin.dubois@hospital.com',
        'role': 'medecin'
    }
)
print(f"Doctor user Martin: {created}")

# Create doctors
medecin1, created = Medecin.objects.get_or_create(
    user=user1,
    defaults={
        'specialite': 'Cardiologie',
        'disponibilite': True
    }
)
print(f"Doctor Martin: {created}")

print(f"Total doctors: {Medecin.objects.count()}")
print("Data population completed!")