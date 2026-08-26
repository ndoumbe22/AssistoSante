import requests

# Login as admin
login_data = {'username': 'admin', 'password': 'admin123'}
r = requests.post('http://localhost:8000/api/auth/login/', data=login_data)

if r.status_code == 200:
    token = r.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to get users (this might fail if the endpoint doesn't exist)
    try:
        users_r = requests.get('http://localhost:8000/api/users/', headers=headers)
        print('Users endpoint status:', users_r.status_code)
        
        if users_r.status_code == 200:
            data = users_r.json()
            print('Number of users:', len(data))
            
            # Filter for admin users
            admins = [u for u in data if u.get('role') == 'admin']
            print('Admin users:', len(admins))
            
            for admin in admins:
                print(f'- {admin["username"]} ({admin["role"]})')
        else:
            print('Could not retrieve users:', users_r.text)
    except Exception as e:
        print('Error accessing users endpoint:', str(e))
        
    # Try to get current user info
    try:
        user_r = requests.get('http://localhost:8000/api/users/profile/', headers=headers)
        if user_r.status_code == 200:
            user_data = user_r.json()
            print('\nCurrent user info:')
            print(f'- Username: {user_data["username"]}')
            print(f'- Role: {user_data["role"]}')
            print(f'- Email: {user_data["email"]}')
        else:
            print('Could not retrieve current user info:', user_r.text)
    except Exception as e:
        print('Error accessing user profile:', str(e))
else:
    print('Login failed:', r.json())