import os
import sys
import django
from django.conf import settings
from django.urls import resolve, reverse, NoReverseMatch
from django.urls.exceptions import Resolver404

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

print("Testing URL resolution...")

# Test if we can resolve the URLs
try:
    # Test prochains_creneaux URL
    url = '/api/medecins/23/prochains-creneaux/'
    print(f"Testing URL resolution for: {url}")
    match = resolve(url)
    print(f"  Matched view: {match.func}")
    print(f"  Matched args: {match.args}")
    print(f"  Matched kwargs: {match.kwargs}")
    print(f"  Matched URL name: {match.url_name}")
except Resolver404 as e:
    print(f"  URL not found: {e}")
except Exception as e:
    print(f"  Error resolving URL: {e}")

try:
    # Test creneaux_disponibles URL
    url = '/api/rendezvous/creneaux_disponibles/'
    print(f"\nTesting URL resolution for: {url}")
    match = resolve(url)
    print(f"  Matched view: {match.func}")
    print(f"  Matched args: {match.args}")
    print(f"  Matched kwargs: {match.kwargs}")
    print(f"  Matched URL name: {match.url_name}")
except Resolver404 as e:
    print(f"  URL not found: {e}")
except Exception as e:
    print(f"  Error resolving URL: {e}")

# Test reverse URL lookup
try:
    print("\nTesting reverse URL lookup...")
    # We need to check what the actual URL names are
    from sante_app.urls import router
    print("Router URL patterns:")
    for url_pattern in router.urls:
        print(f"  Pattern: {url_pattern.pattern}, Name: {getattr(url_pattern, 'name', 'No name')}")
except Exception as e:
    print(f"  Error with reverse lookup: {e}")