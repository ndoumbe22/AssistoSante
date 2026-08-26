from rest_framework.permissions import BasePermission, SAFE_METHODS

# --------------------
# Permissions par rôle global
# --------------------

class IsAdmin(BasePermission):
    """Autorise uniquement les Admins"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsMedecin(BasePermission):
    """Autorise uniquement les Médecins"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "medecin"


class IsPatient(BasePermission):
    """Autorise uniquement les Patients"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "patient"


# --------------------
# Permissions spécifiques aux objets
# --------------------

class IsOwnerPatient(BasePermission):
    """Un patient peut accéder/modifier uniquement ses propres infos"""
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and obj == request.user


class IsOwnerRendezVous(BasePermission):
    """Un patient peut voir ses RDV, un médecin ses RDV, admin voit tout"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "patient":
            return obj.patient == request.user
        elif request.user.role == "medecin":
            return obj.medecin == request.user
        elif request.user.role == "admin":
            return True
        return False


class IsOwnerConsultation(BasePermission):
    """Un médecin peut modifier seulement ses consultations"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "medecin":
            return obj.medecin == request.user
        elif request.user.role == "patient":
            # un patient peut lire ses consultations mais pas modifier
            return obj.patient == request.user and request.method in SAFE_METHODS
        elif request.user.role == "admin":
            return True
        return False


class IsAdminOrReadOnly(BasePermission):
    """Lecture autorisée à tous les authentifiés, écriture réservée à l’admin"""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == "admin"
