import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

# Now we can import and check the URLs
from sante_app.urls import router

print("Registered URLs in router:")
for url in router.urls:
    print(f"  {url.pattern}")