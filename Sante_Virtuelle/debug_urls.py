import os
import sys
import django

# Add project to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from django.urls import resolve, Resolver404

print("=== URL Resolution Debug ===")

# Test various URLs
test_urls = [
    '/api/medecins/23/',
    '/api/medecins/23/prochains-creneaux/',
    '/api/rendezvous/creneaux_disponibles/'
]

for url in test_urls:
    print(f"\nTesting: {url}")
    try:
        match = resolve(url)
        print(f"  ✅ Resolved to: {match.func}")
        print(f"  Args: {match.args}")
        print(f"  Kwargs: {match.kwargs}")
    except Resolver404 as e:
        print(f"  ❌ Not found: {e}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n=== Checking URL Pattern Order ===")
from sante_app.urls import router

print("Medecin-related patterns in order:")
for i, url_pattern in enumerate(router.urls):
    pattern_str = str(url_pattern.pattern)
    if 'medecin' in pattern_str or 'prochains' in pattern_str:
        print(f"  {i}: {pattern_str}")