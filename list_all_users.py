import os
import sys
import django

# Add the project directory to the Python path
project_path = os.path.join(os.getcwd(), 'Sante_Virtuelle')
sys.path.append(project_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from sante_app.models import User

def list_all_users():
    try:
        users = User.objects.all()
        print("All users in the system:")
        print("=" * 30)
        
        admin_users = []
        doctor_users = []
        patient_users = []
        
        for user in users:
            print(f"- {user.username} ({user.first_name} {user.last_name}) - Role: {user.role}")
            
            if user.role == 'admin':
                admin_users.append(user)
            elif user.role == 'medecin':
                doctor_users.append(user)
            elif user.role == 'patient':
                patient_users.append(user)
        
        print(f"\nSummary:")
        print(f"- Admin users: {len(admin_users)}")
        print(f"- Doctor users: {len(doctor_users)}")
        print(f"- Patient users: {len(patient_users)}")
        print(f"- Total users: {len(users)}")
        
        return users
    except Exception as e:
        print(f"Error listing users: {str(e)}")
        return []

if __name__ == "__main__":
    list_all_users()