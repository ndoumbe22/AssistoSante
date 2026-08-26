import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Sante_Virtuelle'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from sante_app.models import User

def reset_doctor_passwords():
    # List of doctor usernames that failed login
    doctor_usernames = ["dr_martin", "dr_bernard"]
    default_password = "defaultpassword123"
    
    print("Resetting passwords for doctors...")
    print("=" * 40)
    
    for username in doctor_usernames:
        try:
            # Get the user
            user = User.objects.get(username=username)
            # Set the password
            user.set_password(default_password)
            user.save()
            print(f"✓ SUCCESS: Password reset for {username}")
        except User.DoesNotExist:
            print(f"✗ ERROR: User {username} does not exist")
        except Exception as e:
            print(f"✗ ERROR: Failed to reset password for {username}: {str(e)}")
    
    print("\nPassword reset complete!")
    print("All doctors can now log in with username and password: defaultpassword123")

if __name__ == "__main__":
    reset_doctor_passwords()