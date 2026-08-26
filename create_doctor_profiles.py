import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Sante_Virtuelle'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from sante_app.models import User, Medecin

def create_doctor_profiles():
    # Doctor profiles to create
    doctors_data = [
        {
            "username": "dr_sophie",
            "email": "sophie.leroy@hospital.com",
            "first_name": "Sophie",
            "last_name": "Leroy",
            "specialite": "Pédiatrie",
            "disponibilite": True
        },
        {
            "username": "dr_antoine",
            "email": "antoine.dupont@hospital.com",
            "first_name": "Antoine",
            "last_name": "Dupont",
            "specialite": "Dermatologie",
            "disponibilite": True
        },
        {
            "username": "dr_marie",
            "email": "marie.petit@hospital.com",
            "first_name": "Marie",
            "last_name": "Petit",
            "specialite": "Gynécologie",
            "disponibilite": True
        },
        {
            "username": "dr_jean",
            "email": "jean.moreau@hospital.com",
            "first_name": "Jean",
            "last_name": "Moreau",
            "specialite": "Orthopédie",
            "disponibilite": True
        },
        {
            "username": "dr_isabelle",
            "email": "isabelle.lambert@hospital.com",
            "first_name": "Isabelle",
            "last_name": "Lambert",
            "specialite": "Neurologie",
            "disponibilite": True
        }
    ]
    
    created_doctors = []
    
    for doctor_data in doctors_data:
        try:
            # Create or get the user
            user, created = User.objects.get_or_create(
                username=doctor_data["username"],
                defaults={
                    "email": doctor_data["email"],
                    "first_name": doctor_data["first_name"],
                    "last_name": doctor_data["last_name"],
                    "role": "medecin"
                }
            )
            
            if created:
                # Set a default password
                user.set_password("defaultpassword123")
                user.save()
                print(f"Created user: {user.username}")
            else:
                print(f"User already exists: {user.username}")
            
            # Create or get the doctor profile
            medecin, created = Medecin.objects.get_or_create(
                user=user,
                defaults={
                    "specialite": doctor_data["specialite"],
                    "disponibilite": doctor_data["disponibilite"]
                }
            )
            
            if created:
                print(f"Created doctor profile: Dr. {user.first_name} {user.last_name} - {medecin.specialite}")
                created_doctors.append(medecin)
            else:
                print(f"Doctor profile already exists: Dr. {user.first_name} {user.last_name}")
                
        except Exception as e:
            print(f"Error creating doctor {doctor_data['username']}: {str(e)}")
    
    print(f"\nSuccessfully created {len(created_doctors)} new doctor profiles!")
    return created_doctors

if __name__ == "__main__":
    create_doctor_profiles()