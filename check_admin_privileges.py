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

def check_admin_privileges():
    try:
        # Look for users with is_staff or is_superuser flags
        admin_privileged_users = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        
        print("Users with administrative privileges:")
        print("=" * 40)
        
        if admin_privileged_users:
            for user in admin_privileged_users:
                print(f"- {user.username} ({user.first_name} {user.last_name})")
                print(f"  Role: {user.role}")
                print(f"  Is Staff: {user.is_staff}")
                print(f"  Is Superuser: {user.is_superuser}")
                print()
        else:
            print("No users found with is_staff or is_superuser privileges")
            
        # Specifically check the 'admin' user
        try:
            admin_user = User.objects.get(username='admin')
            print("\nDetails for 'admin' user:")
            print("-" * 25)
            print(f"Username: {admin_user.username}")
            print(f"Role: {admin_user.role}")
            print(f"Is Staff: {admin_user.is_staff}")
            print(f"Is Superuser: {admin_user.is_superuser}")
            print(f"Email: {admin_user.email}")
        except User.DoesNotExist:
            print("\nNo user found with username 'admin'")
            
    except Exception as e:
        print(f"Error checking admin privileges: {str(e)}")

if __name__ == "__main__":
    check_admin_privileges()