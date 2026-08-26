import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Sante_Virtuelle'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from django.contrib.auth import get_user_model
from sante_app.permissions import IsMedecin
from sante_app.views import MedecinViewSet
from django.http import HttpRequest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from rest_framework.response import Response

User = get_user_model()

def test_user_19_permissions():
    print("=== TESTING USER 19 PERMISSIONS ===")
    try:
        user = User.objects.get(id=19)
        print(f"✓ User found: {user.username}")
        print(f"Role: {user.role}")
        print(f"Is authenticated: {user.is_authenticated}")
        print(f"Is active: {user.is_active}")
        
        # Test IsMedecin permission with proper DRF request
        factory = APIRequestFactory()
        http_request = factory.get('/api/medecins/mes-disponibilites/')
        http_request.user = user
        request = Request(http_request)
        
        # Debug the permission check manually
        print(f"User is_authenticated: {user.is_authenticated}")
        print(f"User role: {user.role}")
        print(f"Role comparison: {user.role == 'medecin'}")
        
        # Test IsMedecin permission
        permission = IsMedecin()
        has_permission = permission.has_permission(request, None)
        print(f"IsMedecin permission: {has_permission}")
        
        # Manual check
        manual_check = user.is_authenticated and user.role == "medecin"
        print(f"Manual permission check: {manual_check}")
        
        if has_permission:
            print("✓ User 19 has proper permissions as a medecin")
        else:
            print("✗ User 19 does not have medecin permissions")
            
    except User.DoesNotExist:
        print("✗ User 19 does not exist!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

def test_mes_disponibilites_endpoint():
    print("\n=== TESTING MES DISPONIBILITES ENDPOINT ===")
    try:
        user = User.objects.get(id=19)
        print(f"✓ User found: {user.username}")
        
        # Create a mock request like the API would receive
        factory = APIRequestFactory()
        http_request = factory.get('/api/medecins/mes-disponibilites/')
        http_request.user = user
        
        # Create viewset instance
        viewset = MedecinViewSet()
        viewset.request = Request(http_request)
        viewset.format_kwarg = None
        
        # Call the mes_disponibilites action
        response = viewset.mes_disponibilites(viewset.request)
        print(f"Response status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"Response data keys: {list(response.data.keys()) if isinstance(response.data, dict) else 'Not a dict'}")
            if 'success' in response.data:
                print(f"Success: {response.data['success']}")
            if 'disponibilites' in response.data:
                print(f"Number of disponibilites: {len(response.data['disponibilites'])}")
        else:
            print(f"Response: {response}")
            
    except User.DoesNotExist:
        print("✗ User 19 does not exist!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_19_permissions()
    test_mes_disponibilites_endpoint()