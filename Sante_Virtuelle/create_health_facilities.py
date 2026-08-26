from sante_app.models import Clinique, Pharmacie

# Create sample clinics
cliniques_data = [
    {
        "nom": "Clinique Médicale du Soleil",
        "adresse": "15 Avenue Cheikh Anta Diop, Dakar",
        "telephone": "+221 33 123 45 67",
        "email": "contact@clinique-soleil.sn",
        "latitude": 14.6937,
        "longitude": -17.4440
    },
    {
        "nom": "Centre de Santé Familiale",
        "adresse": "45 Boulevard Martin Luther King, Dakar",
        "telephone": "+221 33 234 56 78",
        "email": "info@csf-dakar.sn",
        "latitude": 14.7128,
        "longitude": -17.4560
    },
    {
        "nom": "Clinique Internationale de Dakar",
        "adresse": "12 Rue Georges Pompidou, Dakar",
        "telephone": "+221 33 345 67 89",
        "email": "contact@cid.sn",
        "latitude": 14.6789,
        "longitude": -17.4321
    },
    {
        "nom": "Clinique du Bon Pasteur",
        "adresse": "8 Avenue Léopold Sédar Senghor, Dakar",
        "telephone": "+221 33 456 78 90",
        "email": "bonpasteur@clinique.sn",
        "latitude": 14.6850,
        "longitude": -17.4200
    },
    {
        "nom": "Centre Médical Saint-Louis",
        "adresse": "23 Rue Président Diouf, Dakar",
        "telephone": "+221 33 567 89 01",
        "email": "contact@cmsl.sn",
        "latitude": 14.6500,
        "longitude": -17.4000
    }
]

# Create sample pharmacies
pharmacies_data = [
    {
        "nom": "Pharmacie du Centre",
        "adresse": "10 Place de l'Indépendance, Dakar",
        "telephone": "+221 33 111 22 33",
        "email": "pharmacie-centre@pharmacie.sn",
        "ouvert_24h": True,
        "latitude": 14.6900,
        "longitude": -17.4400
    },
    {
        "nom": "Pharmacie de la Gare",
        "adresse": "5 Avenue Georges Brassens, Dakar",
        "telephone": "+221 33 222 33 44",
        "email": "gare@pharmacie.sn",
        "ouvert_24h": False,
        "latitude": 14.6750,
        "longitude": -17.4300
    },
    {
        "nom": "Pharmacie Saint-Michel",
        "adresse": "30 Rue Saint-Michel, Dakar",
        "telephone": "+221 33 333 44 55",
        "email": "st-michel@pharmacie.sn",
        "ouvert_24h": True,
        "latitude": 14.6800,
        "longitude": -17.4500
    },
    {
        "nom": "Pharmacie de l'Université",
        "adresse": "Université Cheikh Anta Diop, Dakar",
        "telephone": "+221 33 444 55 66",
        "email": "universite@pharmacie.sn",
        "ouvert_24h": False,
        "latitude": 14.6950,
        "longitude": -17.4600
    },
    {
        "nom": "Pharmacie du Marché",
        "adresse": "Marché HLM, Dakar",
        "telephone": "+221 33 555 66 77",
        "email": "marche@pharmacie.sn",
        "ouvert_24h": True,
        "latitude": 14.7000,
        "longitude": -17.4700
    },
    {
        "nom": "Pharmacie Centrale",
        "adresse": "Place du Souvenir Africain, Dakar",
        "telephone": "+221 33 666 77 88",
        "email": "centrale@pharmacie.sn",
        "ouvert_24h": False,
        "latitude": 14.6850,
        "longitude": -17.4350
    },
    {
        "nom": "Pharmacie de Ngor",
        "adresse": "Île de Ngor, Dakar",
        "telephone": "+221 33 777 88 99",
        "email": "ngor@pharmacie.sn",
        "ouvert_24h": True,
        "latitude": 14.7500,
        "longitude": -17.3800
    },
    {
        "nom": "Pharmacie du Plateau",
        "adresse": "Plateau, Dakar",
        "telephone": "+221 33 888 99 00",
        "email": "plateau@pharmacie.sn",
        "ouvert_24h": False,
        "latitude": 14.6600,
        "longitude": -17.4250
    }
]

# Create clinics
for clinique_data in cliniques_data:
    clinique, created = Clinique.objects.get_or_create(
        nom=clinique_data["nom"],
        defaults=clinique_data
    )
    if created:
        print(f"Created clinic: {clinique.nom}")

# Create pharmacies
for pharmacie_data in pharmacies_data:
    pharmacie, created = Pharmacie.objects.get_or_create(
        nom=pharmacie_data["nom"],
        defaults=pharmacie_data
    )
    if created:
        print(f"Created pharmacy: {pharmacie.nom}")

print(f"Total clinics: {Clinique.objects.count()}")
print(f"Total pharmacies: {Pharmacie.objects.count()}")