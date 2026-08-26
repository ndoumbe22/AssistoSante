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

# Create a test client
client = Client()

print("Testing URL resolution...")

# Test the prochains_creneaux endpoint
try:
    url = '/api/medecins/23/prochains-creneaux/'
    print(f"Testing URL: {url}")
    response = client.get(url)
    print(f"Response status: {response.status_code}")
    print(f"Response content: {response.content[:200]}")
except Exception as e:
    print(f"Error testing prochains_creneaux: {e}")

# Test the creneaux_disponibles endpoint
try:
    url = '/api/rendezvous/creneaux_disponibles/?medecin_id=23&date=2025-10-26'
    print(f"Testing URL: {url}")
    response = client.get(url)
    print(f"Response status: {response.status_code}")
    print(f"Response content: {response.content[:200]}")
except Exception as e:
    print(f"Error testing creneaux_disponibles: {e}")