import requests
import json

# Login as admin
login_data = {'username': 'admin', 'password': 'admin123'}
r = requests.post('http://localhost:8000/api/auth/login/', data=login_data)

if r.status_code == 200:
    print("Successfully logged in as admin")
    user_data = r.json()['user']
    print(f"Current user: {user_data['username']} (role: {user_data['role']})")
    
    # Get access token
    token = r.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to access admin endpoints
    admin_endpoints = [
        'medecins/',
        'patients/',
        'pathologies/',
        'rendezvous/',
        'articles/'
    ]
    
    print("\nTesting admin access to various endpoints:")
    for endpoint in admin_endpoints:
        try:
            response = requests.get(f'http://localhost:8000/api/{endpoint}', headers=headers)
            status = "ACCESS GRANTED" if response.status_code == 200 else f"ACCESS DENIED ({response.status_code})"
            print(f"- {endpoint}: {status}")
        except Exception as e:
            print(f"- {endpoint}: ERROR - {str(e)}")
    
    print("\nThis indicates the level of access for this user.")
else:
    print("Login failed:", r.json().get('error', 'Unknown error'))

# Also check if there are other potential admin users
print("\nTrying common admin usernames:")
admin_usernames = ['admin', 'administrator', 'superuser']
admin_passwords = ['admin123', 'admin', 'password', 'defaultpassword123']

for username in admin_usernames:
    for password in admin_passwords:
        try:
            login_data = {'username': username, 'password': password}
            r = requests.post('http://localhost:8000/api/auth/login/', data=login_data)
            if r.status_code == 200:
                user_data = r.json()['user']
                print(f"✓ FOUND: {username} (password: {password}) - Role: {user_data['role']}")
                break
        except:
            pass