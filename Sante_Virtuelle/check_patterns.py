import os
import sys
import django

# Add project to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

from sante_app.urls import router

print("Checking prochains_creneaux URL patterns:")
patterns = [str(url.pattern) for url in router.urls if 'prochains' in str(url.pattern)]
for pattern in patterns:
    print(f"  {pattern}")