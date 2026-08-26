from django.core.management.base import BaseCommand
from sante_app.models import Pathologie, Medecin, User

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        # Create sample specialties
        cardiologie, created = Pathologie.objects.get_or_create(
            nom='Cardiologie',
            defaults={'description': 'Spécialité cardiaque'}
        )
        dermatologie, created = Pathologie.objects.get_or_create(
            nom='Dermatologie',
            defaults={'description': 'Spécialité de la peau'}
        )
        pediatrie, created = Pathologie.objects.get_or_create(
            nom='Pédiatrie',
            defaults={'description': 'Spécialité enfants'}
        )
        neurologie, created = Pathologie.objects.get_or_create(
            nom='Neurologie',
            defaults={'description': 'Spécialité du système nerveux'}
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created/Updated {Pathologie.objects.count()} specialties')
        )
        
        # Create sample doctors
        # First, get or create users for doctors
        user1, created = User.objects.get_or_create(
            username='dr_martin',
            defaults={
                'first_name': 'Martin',
                'last_name': 'Dubois',
                'email': 'martin.dubois@hospital.com',
                'role': 'medecin'
            }
        )
        
        user2, created = User.objects.get_or_create(
            username='dr_bernard',
            defaults={
                'first_name': 'Bernard',
                'last_name': 'Leroy',
                'email': 'bernard.leroy@hospital.com',
                'role': 'medecin'
            }
        )
        
        user3, created = User.objects.get_or_create(
            username='dr_petit',
            defaults={
                'first_name': 'Petit',
                'last_name': 'Moreau',
                'email': 'petit.moreau@hospital.com',
                'role': 'medecin'
            }
        )
        
        # Create doctors
        medecin1, created = Medecin.objects.get_or_create(
            user=user1,
            defaults={
                'specialite': 'Cardiologie',
                'disponibilite': True
            }
        )
        
        medecin2, created = Medecin.objects.get_or_create(
            user=user2,
            defaults={
                'specialite': 'Dermatologie',
                'disponibilite': True
            }
        )
        
        medecin3, created = Medecin.objects.get_or_create(
            user=user3,
            defaults={
                'specialite': 'Pédiatrie',
                'disponibilite': True
            }
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created/Updated {Medecin.objects.count()} doctors')
        )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated sample data')
        )