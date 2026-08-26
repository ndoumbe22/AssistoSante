from sante_app.models import Pathologie, Medecin, User

# Create sample specialties
p1 = Pathologie.objects.get_or_create(
    nom='Cardiologie',
    defaults={'description': 'Spécialité cardiaque'}
)[0]

p2 = Pathologie.objects.get_or_create(
    nom='Dermatologie',
    defaults={'description': 'Spécialité de la peau'}
)[0]

p3 = Pathologie.objects.get_or_create(
    nom='Pédiatrie',
    defaults={'description': 'Spécialité enfants'}
)[0]

print(f'Created/Updated {Pathologie.objects.count()} specialties')

# Create sample users for doctors
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

print(f'Created/Updated {Medecin.objects.count()} doctors')
print('Successfully populated sample data')