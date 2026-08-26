from cryptography.fernet import Fernet
from django.conf import settings
import base64
import os

class DataEncryption:
    """Service de chiffrement des données sensibles"""

    @staticmethod
    def get_key():
        """Récupérer ou générer la clé de chiffrement"""
        # La clé doit être stockée dans les variables d'environnement
        key = getattr(settings, 'ENCRYPTION_KEY', None)

        if not key:
            # Générer une nouvelle clé (à faire une seule fois)
            key = Fernet.generate_key()
            print(f"⚠️  ENCRYPTION_KEY générée : {key.decode()}")
            print("⚠️  Ajoutez cette clé dans vos settings.py : ENCRYPTION_KEY = '{}'".format(key.decode()))

        return key if isinstance(key, bytes) else key.encode()

    @staticmethod
    def encrypt(data):
        """Chiffrer des données"""
        if not data:
            return None

        try:
            key = DataEncryption.get_key()
            f = Fernet(key)

            # Convertir en bytes si nécessaire
            if isinstance(data, str):
                data = data.encode()

            encrypted = f.encrypt(data)
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            print(f"Erreur chiffrement : {e}")
            return None

    @staticmethod
    def decrypt(encrypted_data):
        """Déchiffrer des données"""
        if not encrypted_data:
            return None

        try:
            key = DataEncryption.get_key()
            f = Fernet(key)

            # Décoder depuis base64
            encrypted = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = f.decrypt(encrypted)

            return decrypted.decode()
        except Exception as e:
            print(f"Erreur déchiffrement : {e}")
            return None


# Helper functions pour les modèles
def encrypt_field(value):
    """Helper pour chiffrer un champ"""
    return DataEncryption.encrypt(value) if value else None


def decrypt_field(value):
    """Helper pour déchiffrer un champ"""
    return DataEncryption.decrypt(value) if value else None
