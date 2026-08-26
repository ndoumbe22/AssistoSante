from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Patient, Medecin, RendezVous, Consultation, Medicament,
    Pathologie, Traitement, Constante, Mesure, Article,
    StructureDeSante, Service, Clinique, Dentiste, Hopital, Pharmacie,
    ContactFooter, ChatbotConversation, RappelMedicament, HistoriquePriseMedicament,
    Urgence, NotificationUrgence, MedicalDocument, Rating, Conversation, Message, ChatbotKnowledgeBase, ConsultationMessage, Teleconsultation, DisponibiliteMedecin, IndisponibiliteMedecin, Notification, ChatbotConfig  # Added Notification
)
from datetime import datetime, timedelta

User = get_user_model()

# Utility function for robust conflict detection
def check_appointment_conflict(medecin_user, date_rdv, heure_rdv, duration_minutes, exclude_rdv_id=None):
    """
    Check if there's a conflict with existing appointments
    Returns tuple: (has_conflict, conflicting_appointment)
    """
    from .models import RendezVous, Medecin, DisponibiliteMedecin
    
    # Calculate time range for the new appointment
    new_start = datetime.combine(date_rdv, heure_rdv)
    new_end = new_start + timedelta(minutes=duration_minutes)
    
    # Get existing appointments for this doctor on this date
    existing_appointments = RendezVous.objects.filter(
        medecin=medecin_user,
        date=date_rdv,
        statut__in=['CONFIRMED', 'PENDING']
    )
    
    # Exclude the current appointment if we're updating
    if exclude_rdv_id:
        existing_appointments = existing_appointments.exclude(id=exclude_rdv_id)
    
    # Check each existing appointment for time overlap
    for appointment in existing_appointments:
        # Get the doctor's availability for this appointment's day to get the correct duration
        appt_jour_semaine = appointment.date.strftime('%A').lower()
        jour_mapping = {
            'monday': 'lundi',
            'tuesday': 'mardi',
            'wednesday': 'mercredi',
            'thursday': 'jeudi',
            'friday': 'vendredi',
            'saturday': 'samedi',
            'sunday': 'dimanche'
        }
        appt_jour_fr = jour_mapping.get(appt_jour_semaine, '')
        
        try:
            # Get the doctor's availability for this day to determine appointment duration
            medecin = Medecin.objects.get(user=medecin_user)
            appt_disponibilite = DisponibiliteMedecin.objects.get(
                medecin=medecin, 
                jour=appt_jour_fr, 
                actif=True
            )
            appt_duree = timedelta(minutes=appt_disponibilite.duree_consultation)
        except (Medecin.DoesNotExist, DisponibiliteMedecin.DoesNotExist):
            # Fallback to default 30 minutes if no availability found
            appt_duree = timedelta(minutes=30)
        
        # Calculate appointment time range
        appt_start = datetime.combine(appointment.date, appointment.heure)
        appt_end = appt_start + appt_duree
        
        # Check for time overlap using strict overlap detection
        # Two intervals [a,b) and [c,d) overlap if a < d and c < b
        if new_start < appt_end and appt_start < new_end:
            return True, appointment
    
    return False, None

# -------------------- User --------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile that includes doctor/patient specific information"""
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile']
        read_only_fields = ['id']
    
    def get_profile(self, obj):
        """Return profile-specific information based on user role"""
        if obj.role == 'medecin':
            try:
                medecin = Medecin.objects.get(user=obj)
                return {
                    'id': medecin.id,
                    'specialite': getattr(medecin, 'specialite', ''),
                    'adresse': getattr(medecin, 'adresse', ''),
                    'telephone': getattr(medecin, 'telephone', ''),
                }
            except Medecin.DoesNotExist:
                return None
        elif obj.role == 'patient':
            try:
                patient = Patient.objects.get(user=obj)
                return {
                    'id': patient.id,
                    'adresse': getattr(patient, 'adresse', ''),
                }
            except Patient.DoesNotExist:
                return None
        return None

# -------------------- Patient --------------------
class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer()  # Nested serializer

    class Meta:
        model = Patient
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'patient'
        user = UserSerializer.create(UserSerializer(), validated_data=user_data)
        patient = Patient.objects.create(user=user, **validated_data)
        return patient

# -------------------- Medecin --------------------
class MedecinSerializer(serializers.ModelSerializer):
    user = UserSerializer()  # Nested serializer

    class Meta:
        model = Medecin
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'medecin'
        user = UserSerializer.create(UserSerializer(), validated_data=user_data)
        medecin = Medecin.objects.create(user=user, **validated_data)
        return medecin

# Custom serializer for public doctor listings
class MedecinPublicSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # Add user ID
    
    class Meta:
        model = Medecin
        fields = ['id', 'user_id', 'first_name', 'last_name', 'specialite', 'disponibilite']

class ConsultationSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source="patient.user.get_full_name", read_only=True)
    medecin_nom = serializers.CharField(source="medecin.user.get_full_name", read_only=True)
    
    class Meta:
        model = Consultation
        fields = "__all__"


class ConsultationMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    
    class Meta:
        model = ConsultationMessage
        fields = ['id', 'consultation', 'sender', 'sender_name', 'content', 'timestamp', 'is_read']
        read_only_fields = ['timestamp', 'is_read']


class RendezVousSerializer(serializers.ModelSerializer):
    medecin_id = serializers.IntegerField(write_only=True, required=False)  # Make it optional
    medecin = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)  # Add medecin field
    medecin_nom = serializers.CharField(source="medecin.get_full_name", read_only=True)
    patient_nom = serializers.CharField(source="patient.get_full_name", read_only=True)
    original_date = serializers.DateField(read_only=True)
    original_heure = serializers.TimeField(read_only=True)
    # Add date_rdv field to handle combined datetime from frontend
    date_rdv = serializers.DateTimeField(write_only=True, required=False)
    # Add heure field to ensure it's properly validated (removed write_only=True)
    heure = serializers.TimeField(required=True)
    
    class Meta:
        model = RendezVous
        fields = [
            'numero', 'medecin_id', 'medecin', 'patient', 'date', 'heure', 'description', 'motif_consultation', 'statut', 
            'type_consultation', 'medecin_nom', 'patient_nom',
            'original_date', 'original_heure', 'date_creation', 'date_modification', 'date_rdv'
        ]
        # Remove 'date' and 'heure' from read_only_fields to allow them to be set during creation
        read_only_fields = ['patient', 'date_creation', 'date_modification', 'original_date', 'original_heure']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Formater l'heure au format HH:MM
        if instance.heure:
            data['heure'] = instance.heure.strftime('%H:%M')
        return data
    
    def to_internal_value(self, data):
        """Mapper les noms de champs du frontend vers le backend"""
        print("🔍 to_internal_value - Données reçues:", data)
        
        # Si le frontend envoie 'date_rdv', le mapper vers 'date'
        if 'date_rdv' in data and 'date' not in data:
            data['date'] = data.pop('date_rdv')
            print("🔄 Mapping date_rdv -> date:", data['date'])
        
        print("🔍 to_internal_value - Données après mapping:", data)
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        """
        Créer un nouveau rendez-vous avec validation des créneaux
        """
        print("=" * 80)
        print("📋 CRÉATION DE RENDEZ-VOUS")
        print("=" * 80)
        
        # DEBUG: Afficher les validated_data
        print("DEBUG validated_data:", validated_data)
        print("DEBUG date présent ?", 'date' in validated_data)
        
        # 1. Récupérer les données
        medecin_id = self.initial_data.get('medecin_id')
        date_rdv = validated_data.get('date')
        heure_rdv = validated_data.get('heure')  # Le frontend envoie 'heure', pas 'heure_rdv'
        
        print(f"🔍 Données reçues:")
        print(f"  - medecin_id (user_id): {medecin_id}")
        print(f"  - date: {date_rdv}")
        print(f"  - heure: {heure_rdv}")
        
        # Vérification que la date est présente
        if not date_rdv:
            raise serializers.ValidationError({
                "date": "La date du rendez-vous est obligatoire"
            })
        
        # Vérification que l'heure est présente
        if not heure_rdv:
            raise serializers.ValidationError({
                "heure": "L'heure du rendez-vous est obligatoire"
            })
        
        if not medecin_id:
            raise serializers.ValidationError({'medecin_id': 'ID médecin requis'})
        
        # 2. Récupérer le médecin par son user_id (CRITIQUE)
        try:
            from sante_app.models import Medecin
            medecin = Medecin.objects.get(user_id=medecin_id)  # ✅ user_id, pas id
            print(f"✅ Médecin trouvé: Dr. {medecin.user.get_full_name()} (Medecin ID: {medecin.id}, User ID: {medecin.user.id})")
        except Medecin.DoesNotExist:
            print(f"❌ Médecin non trouvé avec user_id={medecin_id}")
            raise serializers.ValidationError({'medecin_id': 'Médecin non trouvé'})
        
        # 3. Convertir l'heure en string HH:MM
        if isinstance(heure_rdv, str):
            heure_str = heure_rdv[:5]
        else:
            # Ajout de vérification pour éviter l'erreur AttributeError
            try:
                heure_str = heure_rdv.strftime('%H:%M')
            except AttributeError:
                raise serializers.ValidationError({
                    "heure": "Format d'heure invalide"
                })
        
        print(f"🔍 Vérification des conflits pour: {date_rdv} à {heure_str}")
        
        # 4. Vérifier les conflits
        from sante_app.models import RendezVous
        rdvs_existants = RendezVous.objects.filter(
            medecin=medecin.user,  # medecin.user est l'objet User
            date=date_rdv,
            statut__in=['PENDING', 'CONFIRMED']
        )
        
        print(f"📊 Rendez-vous existants ce jour: {rdvs_existants.count()}")
        
        conflit_trouve = False
        for rdv in rdvs_existants:
            rdv_heure_str = rdv.heure.strftime('%H:%M')
            print(f"  - RDV #{rdv.numero}: {rdv_heure_str} (Statut: {rdv.statut})")
            
            if rdv_heure_str == heure_str:
                print(f"❌ CONFLIT avec RDV #{rdv.numero}")
                conflit_trouve = True
                break
        
        if conflit_trouve:
            raise serializers.ValidationError({
                'heure': 'Ce créneau est déjà réservé'
            })
        
        print("✅ Aucun conflit détecté")
        
        # 5. Récupérer le patient
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentification requise")
        
        try:
            # Try to get the patient profile
            patient = request.user.patient_profile
            print(f"✅ Patient trouvé: {patient}")
        except AttributeError:
            # If patient_profile doesn't exist, try to create one
            print(f"⚠️ Patient profile non trouvé pour user {request.user.id}, tentative de création...")
            from .models import Patient
            try:
                patient = Patient.objects.create(
                    user=request.user,
                    adresse=getattr(request.user, 'adresse', '')
                )
                print(f"✅ Patient profile créé: {patient}")
            except Exception as e:
                print(f"❌ Erreur création patient profile: {e}")
                raise serializers.ValidationError("Impossible de créer le profil patient")
        except Exception as e:
            print(f"❌ Erreur récupération patient: {e}")
            raise serializers.ValidationError("Utilisateur non patient")
        
        # 6. Ajouter le médecin (objet User) aux validated_data
        validated_data['medecin'] = medecin.user
        validated_data['patient'] = patient.user
        
        # 7. Créer le rendez-vous
        rdv = super().create(validated_data)
        
        print(f"✅ RDV créé - ID: {rdv.numero}, Médecin: {rdv.medecin.get_full_name()}, Date: {rdv.date}, Heure: {rdv.heure}")
        print("=" * 80)
        
        return rdv

class PathologieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathologie
        fields = "__all__"

class MedicamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicament
        fields = "__all__"

class TraitementSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source="medicament.nom", read_only=True)
    medicament_dosage = serializers.CharField(source="medicament.dosage", read_only=True)
    consultation_date = serializers.DateTimeField(source="consultation.date", read_only=True)

    class Meta:
        model = Traitement
        fields = ["id", "medicament_nom", "medicament_dosage", "posologie", "consultation_date"]

class ConstanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Constante
        fields = "__all__"

class MesureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesure
        fields = "__all__"

class ArticleSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()
    auteur_specialite = serializers.SerializerMethodField()
    peut_modifier = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = '__all__'
        read_only_fields = ['slug', 'date_publication', 'date_modification', 'vues', 'valide_par', 'date_validation', 'auteur']

    def get_auteur_nom(self, obj):
        return f"Dr. {obj.auteur.user.first_name} {obj.auteur.user.last_name}"

    def get_auteur_specialite(self, obj):
        return obj.auteur.specialite

    def get_peut_modifier(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user.role == 'medecin':
            try:
                medecin = Medecin.objects.get(user=request.user)
                return obj.auteur == medecin and obj.statut in ['brouillon', 'refuse']
            except Medecin.DoesNotExist:
                return False
        return request.user.role == 'admin'

    def create(self, validated_data):
        # Ensure the author is properly set
        if 'auteur' not in validated_data:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                try:
                    medecin = Medecin.objects.get(user=request.user)
                    validated_data['auteur'] = medecin
                except Medecin.DoesNotExist:
                    raise serializers.ValidationError("Profil médecin non trouvé")
        return super().create(validated_data)


class ArticleListSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()
    extrait_contenu = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'titre', 'slug', 'resume', 'extrait_contenu', 'image', 'auteur_nom',
                  'categorie', 'statut', 'date_publication', 'vues', 'tags']

    def get_auteur_nom(self, obj):
        return f"Dr. {obj.auteur.user.first_name} {obj.auteur.user.last_name}"

    def get_extrait_contenu(self, obj):
        # Retourner les 150 premiers caractères du contenu
        return obj.contenu[:150] + '...' if len(obj.contenu) > 150 else obj.contenu


class StructureDeSanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StructureDeSante
        fields = "__all__"

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class CliniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinique
        fields = '__all__'

class DentisteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dentiste
        fields = '__all__'


class HopitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hopital
        fields = '__all__'

class PharmacieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacie
        fields = '__all__'

class ContactFooterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactFooter
        fields = '__all__'


class ChatbotConversationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des conversations chatbot"""
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatbotConversation
        fields = ['id', 'patient', 'patient_name', 'message_user', 'message_bot', 'timestamp', 'sentiment']
        read_only_fields = ['timestamp']
        
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"


class RappelMedicamentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les rappels de médicaments"""
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RappelMedicament
        fields = ['id', 'patient', 'patient_name', 'medicament', 'dosage', 'frequence', 
                  'heure_rappel', 'date_debut', 'date_fin', 'actif', 'notes']
        read_only_fields = ['patient']
        
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
        
    def create(self, validated_data):
        # Automatically set the patient to the current user
        validated_data['patient'] = self.context['request'].user.patient_profile
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Prevent changing the patient
        validated_data.pop('patient', None)
        return super().update(instance, validated_data)


class HistoriquePriseMedicamentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des prises de médicaments"""
    rappel_medicament = serializers.CharField(source='rappel.medicament', read_only=True)
    
    class Meta:
        model = HistoriquePriseMedicament
        fields = ['id', 'rappel', 'rappel_medicament', 'date_prise', 'prise_effectuee', 'notes']
        read_only_fields = ['date_prise']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True, required=False)
    # Add specialty field for doctors
    specialite = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "password", "confirmPassword", "first_name", "last_name", "email", "telephone", "adresse", "role", "specialite"]

    def validate(self, attrs):
        # Check if passwords match
        password = attrs.get('password')
        confirm_password = attrs.get('confirmPassword')
        
        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        
        # Check password strength
        if password and len(password) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères")
        
        # Check if username is unique
        username = attrs.get('username')
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé")
        
        # Check if email is unique
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé")
            
        # For doctors, specialty is required
        role = attrs.get('role', 'patient')
        specialite = attrs.get('specialite')
        if role == 'medecin' and not specialite:
            raise serializers.ValidationError("La spécialité est requise pour les médecins")
            
        return attrs

    def create(self, validated_data):
        # Remove confirmPassword from validated_data as it's not a model field
        validated_data.pop('confirmPassword', None)
        # Extract specialty before creating user
        specialite = validated_data.pop('specialite', None)
        
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            email=validated_data.get("email", ""),
            telephone=validated_data.get("telephone", ""),
            adresse=validated_data.get("adresse", ""),
            role=validated_data.get("role", "patient"),
        )
        
        # If user is a doctor and specialty is provided, update the Medecin profile
        if user.role == 'medecin' and specialite:
            try:
                medecin = Medecin.objects.get(user=user)
                medecin.specialite = specialite
                medecin.save()
            except Medecin.DoesNotExist:
                # Create Medecin profile if it doesn't exist
                Medecin.objects.create(user=user, specialite=specialite)
        
        return user


class UrgenceSerializer(serializers.ModelSerializer):
    patient_nom = serializers.SerializerMethodField()
    medecin_nom = serializers.SerializerMethodField()
    temps_ecoule = serializers.SerializerMethodField()

    class Meta:
        model = Urgence
        fields = '__all__'
        read_only_fields = ['score_urgence', 'priorite_automatique', 'date_creation', 'date_modification']

    def get_patient_nom(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_medecin_nom(self, obj):
        if obj.medecin_charge:
            return f"Dr. {obj.medecin_charge.user.first_name} {obj.medecin_charge.user.last_name}"
        return None

    def get_temps_ecoule(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.date_creation
        minutes = int(delta.total_seconds() / 60)
        if minutes < 60:
            return f"{minutes} min"
        hours = int(minutes / 60)
        return f"{hours}h {minutes % 60}min"


class NotificationUrgenceSerializer(serializers.ModelSerializer):
    urgence_detail = UrgenceSerializer(source='urgence', read_only=True)

    class Meta:
        model = NotificationUrgence
        fields = '__all__'


# ==================== NOTIFICATIONS ====================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['date_creation']


class MedicalDocumentSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField()
    medecin_specialite = serializers.SerializerMethodField()
    patient_nom = serializers.SerializerMethodField()

    class Meta:
        model = MedicalDocument
        fields = "__all__"
        read_only_fields = ["patient", "uploaded_at"]

    def get_medecin_nom(self, obj):
        if obj.medecin:
            return f"{obj.medecin.first_name} {obj.medecin.last_name}"
        return "Médecin inconnu"

    def get_medecin_specialite(self, obj):
        try:
            return obj.medecin.medecin.specialite  # obj.medecin est un User -> on accède au Medecin via related_name 'medecin'
        except Medecin.DoesNotExist:
            return None

    def get_patient_nom(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return "Patient inconnu"






class RatingSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les évaluations des médecins"""
    patient_name = serializers.SerializerMethodField()
    medecin_name = serializers.SerializerMethodField()
    rendez_vous_date = serializers.DateField(source='rendez_vous.date', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'patient', 'patient_name', 'medecin', 'medecin_name', 'rendez_vous', 
                  'rendez_vous_date', 'note', 'commentaire', 'date_creation', 'date_modification']
        read_only_fields = ['patient', 'date_creation', 'date_modification']
        
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
        
    def get_medecin_name(self, obj):
        return f"Dr. {obj.medecin.user.first_name} {obj.medecin.user.last_name}"
        
    def create(self, validated_data):
        # Automatically set the patient to the current user
        validated_data['patient'] = self.context['request'].user.patient_profile
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Prevent changing the patient, medecin, or rendez_vous
        validated_data.pop('patient', None)
        validated_data.pop('medecin', None)
        validated_data.pop('rendez_vous', None)
        return super().update(instance, validated_data)


# -------------------- Messaging Serializers --------------------
class ConversationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les conversations"""
    participant_names = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    is_urgent = serializers.BooleanField(default=False)
    
    class Meta:
        model = Conversation
        fields = ['id', 'subject', 'created_at', 'updated_at', 'is_active', 
                  'participant_names', 'last_message', 'last_message_time', 
                  'unread_count', 'recipient_name', 'patient_name', 'is_urgent']
        
    def get_participant_names(self, obj):
        return ", ".join([p.username for p in obj.participants.all()])
        
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        return last_message.content if last_message else ""
        
    def get_last_message_time(self, obj):
        last_message = obj.messages.last()
        return last_message.timestamp if last_message else None
        
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()
        
    def get_recipient_name(self, obj):
        user = self.context['request'].user
        other_participant = obj.get_other_participant(user)
        if other_participant:
            if hasattr(other_participant, 'medecin'):
                return f"Dr. {other_participant.first_name} {other_participant.last_name}"
            else:
                return f"{other_participant.first_name} {other_participant.last_name}"
        return ""
        
    def get_patient_name(self, obj):
        # For doctor's view, show patient name
        user = self.context['request'].user
        if hasattr(user, 'medecin'):
            other_participant = obj.get_other_participant(user)
            if other_participant and not hasattr(other_participant, 'medecin'):
                return f"{other_participant.first_name} {other_participant.last_name}"
        return ""


class MessageSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les messages"""
    sender_name = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'content', 
                  'timestamp', 'is_read', 'is_own']
        read_only_fields = ['sender', 'timestamp']
        
    def get_sender_name(self, obj):
        if hasattr(obj.sender, 'medecin'):
            return f"Dr. {obj.sender.first_name} {obj.sender.last_name}"
        return f"{obj.sender.first_name} {obj.sender.last_name}"
        
    def get_is_own(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.sender == request.user
        return False
        
    def create(self, validated_data):
        # Automatically set the sender to the current user
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


# -------------------- Chatbot Knowledge Base Serializer --------------------
class ChatbotKnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer for chatbot knowledge base entries"""
    
    class Meta:
        model = ChatbotKnowledgeBase
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class TeleconsultationSerializer(serializers.ModelSerializer):
    consultation_details = ConsultationSerializer(source='consultation', read_only=True)
    
    class Meta:
        model = Teleconsultation
        fields = ['id', 'consultation', 'channel_name', 'created_at', 'ended_at', 'consultation_details']
        read_only_fields = ['channel_name', 'created_at']


class DisponibiliteMedecinSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.CharField(source='medecin.user.get_full_name', read_only=True)
    jour_display = serializers.CharField(source='get_jour_display', read_only=True)
    
    class Meta:
        model = DisponibiliteMedecin
        fields = '__all__'
        read_only_fields = ['medecin']
    
    def validate(self, attrs):
        # Validation : heure_fin > heure_debut
        heure_debut = attrs.get('heure_debut')
        heure_fin = attrs.get('heure_fin')
        
        if heure_debut and heure_fin and heure_fin <= heure_debut:
            raise serializers.ValidationError("L'heure de fin doit être supérieure à l'heure de début")
        
        # Validation : pas de chevauchement
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                medecin = Medecin.objects.get(user=request.user)
                jour = attrs.get('jour')
                instance = self.instance
                
                # Vérifier les chevauchements
                disponibilites = DisponibiliteMedecin.objects.filter(medecin=medecin, jour=jour)
                if instance:
                    disponibilites = disponibilites.exclude(pk=instance.pk)
                
                for disp in disponibilites:
                    if (disp.heure_debut < heure_fin and disp.heure_fin > heure_debut):
                        raise serializers.ValidationError(
                            f"Chevauchement avec une disponibilité existante : {disp.heure_debut} - {disp.heure_fin}"
                        )
            except Medecin.DoesNotExist:
                raise serializers.ValidationError("Profil médecin non trouvé")
        
        # Validation : durée consultation entre 15 et 120 minutes
        duree_consultation = attrs.get('duree_consultation', 30)
        if duree_consultation < 15 or duree_consultation > 120:
            raise serializers.ValidationError("La durée de consultation doit être entre 15 et 120 minutes")
        
        return attrs
    
    def create(self, validated_data):
        # Automatically set the medecin to the current user's medecin profile
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                medecin = Medecin.objects.get(user=request.user)
                validated_data['medecin'] = medecin
            except Medecin.DoesNotExist:
                raise serializers.ValidationError("Profil médecin non trouvé")
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Apply the same validation for updates
        self.validate(validated_data)
        return super().update(instance, validated_data)


class IndisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndisponibiliteMedecin
        fields = ['id', 'date_debut', 'date_fin', 'type', 'raison']


class IndisponibiliteMedecinSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.CharField(source='medecin.user.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = IndisponibiliteMedecin
        fields = ['medecin', 'date_debut', 'date_fin', 'raison', 'type_display', 'medecin_nom']
        read_only_fields = ['medecin']
    
    def validate(self, attrs):
        from django.utils import timezone
        
        # Validation : date_fin >= date_debut
        date_debut = attrs.get('date_debut')
        date_fin = attrs.get('date_fin')
        
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError("La date de fin doit être supérieure ou égale à la date de début")
        
        # Validation : pas dans le passé
        if date_fin and date_fin < timezone.now().date():
            raise serializers.ValidationError("Impossible de créer une indisponibilité dans le passé")
        
        # Validation : pas de chevauchement
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                medecin = Medecin.objects.get(user=request.user)
                instance = self.instance
                
                # Vérifier les chevauchements
                indispos = IndisponibiliteMedecin.objects.filter(medecin=medecin)
                if instance:
                    indispos = indispos.exclude(pk=instance.pk)
                
                for indisp in indispos:
                    if (indisp.date_debut <= date_fin and indisp.date_fin >= date_debut):
                        raise serializers.ValidationError(
                            f"Chevauchement avec une indisponibilité existante : {indisp.date_debut} - {indisp.date_fin}"
                        )
            except Medecin.DoesNotExist:
                raise serializers.ValidationError("Profil médecin non trouvé")
        
        return attrs
    
    def create(self, validated_data):
        # Automatically set the medecin to the current user's medecin profile
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                medecin = Medecin.objects.get(user=request.user)
                validated_data['medecin'] = medecin
            except Medecin.DoesNotExist:
                raise serializers.ValidationError("Profil médecin non trouvé")
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Apply the same validation for updates
        self.validate(validated_data)
        return super().update(instance, validated_data)




# Parametrage du chatbot
import re
class ChatbotConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotConfig
        fields = "__all__"

    # ✅ Validation couleur HEX
    def validate_primary_color(self, value):
        if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError("Couleur invalide. Format attendu : #RRGGBB")
        return value

    # ✅ Validation seuil
    def validate_confidence_threshold(self, value):
        if not (0 <= value <= 1):
            raise serializers.ValidationError("Le seuil doit être entre 0 et 1.")
        return value