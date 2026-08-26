from django.core.management.base import BaseCommand
from django.urls import resolve, Resolver404
from django.test import Client

class Command(BaseCommand):
    help = 'Test appointment scheduling routes'

    def handle(self, *args, **options):
        self.stdout.write("=== Testing Appointment Scheduling Routes ===")
        
        # Test URL resolution
        test_urls = [
            '/api/medecins/23/prochains-creneaux/',
            '/api/rendezvous/creneaux_disponibles/'
        ]
        
        for url in test_urls:
            try:
                match = resolve(url)
                self.stdout.write(self.style.SUCCESS(f"✅ {url} -> Resolves to {match.func}"))
            except Resolver404:
                self.stdout.write(self.style.ERROR(f"❌ {url} -> NOT FOUND"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ {url} -> ERROR: {e}"))
        
        # Test actual HTTP requests
        client = Client()
        
        self.stdout.write("\n=== Testing HTTP Requests ===")
        
        # Test prochains_creneaux
        try:
            response = client.get('/api/medecins/23/prochains-creneaux/', HTTP_HOST='localhost')
            self.stdout.write(f"Prochains creneaux status: {response.status_code}")
            if response.status_code != 200:
                self.stdout.write(f"Response content: {response.content[:200]}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error testing prochains_creneaux: {e}"))
            
        # Test creneaux_disponibles
        try:
            response = client.get('/api/rendezvous/creneaux_disponibles/?medecin_id=23&date=2025-10-26', HTTP_HOST='localhost')
            self.stdout.write(f"Creneaux disponibles status: {response.status_code}")
            if response.status_code != 200:
                self.stdout.write(f"Response content: {response.content[:200]}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error testing creneaux_disponibles: {e}"))