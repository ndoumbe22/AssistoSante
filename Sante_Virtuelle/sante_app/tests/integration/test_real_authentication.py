import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User

class TestRealAuthentication:
    """Tests d'authentification avec vraies requêtes API"""
    
    def test_patient_registration_with_real_data(self, api_client, db):
        """Test inscription patient avec vraies données envoyées à l'API"""
        url = '/api/auth/register/'  # Using the actual URL from urls.py
        data = {
            'username': 'new_patient',
            'email': 'newpatient@test.com',
            'password': 'SecurePass123!',
            'confirmPassword': 'SecurePass123!',
            'first_name': 'Moussa',
            'last_name': 'Ba',
            'role': 'patient',
            'telephone': '771234567'
        }
        
        # VRAIE requête POST vers l'API
        response = api_client.post(url, data, format='json')
        
        # Vérifications avec vraies données de la DB
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'id' in response.data['user']
        
        # Vérifier que l'utilisateur existe vraiment dans la DB
        assert User.objects.filter(username='new_patient').exists()
        
        user = User.objects.get(username='new_patient')
        assert user.email == 'newpatient@test.com'
        assert user.first_name == 'Moussa'
        assert user.check_password('SecurePass123!')
    
    def test_login_returns_real_jwt_token(self, api_client, test_patient, db):
        """Test connexion retourne un vrai token JWT"""
        url = '/api/auth/login/'
        data = {
            'username': 'patient_test',
            'password': 'TestPass123!'
        }
        
        # VRAIE requête pour obtenir le token
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        
        # Vérifier que c'est un vrai token JWT valide
        token = response.data['access']
        assert len(token) > 50  # Les tokens JWT sont longs
        assert '.' in token  # Format JWT: header.payload.signature
    
    def test_access_protected_route_with_real_token(self, api_client, test_patient, db):
        """Test accès route protégée avec vrai token"""
        # 1. Obtenir un vrai token
        token_url = '/api/auth/login/'
        token_response = api_client.post(token_url, {
            'username': 'patient_test',
            'password': 'TestPass123!'
        })
        token = token_response.data['access']
        
        # 2. Utiliser le token pour accéder à une route protégée
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        protected_url = '/api/patients/'  # Using a real protected endpoint
        
        response = api_client.get(protected_url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_access_without_token_is_denied(self, api_client, db):
        """Test accès refusé sans token"""
        url = '/api/patients/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_expired_token_is_rejected(self, api_client, test_patient, db):
        """Test token expiré est rejeté"""
        # Créer un token expiré (nécessite configuration spéciale)
        from rest_framework_simplejwt.tokens import AccessToken
        from datetime import timedelta
        
        token = AccessToken.for_user(test_patient)
        token.set_exp(lifetime=-timedelta(hours=1))  # Token expiré
        
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(token)}')
        url = '/api/patients/'
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED