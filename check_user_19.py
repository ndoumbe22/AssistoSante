import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Sante_Virtuelle'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from django.contrib.auth import get_user_model
from sante_app.models import Medecin

User = get_user_model()

# Check user 19
print("=== CHECKING USER 19 ===")
try:
    user = User.objects.get(id=19)
    print(f"✓ User found: {user.username}")
    print(f"Role: {user.role}")
    print(f"Has medecin attribute: {hasattr(user, 'medecin')}")
    
    if hasattr(user, 'medecin'):
        medecin = user.medecin
        print(f"Medecin ID: {medecin.id}")
        print(f"Specialite: {medecin.specialite}")
    else:
        print("✗ No medecin attribute found!")
        # Check if there's a Medecin object with user_id=19
        medecins = Medecin.objects.filter(user_id=19)
        if medecins.exists():
            print(f"Found Medecin objects with user_id=19: {[m.id for m in medecins]}")
        else:
            print("No Medecin objects found with user_id=19")
        
except User.DoesNotExist:
    print("✗ User 19 does not exist!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()