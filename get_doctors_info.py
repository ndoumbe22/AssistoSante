import requests
import json

# Get doctors from API
try:
    r = requests.get('http://localhost:8000/api/medecins/')
    doctors = r.json()
    
    print('Doctors in database:')
    print('====================')
    for d in doctors:
        print(f'- Dr. {d["user"]["first_name"]} {d["user"]["last_name"]}')
        print(f'  Username: {d["user"]["username"]}')
        print(f'  Specialty: {d["specialite"]}')
        print()
        
except Exception as e:
    print(f"Error fetching doctors: {e}")