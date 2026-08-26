import requests
import json

# Get doctors from API
r = requests.get('http://localhost:8000/api/medecins/')
doctors = r.json()

# Extract unique specialties
specialties = list(set([d['specialite'] for d in doctors]))
print('Available specialties:', specialties)

print('\nDoctors:')
for d in doctors:
    print(f'- Dr. {d["user"]["first_name"]} {d["user"]["last_name"]} ({d["specialite"]})')