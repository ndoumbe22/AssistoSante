import os
import sys
import django
from django.conf import settings
from django.test import Client
from django.urls import reverse

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

# Create a test client with proper host header
client = Client(HTTP_HOST='localhost')

print("=== COMPREHENSIVE ENDPOINT TEST ===")

# Test the prochains_creneaux endpoint
try:
    print("\n1. Testing prochains_creneaux endpoint:")
    url = '/api/medecins/23/prochains-creneaux/?limit=5'
    print(f"   URL: {url}")
    response = client.get(url, HTTP_HOST='localhost')
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
        print("   ✅ SUCCESS: Endpoint is working!")
    else:
        print(f"   Response Content: {response.content}")
        print("   ❌ FAILED: Endpoint returned error")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test the creneaux_disponibles endpoint
try:
    print("\n2. Testing creneaux_disponibles endpoint:")
    url = '/api/rendezvous/creneaux_disponibles/?medecin_id=23&date=2025-10-26'
    print(f"   URL: {url}")
    response = client.get(url, HTTP_HOST='localhost')
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
        print("   ✅ SUCCESS: Endpoint is working!")
    else:
        print(f"   Response Content: {response.content}")
        print("   ❌ FAILED: Endpoint returned error")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n=== URL PATTERN VERIFICATION ===")
from django.urls import resolve, Resolver404

# Verify URL resolution
test_urls = [
    '/api/medecins/23/prochains-creneaux/',
    '/api/rendezvous/creneaux_disponibles/'
]

for url in test_urls:
    try:
        match = resolve(url)
        print(f"✅ {url} -> Resolves to {match.func}")
    except Resolver404:
        print(f"❌ {url} -> NOT FOUND")
    except Exception as e:
        print(f"❌ {url} -> ERROR: {e}")

print("\n=== ROUTER REGISTRATION CHECK ===")
from sante_app.urls import router

print("Registered router patterns:")
for pattern in router.urls:
    pattern_str = str(pattern.pattern)
    if 'prochains_creneaux' in pattern_str or 'creneaux_disponibles' in pattern_str:
        print(f"✅ {pattern_str}")