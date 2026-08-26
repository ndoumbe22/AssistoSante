import logging  # Added logging import
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField, Sum, Avg
from django.db import transaction
from django.contrib.auth import authenticate, get_user_model  # Added get_user_model import
from django.contrib.auth.models import User
import logging
from rest_framework import viewsets, status, generics

from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .models import (
    Patient, Medecin, RendezVous, Consultation, Medicament, 
    Pathologie, Traitement, Constante, Mesure, Article,
    StructureDeSante, Service, Clinique, Dentiste, Hopital, Pharmacie,
    ContactFooter, ChatbotConversation, RappelMedicament, HistoriquePriseMedicament,
    Urgence, NotificationUrgence, MedicalDocument, Rating, Conversation, Message, ChatbotKnowledgeBase, ConsultationMessage, Teleconsultation, DisponibiliteMedecin, IndisponibiliteMedecin, Notification, ChatbotConfig  # Added Notification
)
from .serializers import (
    PatientSerializer, MedecinSerializer, RendezVousSerializer, 
    ConsultationSerializer, MedicamentSerializer, PathologieSerializer,
    TraitementSerializer, ConstanteSerializer, MesureSerializer, ArticleSerializer, ArticleListSerializer,
    StructureDeSanteSerializer, ServiceSerializer, CliniqueSerializer, 
    DentisteSerializer, HopitalSerializer, PharmacieSerializer,
    ContactFooterSerializer, ChatbotConversationSerializer, RappelMedicamentSerializer,
    HistoriquePriseMedicamentSerializer, UrgenceSerializer, NotificationUrgenceSerializer,
    MedicalDocumentSerializer, RatingSerializer, ConversationSerializer, MessageSerializer,
    ChatbotKnowledgeBaseSerializer, ConsultationMessageSerializer, TeleconsultationSerializer,
    DisponibiliteMedecinSerializer, IndisponibiliteMedecinSerializer, NotificationSerializer,
    UserSerializer, RegisterSerializer, ChatbotConfigSerializer  # Added UserSerializer and RegisterSerializer
)
from .permissions import IsMedecin

# Add these imports for admin statistics
from datetime import date, timedelta, datetime, time as datetime_time
from django.utils import timezone
from .notifications import NotificationService

from rest_framework.decorators import api_view
from rest_framework.response import Response
import time
from agora_token_builder import RtcTokenBuilder
import requests


logger = logging.getLogger(__name__)

# Utility function for robust conflict detection
def check_appointment_conflict(medecin_user, date_rdv, heure_rdv, duration_minutes, exclude_rdv_id=None):
    """
    Check if there's a conflict with existing appointments
    Returns tuple: (has_conflict, conflicting_appointment)
    """
    # Calculate time range for the new appointment
    new_start = datetime.combine(date_rdv, heure_rdv)
    new_end = new_start + timedelta(minutes=duration_minutes)
    
    # Get existing appointments for this doctor on this date that are not cancelled or finished
    existing_appointments = RendezVous.objects.filter(
        medecin=medecin_user,
        date=date_rdv
    ).exclude(
        statut__in=['CANCELLED', 'TERMINE']
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

# --------------------
# Patients
# --------------------
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_queryset(self):
        return Patient.objects.all()

    def get_permissions(self):
        # rendre accessible en lecture seule publiquement
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Médecins
# --------------------
class MedecinViewSet(viewsets.ModelViewSet):
    queryset = Medecin.objects.all()
    serializer_class = MedecinSerializer

    def get_queryset(self):
        return Medecin.objects.all()

    def get_serializer_class(self):
        # Use the public serializer for list/retrieve operations to include user data
        if self.action in ['list', 'retrieve']:
            from .serializers import MedecinPublicSerializer
            return MedecinPublicSerializer
        # Use the full serializer for all other operations
        return MedecinSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'prochains_creneaux']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get', 'post'], url_path='mes-disponibilites', permission_classes=[IsAuthenticated, IsMedecin])
    def mes_disponibilites(self, request):
        """Gérer les disponibilités du médecin connecté"""
        
        # GET: Récupérer les disponibilités
        if request.method == 'GET':
            try:
                # Debug : afficher l'utilisateur connecté
                print(f"User: {request.user}")
                print(f"Is authenticated: {request.user.is_authenticated}")
                print(f"Has medecin attr: {hasattr(request.user, 'medecin')}")
                print(f"Authorization header: {request.META.get('HTTP_AUTHORIZATION')}")
                
                if not hasattr(request.user, 'medecin'):
                    return Response({
                        'error': 'Utilisateur non médecin',
                        'user_id': request.user.id,
                        'username': request.user.username
                    }, status=status.HTTP_403_FORBIDDEN)
                
                medecin = request.user.medecin
                disponibilites = DisponibiliteMedecin.objects.filter(
                    medecin=medecin,
                    actif=True
                ).order_by(
                    Case(
                        When(jour='lundi', then=1),
                        When(jour='mardi', then=2),
                        When(jour='mercredi', then=3),
                        When(jour='jeudi', then=4),
                        When(jour='vendredi', then=5),
                        When(jour='samedi', then=6),
                        When(jour='dimanche', then=7),
                    )
                )
                
                serializer = DisponibiliteMedecinSerializer(disponibilites, many=True)
                
                return Response({
                    'success': True,
                    'disponibilites': serializer.data
                })
            except Exception as e:
                import traceback
                print(f"Erreur: {str(e)}")
                print(traceback.format_exc())
                return Response({
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
        # POST: Créer une nouvelle disponibilité
        elif request.method == 'POST':
            try:
                if not hasattr(request.user, 'medecin'):
                    return Response({
                        'error': 'Utilisateur non médecin',
                        'user_id': request.user.id,
                        'username': request.user.username
                    }, status=status.HTTP_403_FORBIDDEN)
                
                medecin = request.user.medecin
                
                # Ajouter le médecin aux données
                data = request.data.copy()
                data['medecin'] = medecin.id
                
                serializer = DisponibiliteMedecinSerializer(data=data, context={'request': request})
                
                if serializer.is_valid():
                    serializer.save(medecin=medecin)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
            except Medecin.DoesNotExist:
                return Response({
                    'error': 'Profil médecin introuvable'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                import traceback
                print(f"Erreur: {str(e)}")
                print(traceback.format_exc())
                return Response({
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Serialize and return the response
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mes-indisponibilites', permission_classes=[IsAuthenticated, IsMedecin])
    def mes_indisponibilites(self, request):
        """GET /api/medecins/mes-indisponibilites/"""
        try:
            # Debug : afficher l'utilisateur connecté
            print(f"User: {request.user}")
            print(f"Is authenticated: {request.user.is_authenticated}")
            print(f"Has medecin attr: {hasattr(request.user, 'medecin')}")
            print(f"Authorization header: {request.META.get('HTTP_AUTHORIZATION')}")
            
            if not hasattr(request.user, 'medecin'):
                return Response({
                    'error': 'Utilisateur non médecin',
                    'user_id': request.user.id,
                    'username': request.user.username
                }, status=status.HTTP_403_FORBIDDEN)
            
            medecin = request.user.medecin

            # Récupérer les indisponibilités futures
            indisponibilites = IndisponibiliteMedecin.objects.filter(
                medecin=medecin,
                date_debut__gte=timezone.now().date()
            ).order_by('date_debut')

            serializer = IndisponibiliteMedecinSerializer(indisponibilites, many=True)

            return Response({
                'success': True,
                'indisponibilites': serializer.data
            })
        except Exception as e:
            import traceback
            print(f"Erreur: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def prochains_creneaux(self, request, pk=None):
        """
        Get next available slots for a doctor
        Query parameters: limit (default 5)
        """
        from .models import DisponibiliteMedecin, IndisponibiliteMedecin, RendezVous
        from django.utils import timezone
        import datetime
        
        limit = int(request.query_params.get('limit', 5))
        
        try:
            # Get the doctor - pk is the user ID, not the medecin ID
            medecin = Medecin.objects.get(user_id=pk)
        except Medecin.DoesNotExist:
            return Response({'error': 'Médecin non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all doctor's availabilities
        disponibilites = DisponibiliteMedecin.objects.filter(medecin=medecin, actif=True)
        
        creneaux_trouves = []
        current_date = timezone.now().date()
        
        # Try to find next available slots
        for i in range(30):  # Check next 30 days
            check_date = current_date + datetime.timedelta(days=i)
            jour_semaine = check_date.strftime('%A').lower()
            jour_mapping = {
                'monday': 'lundi',
                'tuesday': 'mardi',
                'wednesday': 'mercredi',
                'thursday': 'jeudi',
                'friday': 'vendredi',
                'saturday': 'samedi',
                'sunday': 'dimanche',
            }
            
            if jour_semaine in jour_mapping:
                jour_fr = jour_mapping[jour_semaine]
                
                # Check if doctor has availability on this day
                dispos_jour = disponibilites.filter(jour=jour_fr)
                if not dispos_jour.exists():
                    continue
                
                # For each availability slot on this day
                for disponibilite in dispos_jour:
                    # Check if there's an unavailability on this date
                    if IndisponibiliteMedecin.objects.filter(
                        medecin=medecin,
                        date_debut__lte=check_date,
                        date_fin__gte=check_date
                    ).exists():
                        continue  # Skip this day if there's an unavailability
                    
                    # Generate time slots for this day
                    current_time = disponibilite.heure_debut
                    while current_time < disponibilite.heure_fin:
                        # Skip lunch break if it exists
                        if (disponibilite.pause_dejeuner_debut and 
                            disponibilite.pause_dejeuner_fin and
                            disponibilite.pause_dejeuner_debut <= current_time < disponibilite.pause_dejeuner_fin):
                            current_time = disponibilite.pause_dejeuner_fin
                            continue
                        
                        # Check if this time slot is already booked
                        heure_rdv = current_time
                        fin_rdv = (datetime.datetime.combine(datetime.date.today(), current_time) + 
                                  datetime.timedelta(minutes=disponibilite.duree_consultation)).time()
                        
                        # Check for conflicts with existing appointments
                        conflit = RendezVous.objects.filter(
                            medecin=medecin.user,
                            date=check_date,
                            heure__lt=fin_rdv,
                            heure__gte=heure_rdv,
                            statut__in=['PENDING', 'CONFIRMED']
                        ).exists()
                        
                        if not conflit:
                            # This slot is available
                            creneaux_trouves.append({
                                'date': check_date,
                                'heure': current_time,
                                'duree': disponibilite.duree_consultation
                            })
                        
                        # Move to next time slot
                        current_time = (datetime.datetime.combine(datetime.date.today(), current_time) + 
                                       datetime.timedelta(minutes=disponibilite.duree_consultation)).time()
                        
                        # Stop if we've reached the limit
                        if len(creneaux_trouves) >= limit:
                            break
                
                # Stop if we've reached the limit
                if len(creneaux_trouves) >= limit:
                    break
        
        return Response(creneaux_trouves[:limit])

# --------------------
# Rendez-vous
# --------------------
class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer

    def get_queryset(self):
        return RendezVous.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        return RendezVousSerializer
    
    @action(detail=False, methods=['get'], url_path='creneaux_disponibles')
    def creneaux_disponibles(self, request):
        """
        Retourne les créneaux disponibles pour un médecin à une date donnée.
        Un créneau est indisponible UNIQUEMENT si un RDV confirmé/en_attente existe.
        """
        from django.utils import timezone
        from datetime import datetime, timedelta, time
        from .models import Medecin, DisponibiliteMedecin, RendezVous

        try:
            # 1. VALIDATION DES PARAMÈTRES
            # Handle both REST framework Request and WSGIRequest
            if hasattr(request, 'query_params'):
                # REST framework Request
                medecin_id = request.query_params.get('medecin_id')
                date_str = request.query_params.get('date')
            else:
                # WSGIRequest
                medecin_id = request.GET.get('medecin_id')
                date_str = request.GET.get('date')

            if not medecin_id or not date_str:
                return Response({
                    'error': 'medecin_id et date sont requis'
                }, status=400)

            # 2. PARSE ET VALIDATION DE LA DATE
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Format de date invalide. Utilisez YYYY-MM-DD'
                }, status=400)

            # Vérifier que ce n'est pas une date passée
            if date_obj < timezone.now().date():
                return Response({
                    'error': 'Impossible de réserver dans le passé'
                }, status=400)

            # 3. RÉCUPÉRER LE MÉDECIN
            try:
                medecin = Medecin.objects.get(id=medecin_id)
            except Medecin.DoesNotExist:
                return Response({
                    'error': 'Médecin introuvable'
                }, status=404)

            # 1️⃣ APRÈS avoir récupéré l'objet Medecin :
            print(f"🔍 Médecin trouvé: {medecin.user.get_full_name()} (Medecin.id={medecin.id}, User.id={medecin.user.id})")

            # 4. RÉCUPÉRER LE JOUR DE LA SEMAINE
            jours_mapping = {
                0: 'lundi', 1: 'mardi', 2: 'mercredi', 3: 'jeudi',
                4: 'vendredi', 5: 'samedi', 6: 'dimanche'
            }
            jour = jours_mapping[date_obj.weekday()]

            # 5. RÉCUPÉRER LA DISPONIBILITÉ DU MÉDECIN POUR CE JOUR
            disponibilite = DisponibiliteMedecin.objects.filter(
                medecin=medecin,
                jour=jour,
                actif=True
            ).first()

            if not disponibilite:
                return Response({
                    'date': date_str,
                    'medecin_id': medecin_id,
                    'slots': [],
                    'message': f'Le médecin ne travaille pas le {jour}'
                }, status=200)

            # 6. RÉCUPÉRER TOUS LES RDV CONFIRMÉS/EN_ATTENTE POUR CE MÉDECIN CE JOUR
            rdv_existants = RendezVous.objects.filter(
                medecin=medecin.user,  # Note: medecin is a User instance
                date=date_obj,
                statut__in=['CONFIRMED', 'PENDING']  # CRITIQUE: Inclure aussi PENDING
            )

            # 2️⃣ APRÈS avoir récupéré les RDV existants :
            print(f"🔍 Recherche RDV pour date={date_obj}, medecin_user_id={medecin.user.id}")
            print(f"📋 RDV existants trouvés: {rdv_existants.count()}")
            for rdv in rdv_existants:
                print(f"  ➡️ RDV #{rdv.numero}: {rdv.heure.strftime('%H:%M')} (Statut: {rdv.statut})")

            # 3️⃣ APRÈS avoir construit heures_reservees :
            heures_reservees = set()
            for rdv in rdv_existants:
                heure_str = rdv.heure.strftime('%H:%M')
                heures_reservees.add(heure_str)
            print(f"⏰ Heures réservées: {heures_reservees}")

            # 7. GÉNÉRER TOUS LES CRÉNEAUX
            slots = []
            heure_debut = disponibilite.heure_debut
            heure_fin = disponibilite.heure_fin
            duree_minutes = disponibilite.duree_consultation or 30

            current_time = datetime.combine(date_obj, heure_debut)
            end_time = datetime.combine(date_obj, heure_fin)
            delta = timedelta(minutes=duree_minutes)

            maintenant = timezone.now()

            while current_time < end_time:

                heure_str = current_time.time().strftime('%H:%M')
                
                # 4️⃣ DANS la boucle de génération des créneaux, AJOUTE ce print :
                est_reserve = heure_str in heures_reservees
                
                if est_reserve:  # Print seulement les créneaux réservés
                    print(f"  🔴 Créneau {heure_str} → RÉSERVÉ (disponible=False)")
                
                print(f"🔍 Check créneau {heure_str} - Réservé: {est_reserve}")
                
                print(f"DEBUG: Checking slot {heure_str} for date {date_obj}")
                print(f"DEBUG: Current time: {current_time.time()}, Now: {maintenant.time()}")

                # VÉRIFICATIONS D'INDISPONIBILITÉ
                est_disponible = True
                motif_indisponibilite = None

                # A. Vérifier si dans le passé (pour aujourd'hui)
                if date_obj == maintenant.date():
                    if current_time.time() <= maintenant.time():
                        est_disponible = False
                        motif_indisponibilite = "Heure passée"
                        print(f"DEBUG: Slot {heure_str} is in the past. Current time: {maintenant.time()}")

                # B. Vérifier pause déjeuner
                if est_disponible and disponibilite.pause_dejeuner_debut and disponibilite.pause_dejeuner_fin:
                    if disponibilite.pause_dejeuner_debut <= current_time.time() < disponibilite.pause_dejeuner_fin:
                        est_disponible = False
                        motif_indisponibilite = "Pause déjeuner"

                # C. Vérifier si RDV existe déjà (CRITIQUE)
                if est_disponible and est_reserve:
                    est_disponible = False
                    motif_indisponibilite = "Déjà réservé"
                    print(f"DEBUG: Slot {heure_str} marked as unavailable because it's already booked")

                slots.append({
                    'heure': heure_str,
                    'disponible': est_disponible,
                    'motif_indisponibilite': motif_indisponibilite
                })

                current_time += delta

            print(f"⏰ Créneaux générés: {slots}")
            print(f"✅ {len(slots)} créneaux générés, {sum(1 for s in slots if s['disponible'])} disponibles")

            return Response({
                'date': date_str,
                'medecin_id': medecin_id,
                'medecin_nom': f"{medecin.user.first_name} {medecin.user.last_name}",
                'slots': slots
            }, status=200)

        except Exception as e:
            import traceback
            print(f"❌ ERREUR creneaux_disponibles: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': f'Erreur serveur: {str(e)}'
            }, status=500)
    
    @action(detail=False, methods=['get'], url_path='upcoming', permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        """GET /api/rendezvous/upcoming/ - Rendez-vous à venir du patient"""
        try:
            print(f"📅 Upcoming appointments pour user: {request.user}")
            
            # Vérifier que l'utilisateur est authentifié
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Utilisateur non authentifié'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # CORRECTION: Filtrer par patient (User) directement
            from django.utils import timezone
            today = timezone.now().date()
            appointments = RendezVous.objects.filter(
                patient=request.user,  # ✅ Correct: patient est un User
                date__gte=today
            ).exclude(
                statut__in=['CANCELLED', 'TERMINE']
            ).order_by('date', 'heure')
            
            serializer = self.get_serializer(appointments, many=True)
            
            print(f"✅ Trouvé {appointments.count()} rendez-vous à venir")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur upcoming: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='history', permission_classes=[IsAuthenticated])
    def history(self, request):
        """GET /api/rendezvous/history/ - Historique des rendez-vous du patient"""
        try:
            print(f"📜 History appointments pour user: {request.user}")
            
            # Vérifier que l'utilisateur est authentifié
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Utilisateur non authentifié'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # CORRECTION: Filtrer par patient (User) directement
            from django.utils import timezone
            from django.db import models
            today = timezone.now().date()
            appointments = RendezVous.objects.filter(
                patient=request.user  # ✅ Correct: patient est un User
            ).filter(
                models.Q(date__lt=today) | 
                models.Q(statut__in=['CANCELLED', 'TERMINE'])
            ).order_by('-date', '-heure')
            
            serializer = self.get_serializer(appointments, many=True)
            
            print(f"✅ Trouvé {appointments.count()} rendez-vous dans l'historique")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur history: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='mes-demandes', permission_classes=[IsAuthenticated])
    def mes_demandes(self, request):
        """GET /api/rendezvous/mes-demandes/ - Tous les RDV demandés par ce patient"""
        try:
            print(f"📋 Mes demandes pour user: {request.user}")
            
            # Vérifier que l'utilisateur est authentifié
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Utilisateur non authentifié'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Récupérer TOUS les rendez-vous où le user connecté est le patient
            appointments = RendezVous.objects.filter(
                patient=request.user  # Le patient est un User
            ).order_by('-date', '-heure')
            
            serializer = self.get_serializer(appointments, many=True)
            
            print(f"✅ Trouvé {appointments.count()} rendez-vous pour ce patient")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur mes-demandes: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='mes-rendez-vous-medecin', permission_classes=[IsAuthenticated])
    def mes_rendez_vous_medecin(self, request):
        """GET /api/rendezvous/mes-rendez-vous-medecin/ - Tous les RDV du médecin connecté"""
        try:
            print(f"📋 Mes RDV médecin pour: {request.user}")
            
            # Vérifier que l'utilisateur est authentifié
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Utilisateur non authentifié'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Récupérer TOUS les rendez-vous où le user connecté est le médecin
            appointments = RendezVous.objects.filter(
                medecin=request.user  # Le médecin est un User
            ).order_by('-date', '-heure')
            
            serializer = self.get_serializer(appointments, many=True)
            
            print(f"✅ Trouvé {appointments.count()} rendez-vous pour ce médecin")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur mes_rendez_vous_medecin: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'], url_path='confirmer', permission_classes=[IsAuthenticated])
    def confirmer(self, request, pk=None):
        """PATCH /api/rendezvous/{id}/confirmer/ - Médecin confirme le RDV"""
        try:
            rdv = self.get_object()
            
            # Vérifier que c'est le médecin concerné
            if rdv.medecin != request.user:
                return Response({
                    'error': 'Seul le médecin concerné peut confirmer'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Vérifier statut actuel
            if rdv.statut != 'PENDING':
                return Response({
                    'error': f'Impossible de confirmer un RDV au statut {rdv.statut}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            rdv.statut = 'CONFIRMED'
            rdv.save()
            
            # Send confirmation notification
            from .notifications import NotificationService
            try:
                NotificationService.send_appointment_confirmation(rdv)
            except Exception as e:
                print(f"Error sending appointment confirmation notification: {e}")
            
            serializer = self.get_serializer(rdv)
            return Response({
                'success': True,
                'message': 'Rendez-vous confirmé',
                'rdv': serializer.data
            }, status=status.HTTP_200_OK)
            
        except RendezVous.DoesNotExist:
            return Response({
                'error': 'Rendez-vous non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Erreur confirmation RDV: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'], url_path='annuler', permission_classes=[IsAuthenticated])
    def annuler(self, request, pk=None):
        """PATCH /api/rendezvous/{id}/annuler/ - Patient ou médecin annule"""
        try:
            rdv = self.get_object()
            
            # Vérifier que c'est le patient ou le médecin
            if rdv.patient != request.user and rdv.medecin != request.user:
                return Response({
                    'error': 'Seul le patient ou le médecin concerné peut annuler'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Vérifier qu'on peut annuler
            if rdv.statut in ['CANCELLED', 'TERMINE']:
                return Response({
                    'error': f'Impossible d\'annuler un RDV au statut {rdv.statut}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            rdv.statut = 'CANCELLED'
            rdv.save()
            
            serializer = self.get_serializer(rdv)
            return Response({
                'success': True,
                'message': 'Rendez-vous annulé',
                'rdv': serializer.data
            })
            
        except Exception as e:
            print(f"❌ Erreur annuler: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def perform_create(self, serializer):
        # Auto-assign patient from authenticated user if not provided
        if not serializer.validated_data.get('patient'):
            serializer.save(patient=self.request.user)
        else:
            serializer.save()
        
        # Send notification to the doctor
        from .notifications import NotificationService
        try:
            # Get the appointment instance after saving
            appointment = serializer.instance
            NotificationService.send_appointment_request_notification(appointment)
        except Exception as e:
            print(f"Error sending appointment notification: {e}")

# --------------------
# Consultations
# --------------------
class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'medecin':
                # Doctors can see their consultations
                return Consultation.objects.filter(medecin=user.medecin)
            elif user.role == 'patient':
                # Patients can see their consultations
                return Consultation.objects.filter(patient=user.patient_profile)
        return Consultation.objects.none()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        """Start an online consultation"""
        consultation = self.get_object()
        user = request.user
        
        # Check if user is authorized (patient or doctor of this consultation)
        if not (user == consultation.patient.user or user == consultation.medecin.user):
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à démarrer cette consultation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update consultation status
        consultation.statut = 'en_cours'
        consultation.save()
        
        return Response({
            'message': 'Consultation démarrée avec succès',
            'consultation': ConsultationSerializer(consultation).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def end(self, request, pk=None):
        """End an online consultation"""
        consultation = self.get_object()
        user = request.user
        
        # Check if user is authorized (patient or doctor of this consultation)
        if not (user == consultation.patient.user or user == consultation.medecin.user):
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à terminer cette consultation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update consultation status
        consultation.statut = 'terminee'
        consultation.save()
        
        return Response({
            'message': 'Consultation terminée avec succès',
            'consultation': ConsultationSerializer(consultation).data
        })


# --------------------
# Consultation Messages
# --------------------
class ConsultationMessageViewSet(viewsets.ModelViewSet):
    queryset = ConsultationMessage.objects.all()
    serializer_class = ConsultationMessageSerializer

# -------------------- Teleconsultation --------------------
from .models import Teleconsultation
from .serializers import TeleconsultationSerializer
import uuid
import os
from django.conf import settings

# Try to import Agora token builder
try:
    from agora_token_builder import RtcTokenBuilder
    AGORA_AVAILABLE = True
except ImportError:
    RtcTokenBuilder = None
    AGORA_AVAILABLE = False

class TeleconsultationViewSet(viewsets.ModelViewSet):
    queryset = Teleconsultation.objects.all()
    serializer_class = TeleconsultationSerializer

# -------------------- User Profile --------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer  # Use the directly imported serializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own profile
        return get_user_model().objects.filter(id=self.request.user.id)

    def get_permissions(self):
        # For profile operations, user must be authenticated
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get the current user's profile"""
        user = request.user
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update the current user's profile"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeleconsultationViewSet(viewsets.ModelViewSet):
    queryset = Teleconsultation.objects.all()
    serializer_class = TeleconsultationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'medecin':
                # Doctors can see their teleconsultations
                return Teleconsultation.objects.filter(consultation__medecin=user.medecin)
            elif user.role == 'patient':
                # Patients can see their teleconsultations
                return Teleconsultation.objects.filter(consultation__patient=user.patient_profile)
        return Teleconsultation.objects.none()
    
    def create(self, request, *args, **kwargs):
        consultation_id = request.data.get('consultation')
        if not consultation_id:
            return Response({'error': 'Consultation ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if teleconsultation already exists for this consultation
        try:
            teleconsultation = Teleconsultation.objects.get(consultation_id=consultation_id)
            serializer = self.get_serializer(teleconsultation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Teleconsultation.DoesNotExist:
            pass
        
        # Create new teleconsultation with unique channel name
        channel_name = f"teleconsultation_{consultation_id}_{uuid.uuid4().hex[:8]}"
        teleconsultation = Teleconsultation.objects.create(
            consultation_id=consultation_id,
            channel_name=channel_name
        )
        
        serializer = self.get_serializer(teleconsultation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_token(self, request, pk=None):
        """Generate Agora token for a teleconsultation"""
        # Check if Agora is available
        if not AGORA_AVAILABLE:
            return Response(
                {'error': 'Agora token builder not available. Teleconsultation feature is not properly configured.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        teleconsultation = self.get_object()
        
        # Check if user is authorized (patient or doctor of this consultation)
        user = request.user
        consultation = teleconsultation.consultation
        if not (user == consultation.patient.user or user == consultation.medecin.user):
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à accéder à cette téléconsultation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get Agora credentials from environment variables
        app_id = os.environ.get('AGORA_APP_ID')
        app_certificate = os.environ.get('AGORA_APP_CERTIFICATE')
        
        # Check if App ID is provided
        if not app_id or app_id == '':
            return Response(
                {'error': 'Agora App ID not configured. Please set AGORA_APP_ID environment variable.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Check if App Certificate is provided
        if not app_certificate or app_certificate == '' or app_certificate == 'your_agora_app_certificate_here':
            return Response(
                {'error': 'Agora App Certificate not configured. Please set AGORA_APP_CERTIFICATE environment variable for secure authentication.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Generate secure token with certificate
        channel_name = teleconsultation.channel_name
        uid = 0  # Using 0 as uid for simplicity
        role = 1  # Publisher role
        expire_time_in_seconds = 3600  # 1 hour
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expire_time_in_seconds
        
        try:
            token = RtcTokenBuilder.buildTokenWithUid(
                app_id, app_certificate, channel_name, uid, role, privilege_expired_ts
            )
            
            return Response({
                'token': token,
                'channel_name': channel_name,
                'uid': uid
            })
        except Exception as e:
            return Response(
                {'error': f'Error generating token: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def end(self, request, pk=None):
        """End a teleconsultation"""
        teleconsultation = self.get_object()
        user = request.user
        consultation = teleconsultation.consultation
        
        # Check if user is authorized (patient or doctor of this consultation)
        if not (user == consultation.patient.user or user == consultation.medecin.user):
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à terminer cette téléconsultation'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update teleconsultation end time
        teleconsultation.ended_at = timezone.now()
        teleconsultation.save()
        
        # Also end the consultation
        consultation.statut = 'terminee'
        consultation.save()
        
        return Response({
            'message': 'Téléconsultation terminée avec succès',
            'teleconsultation': TeleconsultationSerializer(teleconsultation).data
        })


# -------------------- Disponibilité Médecin --------------------
class DisponibiliteMedecinViewSet(viewsets.ModelViewSet):
    queryset = DisponibiliteMedecin.objects.all()
    serializer_class = DisponibiliteMedecinSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'medecin':
            try:
                medecin = Medecin.objects.get(user=user)
                return DisponibiliteMedecin.objects.filter(medecin=medecin)
            except Medecin.DoesNotExist:
                return DisponibiliteMedecin.objects.none()
        return DisponibiliteMedecin.objects.none()
    
    def perform_create(self, serializer):
        # Auto-assign medecin from authenticated user
        user = self.request.user
        try:
            medecin = Medecin.objects.get(user=user)
            serializer.save(medecin=medecin)
        except Medecin.DoesNotExist:
            raise serializers.ValidationError("Profil médecin non trouvé")
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_disponibilites(self, request):
        """
        Get all disponibilities for the current doctor
        """
        user = self.request.user
        try:
            medecin = Medecin.objects.get(user=user)
            disponibilites = DisponibiliteMedecin.objects.filter(medecin=medecin)
            serializer = self.get_serializer(disponibilites, many=True)
            return Response(serializer.data)
        except Medecin.DoesNotExist:
            return Response({'error': 'Profil médecin non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def ajouter_disponibilite(self, request):
       print("===== Debug Ajouter Disponibilite =====")
       print("Données reçues :", request.data)
       serializer = self.get_serializer(data=request.data, context={'request': request})
       try:
           serializer.is_valid(raise_exception=True)
           serializer.save()
           print("Disponibilité créée :", serializer.data)
           return Response(serializer.data, status=status.HTTP_201_CREATED)
       except Exception as e:
           print("Erreur création disponibilité :", e)
           return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class IndisponibiliteMedecinViewSet(viewsets.ModelViewSet):
    queryset = IndisponibiliteMedecin.objects.all()
    serializer_class = IndisponibiliteMedecinSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'medecin':
            try:
                medecin = Medecin.objects.get(user=user)
                return IndisponibiliteMedecin.objects.filter(medecin=medecin)
            except Medecin.DoesNotExist:
                return IndisponibiliteMedecin.objects.none()
        return IndisponibiliteMedecin.objects.none()
    
    def perform_create(self, serializer):
        # Auto-assign medecin from authenticated user
        user = self.request.user
        try:
            medecin = Medecin.objects.get(user=user)
            serializer.save(medecin=medecin)
        except Medecin.DoesNotExist:
            raise serializers.ValidationError("Profil médecin non trouvé")
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_indisponibilites(self, request):
        """
        Get all unavailabilities for the current doctor
        """
        user = self.request.user
        try:
            medecin = Medecin.objects.get(user=user)
            indisponibilites = IndisponibiliteMedecin.objects.filter(medecin=medecin)
            serializer = self.get_serializer(indisponibilites, many=True)
            return Response(serializer.data)
        except Medecin.DoesNotExist:
            return Response({'error': 'Profil médecin non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def ajouter_indisponibilite(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(medecin=request.user.medecin)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# --------------------
# Médicaments
# --------------------
class MedicamentViewSet(viewsets.ModelViewSet):
    queryset = Medicament.objects.all()
    serializer_class = MedicamentSerializer

    def get_queryset(self):
        return Medicament.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Pathologies
# --------------------
class PathologieViewSet(viewsets.ModelViewSet):
    queryset = Pathologie.objects.all()
    serializer_class = PathologieSerializer

    def get_queryset(self):
        return Pathologie.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Traitements
# --------------------
class TraitementViewSet(viewsets.ModelViewSet):
    queryset = Traitement.objects.all()
    serializer_class = TraitementSerializer

    def get_queryset(self):
        return Traitement.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Constantes
# --------------------
class ConstanteViewSet(viewsets.ModelViewSet):
    queryset = Constante.objects.all()
    serializer_class = ConstanteSerializer

    def get_queryset(self):
        return Constante.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Mesures
# --------------------
class MesureViewSet(viewsets.ModelViewSet):
    queryset = Mesure.objects.all()
    serializer_class = MesureSerializer

    def get_queryset(self):
        return Mesure.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Articles
# --------------------
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    lookup_field = 'slug'  # Add this line to enable slug-based lookups

    def get_queryset(self):
        """
        - Pour les utilisateurs non authentifiés : seulement les articles validés
        - Pour les médecins : leurs propres articles
        - Pour les admins : tous les articles
        """
        user = self.request.user
        print(f"ArticleViewSet.get_queryset called, user: {user}, is_authenticated: {user.is_authenticated}")  # Debug log
        
        # Si l'action est 'list' (page publique des articles)
        if self.action == 'list':
            print("Returning validated articles for list action")  # Debug log
            # Seulement les articles validés pour le public
            return Article.objects.filter(statut='valide').order_by('-date_publication')
        
        # Si l'action est 'retrieve' (détail d'un article)
        if self.action == 'retrieve':
            print("Returning validated articles for retrieve action")  # Debug log
            # Seulement les articles validés
            return Article.objects.filter(statut='valide')
        
        # Pour les actions protégées (mes_articles, etc.)
        if user.is_authenticated:
            print("User is authenticated")  # Debug log
            if user.is_staff or user.role == 'admin':
                print("User is admin, returning all articles")  # Debug log
                # Les admins voient tous les articles
                return Article.objects.all()
            elif hasattr(user, 'medecin'):
                print("User is doctor, returning their articles")  # Debug log
                # Les médecins voient leurs propres articles (tous statuts)
                return Article.objects.filter(auteur=user.medecin)
        
        # Par défaut : seulement les articles validés
        print("Returning validated articles as default")  # Debug log
        return Article.objects.filter(statut='valide')

    def get_permissions(self):
        print(f"ArticleViewSet.get_permissions called, action: {self.action}")
        
        # Actions publiques (GET)
        if self.action in ['list', 'retrieve']:
            print("Allowing public access with AllowAny")
            return [AllowAny()]
        
        # Création d'article (POST) - nécessite authentification
        if self.action == 'create':
            print("Allowing create with IsAuthenticated")
            return [IsAuthenticated()]
        
        # Autres actions - nécessite authentification
        print("Requiring authentication with IsAuthenticated")
        return [IsAuthenticated()]
        
    def list(self, request, *args, **kwargs):
        print("ArticleViewSet list called")  # Debug log
        return super().list(request, *args, **kwargs)
        
    def retrieve(self, request, *args, **kwargs):
        print("ArticleViewSet retrieve called")  # Debug log
        # Call the parent retrieve method to get the article
        instance = self.get_object()
        
        # Increment view count for public access
        if hasattr(instance, 'incrementer_vues'):
            instance.incrementer_vues()
            
        # Serialize and return the response
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Créer un nouvel article (brouillon ou soumis)"""
        try:
            # Vérifier que l'utilisateur est authentifié
            if not request.user.is_authenticated:
                return Response({
                    'error': 'Authentification requise'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Vérifier que l'utilisateur est un médecin
            if not hasattr(request.user, 'medecin'):
                return Response({
                    'error': 'Seuls les médecins peuvent créer des articles'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Ajouter l'auteur aux données
            data = request.data.copy()
            
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                serializer.save(auteur=request.user.medecin)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            print(f"❌ Erreurs de validation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"❌ Erreur création article: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --------------------
# Structures de santé
# --------------------
class StructureDeSanteViewSet(viewsets.ModelViewSet):
    queryset = StructureDeSante.objects.all()
    serializer_class = StructureDeSanteSerializer

    def get_queryset(self):
        return StructureDeSante.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

# --------------------
# Services
# --------------------
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return Service.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
class CliniqueViewSet(viewsets.ModelViewSet):
    queryset = Clinique.objects.all()
    serializer_class = CliniqueSerializer
    permission_classes = [AllowAny]


class DentisteViewSet(viewsets.ModelViewSet):
    queryset = Dentiste.objects.all()
    serializer_class = DentisteSerializer
    permission_classes = [AllowAny]


class HopitalViewSet(viewsets.ModelViewSet):
    queryset = Hopital.objects.all()
    serializer_class = HopitalSerializer
    permission_classes = [AllowAny]


class PharmacieViewSet(viewsets.ModelViewSet):
    queryset = Pharmacie.objects.all()
    serializer_class = PharmacieSerializer
    permission_classes = [AllowAny]


class ContactFooterViewSet(viewsets.ModelViewSet):
    queryset = ContactFooter.objects.all()
    serializer_class = ContactFooterSerializer
    permission_classes = [AllowAny]


# -------------------- Medical Document ViewSet --------------------
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
class MedicalDocumentViewSet(viewsets.ModelViewSet):
    queryset = MedicalDocument.objects.all()
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'patient':
            return MedicalDocument.objects.filter(patient=user)
        elif user.role == 'medecin':
            return MedicalDocument.objects.filter(medecin=user)
        else:
            return MedicalDocument.objects.all()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != 'patient':
            raise PermissionDenied("Seuls les patients peuvent partager des documents.")

        medecin_id = self.request.data.get("medecin")
        if not medecin_id:
            raise serializers.ValidationError({"medecin": ["Ce champ est requis."]})

        # Vérification du médecin
        try:
            medecin_user = User.objects.get(id=medecin_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"medecin": ["Médecin introuvable."]})

        if medecin_user.role != "medecin":
            raise serializers.ValidationError({"medecin": ["L'utilisateur sélectionné n'est pas un médecin."]})

        # Vérification RDV confirmé
        confirmed = RendezVous.objects.filter(
            patient=user,
            medecin=medecin_user,
            statut__in=["CONFIRMED", "TERMINE"]
        )

        if not confirmed.exists():
            raise serializers.ValidationError(
                {"error": "Vous pouvez partager un document uniquement avec un médecin ayant un rendez-vous confirmé avec vous."}
            )

        # Enregistrement
        serializer.save(patient=user, medecin=medecin_user)




# --------------------
# Chatbot (Rasa)
# --------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

# ==================== NOTIFICATIONS ====================
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all notifications for the current doctor"""
        try:
            # Get the medecin profile for the current user
            medecin = request.user.medecin
            notifications = Notification.objects.filter(medecin=medecin).order_by('-date_creation')
            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response({'error': 'Utilisateur non médecin'}, status=403)

class MarkNotificationAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        """Mark a notification as read"""
        try:
            # Get the medecin profile for the current user
            medecin = request.user.medecin
            notification = Notification.objects.get(pk=pk, medecin=medecin)
            notification.lu = True
            notification.save()
            serializer = NotificationSerializer(notification)
            return Response(serializer.data)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification non trouvée'}, status=404)
        except AttributeError:
            return Response({'error': 'Utilisateur non médecin'}, status=403)

class MarkAllNotificationsAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Mark all notifications as read"""
        try:
            # Get the medecin profile for the current user
            medecin = request.user.medecin
            Notification.objects.filter(medecin=medecin, lu=False).update(lu=True)
            return Response({'message': 'Toutes les notifications ont été marquées comme lues'})
        except AttributeError:
            return Response({'error': 'Utilisateur non médecin'}, status=403)

# --------------------
class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "")
        if not message:
            return Response({"error": "Aucun message fourni"}, status=400)

        # Get or create patient profile
        try:
            patient = request.user.patient_profile
        except Patient.DoesNotExist:
            return Response({"error": "Profil patient non trouvé"}, status=400)

        rasa_url = "http://localhost:5005/webhooks/rest/webhook"
        payload = {
            "sender": str(request.user.id),
            "message": message
        }

        try:
            response = requests.post(rasa_url, json=payload)
            response_data = response.json()
            
            # Extract bot response
            bot_response = ""
            if response_data and isinstance(response_data, list) and len(response_data) > 0:
                bot_response = response_data[0].get("text", "Désolé, je n'ai pas compris.")
            else:
                bot_response = "Désolé, je n'ai pas compris."
            
            # Save conversation to database
            conversation = ChatbotConversation.objects.create(
                patient=patient,
                message_user=message,
                message_bot=bot_response
            )
            
            return Response({"responses": response_data})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
            
    def get(self, request):
        """Get chatbot conversation history for the authenticated patient"""
        try:
            patient = request.user.patient_profile
            conversations = ChatbotConversation.objects.filter(patient=patient).order_by('timestamp')
            serializer = ChatbotConversationSerializer(conversations, many=True)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response({"error": "Profil patient non trouvé"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


User = get_user_model()

# Inscription
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()

        # Empêcher l'inscription en tant qu'admin via frontend
        if data.get("role") == "admin":
            return Response(
                {"error": "Vous ne pouvez pas vous inscrire en tant qu'administrateur."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Par défaut "patient" si non spécifié
        if not data.get("role"):
            data["role"] = "patient"

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            try:
                user = serializer.save()  # 🔹 Profil Patient/Medecin créé automatiquement par signals
                
                # Send welcome email
                
                return Response({
                    'message': 'Utilisateur enregistré avec succès',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erreur lors de la création de l'utilisateur: {str(e)}")
                return Response(
                    {'error': 'Erreur lors de la création de l\'utilisateur'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------
# Connexion
# --------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            logger.info(f"Tentative de connexion pour: {username}")
            
            if not username or not password:
                return Response(
                    {'error': 'Le nom d\'utilisateur et le mot de passe sont requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Authentifier l'utilisateur
            user = authenticate(username=username, password=password)
            
            if user is None:
                logger.warning(f"Échec d'authentification pour: {username}")
                return Response(
                    {'error': 'Identifiants incorrects'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not user.is_active:
                return Response(
                    {'error': 'Ce compte est désactivé. Veuillez contacter l\'administrateur.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            
            # Récupérer le profil selon le rôle
            profile_data = None
            if hasattr(user, 'patient_profile'):
                profile_data = {
                    'id': user.patient_profile.id,
                    'adresse': getattr(user.patient_profile, 'adresse', '')
                }
            elif hasattr(user, 'medecin'):
                profile_data = {
                    'id': user.medecin.id,
                    'specialite': getattr(user.medecin, 'specialite', '')
                }
            
            logger.info(f"Connexion réussie pour: {username}")
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': getattr(user, 'email', ''),
                    'first_name': getattr(user, 'first_name', ''),
                    'last_name': getattr(user, 'last_name', ''),
                    'role': getattr(user, 'role', 'patient'),
                    'is_active': user.is_active,
                    'profile': profile_data
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erreur lors de la connexion: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Erreur serveur lors de la connexion. Veuillez réessayer plus tard.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def upcoming_appointments(request):
    patient = request.user  # on suppose que user = patient
    today = now().date()

    rdvs = RendezVous.objects.filter(
        patient=patient,
        date__gte=today
    ).exclude(
        statut__in=["CANCELLED", "TERMINE"]
    ).order_by("date", "heure")

    serializer = RendezVousSerializer(rdvs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_patient_medications(request, patient_id=None):
    """Get medications for a specific patient by patient ID or for the authenticated patient"""
    try:
        # If no patient_id is provided, get medications for the authenticated patient
        if patient_id is None:
            # This is for the original patient_medications functionality
            patient = Patient.objects.get(user=request.user)
            rappels = RappelMedicament.objects.filter(patient=patient, actif=True)
            serializer = RappelMedicamentSerializer(rappels, many=True)
            return Response(serializer.data)
        else:
            # Check if the requesting user is authorized to view this patient's medications
            # Either the patient themselves or an admin/doctor
            if request.user.role == 'patient':
                # Patient can only view their own medications
                patient = Patient.objects.get(user=request.user)
                if patient.id != patient_id:
                    return Response({'error': 'Accès non autorisé'}, status=403)
            elif request.user.role == 'medecin':
                # Doctors can view medications of their patients
                # In a real implementation, you might want to check if this patient is actually
                # assigned to this doctor
                pass
            elif request.user.role != 'admin':
                return Response({'error': 'Accès non autorisé'}, status=403)
            
            # Get the patient by ID
            patient = get_object_or_404(Patient, id=patient_id)
            
            # Get medications for this patient
            rappels = RappelMedicament.objects.filter(patient=patient, actif=True)
            serializer = RappelMedicamentSerializer(rappels, many=True)
            return Response(serializer.data)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient non trouvé'}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_appointment(request, pk):
    rdv = get_object_or_404(RendezVous, pk=pk, patient=request.user)
    old_status = rdv.statut
    rdv.statut = "CANCELLED"
    rdv.save()
    
    # Send cancellation notification
    if old_status != "CANCELLED":
        NotificationService.send_appointment_cancellation(rdv)
    
    return Response({"message": "Rendez-vous annulé avec succès"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reschedule_appointment(request, pk):
    rdv = get_object_or_404(RendezVous, pk=pk, patient=request.user)
    new_date = request.data.get("date")
    new_heure = request.data.get("heure")

    if not new_date or not new_heure:
        return Response({"error": "Veuillez fournir une nouvelle date et heure"},
                        status=status.HTTP_400_BAD_REQUEST)

    # Store old values for notification
    old_date = rdv.date
    old_heure = rdv.heure

    # Update appointment with new date/time
    rdv.date = new_date
    rdv.heure = new_heure
    rdv.description = description
    # When a doctor reschedules an appointment, it should be considered as confirmed
    rdv.statut = "CONFIRMED"
    
    # Store original date/time if not already stored
    if not rdv.original_date:
        rdv.original_date = old_date
        rdv.original_heure = old_heure
        
    rdv.save()

    # Send reschedule notification
    if old_status != "RESCHEDULED":
        NotificationService.send_appointment_reschedule(rdv, old_date, old_heure)

    return Response({"message": "Rendez-vous reprogrammé avec succès"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def doctor_reschedule_appointment(request, pk):
    """Doctor reschedules an appointment and notifies the patient"""
    try:
        # Get the appointment - doctors can reschedule any appointment
        rdv = get_object_or_404(RendezVous, pk=pk)
        
        # Check if the user is a doctor
        if request.user.role != 'medecin':
            return Response({"error": "Seuls les médecins peuvent reprogrammer les rendez-vous"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get new date and time from request
        new_date = request.data.get("date")
        new_heure = request.data.get("heure")
        description = request.data.get("description", "")
        
        if not new_date or not new_heure:
            return Response({"error": "Veuillez fournir une nouvelle date et heure"},
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the doctor is already booked at this time slot (excluding the current appointment)
        conflicting_appointments = RendezVous.objects.filter(
            medecin=rdv.medecin,
            date=new_date,
            heure=new_heure
        ).exclude(pk=pk).exclude(statut__in=['CANCELLED'])
        
        if conflicting_appointments.exists():
            return Response({
                "error": "Ce créneau est déjà réservé. Veuillez choisir un autre créneau."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store original values for notification
        old_date = rdv.date
        old_heure = rdv.heure
        old_status = rdv.statut
        
        # Update appointment with new date/time
        rdv.date = new_date
        rdv.heure = new_heure
        rdv.description = description
        rdv.statut = "RESCHEDULED"
        
        # Store original date/time if not already stored
        if not rdv.original_date:
            rdv.original_date = old_date
            rdv.original_heure = old_heure
            
        rdv.save()
        
        # Send notification to patient about the rescheduling
        NotificationService.send_appointment_reschedule(rdv, old_date, old_heure)
        
        serializer = RendezVousSerializer(rdv)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except RendezVous.DoesNotExist:
        return Response({"error": "Rendez-vous non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Erreur doctor_reschedule_appointment: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appointment_history(request):
    """Get appointment history for the authenticated patient"""
    patient = request.user
    rdvs = RendezVous.objects.filter(
        patient=patient
    ).exclude(
        statut="PENDING"
    ).order_by("-date", "-heure")

    serializer = RendezVousSerializer(rdvs, many=True)
    return Response(serializer.data)

# --------------------
# Medication Reminder APIs
# --------------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def medication_reminders(request):
    """Get or create medication reminders for the authenticated patient"""
    try:
        patient = request.user.patient_profile
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'GET':
        # Get all medication reminders for the patient
        reminders = RappelMedicament.objects.filter(patient=patient).order_by('heure_rappel')
        serializer = RappelMedicamentSerializer(reminders, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new medication reminder
        serializer = RappelMedicamentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def medication_reminder_detail(request, pk):
    """Get, update, or delete a specific medication reminder"""
    try:
        patient = request.user.patient_profile
        reminder = get_object_or_404(RappelMedicament, pk=pk, patient=patient)
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.method == 'GET':
        serializer = RappelMedicamentSerializer(reminder)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = RappelMedicamentSerializer(reminder, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def medication_history(request):
    """Get medication history for the authenticated patient"""
    try:
        patient = request.user.patient_profile
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get all medication history for the patient
    history = HistoriquePriseMedicament.objects.filter(
        rappel__patient=patient
    ).select_related('rappel').order_by('-date_prise')
    
    serializer = HistoriquePriseMedicamentSerializer(history, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_medication_taken(request, pk):
    """Mark a medication as taken"""
    try:
        patient = request.user.patient_profile
        history_entry = get_object_or_404(HistoriquePriseMedicament, pk=pk, rappel__patient=patient)
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update the history entry
    history_entry.prise_effectuee = True
    history_entry.notes = request.data.get('notes', 'Pris par le patient')
    history_entry.save()
    
    serializer = HistoriquePriseMedicamentSerializer(history_entry)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def propose_reschedule(request, pk):
    """Patient proposes a new date/time for an appointment"""
    try:
        rdv = RendezVous.objects.get(pk=pk, patient=request.user)
        
        # Check if appointment can be rescheduled
        if rdv.statut in ["CANCELLED"]:
            return Response({"error": "Impossible de reprogrammer un rendez-vous annulé"}, status=400)
        
        # Get proposed new date and time
        new_date = request.data.get("new_date")
        new_heure = request.data.get("new_heure")
        reason = request.data.get("reason", "")
        
        if not new_date or not new_heure:
            return Response({"error": "Veuillez fournir une nouvelle date et heure"}, status=400)
        
        # Create a rescheduling request (doesn't change the original appointment yet)
        # In a real implementation, you might want to create a separate model for rescheduling requests
        # For now, we'll update the appointment with a special status
        
        # Store original details if not already stored
        if not rdv.original_date:
            rdv.original_date = rdv.date
            rdv.original_heure = rdv.heure
            
        # Update with proposed new date/time
        rdv.date = new_date
        rdv.heure = new_heure
        rdv.statut = "RESCHEDULED"
        rdv.description = f"Demande de reprogrammation: {reason}" if reason else rdv.description
        rdv.save()
        
        # Send notification to the doctor about the rescheduling request
        NotificationService.send_reschedule_request(rdv)
        
        serializer = RendezVousSerializer(rdv)
        return Response(serializer.data)
        
    except RendezVous.DoesNotExist:
        return Response({"error": "Rendez-vous non trouvé"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_statistics(request):
    """Statistiques pour le dashboard admin"""
    try:
        print(f"Admin statistics called by user: {request.user.username} with role: {request.user.role}")
        # Vérifier que l'utilisateur est admin
        if request.user.role != 'admin':
            print(f"User {request.user.username} is not admin, role: {request.user.role}")
            return Response({'error': 'Accès non autorisé'}, status=403)

        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        print("Calculating statistics...")

        # Test each model query individually to identify the issue
        try:
            total_users = User.objects.count()
            print(f"Total users: {total_users}")
        except Exception as e:
            print(f"Error counting users: {e}")
            total_users = 0

        try:
            total_patients = Patient.objects.count()
            print(f"Total patients: {total_patients}")
        except Exception as e:
            print(f"Error counting patients: {e}")
            total_patients = 0

        try:
            total_medecins = Medecin.objects.count()
            print(f"Total medecins: {total_medecins}")
        except Exception as e:
            print(f"Error counting medecins: {e}")
            total_medecins = 0

        try:
            total_rendez_vous = RendezVous.objects.count()
            print(f"Total rendez_vous: {total_rendez_vous}")
        except Exception as e:
            print(f"Error counting rendez_vous: {e}")
            total_rendez_vous = 0

        try:
            rendez_vous_today = RendezVous.objects.filter(date=today).count()
            print(f"Rendez_vous today: {rendez_vous_today}")
        except Exception as e:
            print(f"Error counting rendez_vous today: {e}")
            rendez_vous_today = 0

        try:
            rendez_vous_week = RendezVous.objects.filter(date__gte=week_ago).count()
            print(f"Rendez_vous week: {rendez_vous_week}")
        except Exception as e:
            print(f"Error counting rendez_vous week: {e}")
            rendez_vous_week = 0

        try:
            rendez_vous_month = RendezVous.objects.filter(date__gte=month_ago).count()
            print(f"Rendez_vous month: {rendez_vous_month}")
        except Exception as e:
            print(f"Error counting rendez_vous month: {e}")
            rendez_vous_month = 0

        try:
            rendez_vous_by_status = list(RendezVous.objects.values('statut').annotate(count=Count('id')))
            print(f"Rendez_vous by status: {rendez_vous_by_status}")
        except Exception as e:
            print(f"Error getting rendez_vous by status: {e}")
            rendez_vous_by_status = []

        try:
            new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
            print(f"New users week: {new_users_week}")
        except Exception as e:
            print(f"Error counting new users week: {e}")
            new_users_week = 0

        try:
            new_users_month = User.objects.filter(date_joined__gte=month_ago).count()
            print(f"New users month: {new_users_month}")
        except Exception as e:
            print(f"Error counting new users month: {e}")
            new_users_month = 0

        try:
            total_consultations = Consultation.objects.count()
            print(f"Total consultations: {total_consultations}")
        except Exception as e:
            print(f"Error counting consultations: {e}")
            total_consultations = 0

        try:
            total_pathologies = Pathologie.objects.count()
            print(f"Total pathologies: {total_pathologies}")
        except Exception as e:
            print(f"Error counting pathologies: {e}")
            total_pathologies = 0

        try:
            total_medicaments = Medicament.objects.count()
            print(f"Total medicaments: {total_medicaments}")
        except Exception as e:
            print(f"Error counting medicaments: {e}")
            total_medicaments = 0

        stats = {
            'total_users': total_users,
            'total_patients': total_patients,
            'total_medecins': total_medecins,
            'total_rendez_vous': total_rendez_vous,
            'rendez_vous_today': rendez_vous_today,
            'rendez_vous_week': rendez_vous_week,
            'rendez_vous_month': rendez_vous_month,
            'rendez_vous_by_status': rendez_vous_by_status,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'total_consultations': total_consultations,
            'total_pathologies': total_pathologies,
            'total_medicaments': total_medicaments,
        }

        print("Admin statistics completed successfully")
        return Response(stats)
    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(f"Admin statistics error: {error_details}")
        return Response(error_details, status=500)

# ---------- Public Statistics ----------
@api_view(['GET'])
@permission_classes([AllowAny])
def public_statistics(request):
    """Public statistics for the homepage (no authentication required)"""
    from django.db.models import Count
    from datetime import date, timedelta

    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    stats = {
        'total_users': User.objects.count(),
        'total_patients': Patient.objects.count(),
        'total_doctors': Medecin.objects.count(),
        'total_clinics': Clinique.objects.count(),
        'total_pharmacies': Pharmacie.objects.count(),
        'total_hospitals': Hopital.objects.count(),
        'total_dentists': Dentiste.objects.count(),
        'total_appointments': RendezVous.objects.count(),
        'appointments_today': RendezVous.objects.filter(date=today).count(),
        'appointments_week': RendezVous.objects.filter(date__gte=week_ago).count(),
        'appointments_month': RendezVous.objects.filter(date__gte=month_ago).count(),
        'new_users_week': User.objects.filter(date_joined__gte=week_ago).count(),
        'new_users_month': User.objects.filter(date_joined__gte=month_ago).count(),
    }

    return Response(stats)

# ========== ARTICLES PUBLICS ==========

@api_view(['GET'])
@permission_classes([AllowAny])
def articles_publics(request):
    """Liste des articles validés (accès public) avec pagination"""
    articles = Article.objects.filter(statut='valide').order_by('-date_publication')

    # Filtres optionnels
    categorie = request.GET.get('categorie')
    search = request.GET.get('search')

    if categorie and categorie != 'all':
        articles = articles.filter(categorie=categorie)

    if search:
        from django.db.models import Q
        articles = articles.filter(
            Q(titre__icontains=search) |
            Q(contenu__icontains=search) |
            Q(tags__icontains=search) |
            Q(resume__icontains=search)
        )

    # Pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 12  # Articles per page
    paginator.page_size_query_param = 'page_size'
    paginator.max_page_size = 100
    
    result_page = paginator.paginate_queryset(articles, request)
    serializer = ArticleListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def article_detail_public(request, slug):
    """Détail d'un article public"""
    try:
        article = Article.objects.get(slug=slug, statut='valide')
        article.incrementer_vues()
        serializer = ArticleSerializer(article, context={'request': request})
        return Response(serializer.data)
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)


# ========== ARTICLES MÉDECINS ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def articles_medecin(request):
    """Gestion des articles par les médecins"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
    except Medecin.DoesNotExist:
        return Response({'error': 'Profil médecin non trouvé'}, status=404)

    if request.method == 'GET':
        # Récupérer tous les articles du médecin
        statut = request.GET.get('statut', 'all')
        articles = Article.objects.filter(auteur=medecin)

        if statut != 'all':
            articles = articles.filter(statut=statut)

        articles = articles.order_by('-date_modification')
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Créer un nouvel article
        data = request.data.copy()
        data['auteur'] = medecin.id  # Set the author to the current doctor

        serializer = ArticleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            article = serializer.save()
            return Response(ArticleSerializer(article, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def article_medecin_detail(request, pk):
    """Détail/modification/suppression d'un article par le médecin"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
        article = Article.objects.get(pk=pk, auteur=medecin)
    except Medecin.DoesNotExist:
        return Response({'error': 'Profil médecin non trouvé'}, status=404)
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé ou non autorisé'}, status=404)

    if request.method == 'GET':
        serializer = ArticleSerializer(article, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        if article.statut not in ['brouillon', 'refuse']:
            return Response({'error': 'Seuls les brouillons et articles refusés peuvent être modifiés'}, status=400)

        serializer = ArticleSerializer(article, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        if article.statut != 'brouillon':
            return Response({'error': 'Seuls les brouillons peuvent être supprimés'}, status=400)
        article.delete()
        return Response({'message': 'Article supprimé avec succès'}, status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def article_soumettre_validation(request, pk):
    """Soumettre un article pour validation par l'admin"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
        article = Article.objects.get(pk=pk, auteur=medecin)
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)

    if article.statut not in ['brouillon', 'refuse']:
        return Response({'error': 'Cet article ne peut pas être soumis'}, status=400)

    # Vérifier que les champs obligatoires sont remplis
    if not article.titre or not article.contenu or not article.resume:
        return Response({'error': 'Veuillez remplir tous les champs obligatoires'}, status=400)

    article.statut = 'en_attente'
    article.save()

    return Response({
        'message': 'Article soumis pour validation avec succès',
        'statut': article.statut
    })


# -------------------- Ratings & Reviews --------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_appointment(request, pk):
    """Valider un rendez-vous terminé et créer une évaluation"""
    try:
        patient = request.user.patient_profile
        rdv = get_object_or_404(RendezVous, pk=pk, patient=request.user)
        
        # Vérifier que le rendez-vous est terminé
        if rdv.statut != "CONFIRMED":
            return Response({"error": "Seuls les rendez-vous confirmés peuvent être validés"}, status=400)
            
        # Marquer le rendez-vous comme terminé
        rdv.statut = "TERMINE"
        rdv.save()
        
        # Créer ou mettre à jour l'évaluation
        note = request.data.get('note')
        commentaire = request.data.get('commentaire', '')
        
        if note is not None:
            # Vérifier que la note est valide (1-5)
            if not isinstance(note, int) or note < 1 or note > 5:
                return Response({"error": "La note doit être un entier entre 1 et 5"}, status=400)
                
            # Créer ou mettre à jour l'évaluation
            rating_data = {
                'medecin': rdv.medecin.id,
                'rendez_vous': rdv.id,
                'note': note,
                'commentaire': commentaire
            }
            
            # Vérifier si une évaluation existe déjà
            try:
                rating = Rating.objects.get(patient=patient, rendez_vous=rdv)
                # Mettre à jour l'évaluation existante
                for key, value in rating_data.items():
                    setattr(rating, key, value)
                rating.save()
                serializer = RatingSerializer(rating)
            except Rating.DoesNotExist:
                # Créer une nouvelle évaluation
                serializer = RatingSerializer(data=rating_data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Send notification to the doctor about the new rating
            NotificationService.send_rating_notification(rdv.medecin, note, commentaire)
            
            return Response({
                "message": "Rendez-vous validé et évaluation enregistrée avec succès",
                "rating": serializer.data
            })
        else:
            return Response({
                "message": "Rendez-vous validé avec succès"
            })
            
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -------------------- Ratings & Reviews --------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_appointment(request, pk):
    """Valider un rendez-vous terminé et créer une évaluation"""
    try:
        patient = request.user.patient_profile
        rdv = get_object_or_404(RendezVous, pk=pk, patient=request.user)
        
        # Vérifier que le rendez-vous est terminé
        if rdv.statut != "CONFIRMED":
            return Response({"error": "Seuls les rendez-vous confirmés peuvent être validés"}, status=400)
            
        # Marquer le rendez-vous comme terminé
        rdv.statut = "TERMINE"
        rdv.save()
        
        # Créer ou mettre à jour l'évaluation
        note = request.data.get('note')
        commentaire = request.data.get('commentaire', '')
        
        if note is not None:
            # Vérifier que la note est valide (1-5)
            if not isinstance(note, int) or note < 1 or note > 5:
                return Response({"error": "La note doit être un entier entre 1 et 5"}, status=400)
                
            # Créer ou mettre à jour l'évaluation
            rating_data = {
                'medecin': rdv.medecin.id,
                'rendez_vous': rdv.id,
                'note': note,
                'commentaire': commentaire
            }
            
            # Vérifier si une évaluation existe déjà
            try:
                rating = Rating.objects.get(patient=patient, rendez_vous=rdv)
                # Mettre à jour l'évaluation existante
                for key, value in rating_data.items():
                    setattr(rating, key, value)
                rating.save()
                serializer = RatingSerializer(rating)
            except Rating.DoesNotExist:
                # Créer une nouvelle évaluation
                serializer = RatingSerializer(data=rating_data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Send notification to the doctor about the new rating
            NotificationService.send_rating_notification(rdv.medecin, note, commentaire)
            
            return Response({
                "message": "Rendez-vous validé et évaluation enregistrée avec succès",
                "rating": serializer.data
            })
        else:
            return Response({
                "message": "Rendez-vous validé avec succès"
            })
            
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appointment_rating(request, pk):
    """Récupérer l'évaluation d'un rendez-vous"""
    try:
        patient = request.user.patient_profile
        rdv = get_object_or_404(RendezVous, pk=pk, patient=request.user)
        
        try:
            rating = Rating.objects.get(patient=patient, rendez_vous=rdv)
            serializer = RatingSerializer(rating)
            return Response(serializer.data)
        except Rating.DoesNotExist:
            return Response({"message": "Aucune évaluation trouvée pour ce rendez-vous"}, status=404)
            
    except Patient.DoesNotExist:
        return Response({"error": "Profil patient non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== ARTICLES ADMIN (Modération) ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def articles_admin_list(request):
    """Liste de tous les articles pour modération (admin uniquement)"""
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_queryset(self):
        return Article.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Ajouter automatiquement l'auteur (médecin connecté)"""
        # Vérifier que l'utilisateur est un médecin
        if not hasattr(self.request.user, 'medecin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les médecins peuvent créer des articles")
        
        # Debug logging
        print(f"Setting author to: {self.request.user.medecin}")
        serializer.save(auteur=self.request.user.medecin)
    
    def perform_update(self, serializer):
        """Garder l'auteur lors de la modification"""
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_articles(self, request):
        """Liste des articles du médecin connecté"""
        medecin = request.user.medecin
        articles = Article.objects.filter(auteur=medecin).order_by('-date_publication')
        
        # Filter by status if provided
        statut = request.query_params.get('statut', None)
        if statut and statut != 'all':
            articles = articles.filter(statut=statut)
        
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def soumettre(self, request, pk=None):
        """Soumettre un article pour validation"""
        article = self.get_object()
        if article.auteur.user != request.user:
            return Response({'error': 'Non autorisé'}, status=403)

        article.statut = 'en_attente'
        article.save()
        return Response({'message': 'Article soumis pour validation'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def valider(self, request, pk=None):
        """Valider un article et notifier le médecin"""
        article = self.get_object()
        article.statut = 'valide'
        article.valide_par = request.user
        article.date_validation = timezone.now()
        article.commentaire_moderation = request.data.get('commentaire', '')
        article.save()
        
        # Send notification to the doctor
        NotificationService.send_article_validated_notification(article)
        
        # Create database notification
        from .models import Notification
        Notification.objects.create(
            medecin=article.auteur,
            type='article_valide',
            titre='Article validé',
            message=f'Votre article "{article.titre}" a été validé et est maintenant visible publiquement.',
            article_titre=article.titre
        )
        
        return Response({
            'message': 'Article validé avec succès',
            'article': ArticleSerializer(article).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def refuser(self, request, pk=None):
        """Refuser/Annuler un article (suppression) et notifier le médecin"""
        article = self.get_object()
        titre = article.titre
        auteur_email = article.auteur.user.email
        commentaire = request.data.get('commentaire', '')
        
        # Send notification to the doctor before deletion
        NotificationService.send_article_rejected_notification(article, commentaire)
        
        # Create database notification
        from .models import Notification
        Notification.objects.create(
            medecin=article.auteur,
            type='article_refuse',
            titre='Article refusé',
            message=f'Votre article "{article.titre}" a été refusé. Raison: {commentaire}',
            article_titre=article.titre
        )
        
        article.delete()
        
        return Response({
            'message': f'Article "{titre}" supprimé avec succès',
            'commentaire': commentaire
        }, status=204)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def desactiver(self, request, pk=None):
        """Désactiver un article (masquer sans supprimer) et notifier le médecin"""
        article = self.get_object()
        article.statut = 'desactive'
        article.commentaire_moderation = request.data.get('commentaire', '')
        article.save()
        
        # Send notification to the doctor
        NotificationService.send_article_deactivated_notification(article)
        
        # Create database notification
        from .models import Notification
        Notification.objects.create(
            medecin=article.auteur,
            type='article_desactive',
            titre='Article désactivé',
            message=f'Votre article "{article.titre}" a été désactivé. Raison: {article.commentaire_moderation}',
            article_titre=article.titre
        )
        
        return Response({
            'message': 'Article désactivé avec succès',
            'article': ArticleSerializer(article).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reactiver(self, request, pk=None):
        """Réactiver un article désactivé"""
        article = self.get_object()
        if article.statut != 'desactive':
            return Response({'error': 'Seuls les articles désactivés peuvent être réactivés'}, status=400)
        
        article.statut = 'valide'
        article.commentaire_moderation = ''
        article.save()
        
        return Response({
            'message': 'Article réactivé avec succès',
            'article': ArticleSerializer(article).data
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def liste_admin(self, request):
        """Liste de tous les articles pour l'admin avec filtres"""
        statut = request.query_params.get('statut', None)
        
        articles = Article.objects.all().order_by('-date_publication')
        
        if statut:
            articles = articles.filter(statut=statut)
        
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def statistiques(self, request):
        """Statistiques des articles pour le dashboard admin"""
        stats = {
            'total': Article.objects.count(),
            'en_attente': Article.objects.filter(statut='en_attente').count(),
            'valides': Article.objects.filter(statut='valide').count(),
            'desactives': Article.objects.filter(statut='desactive').count(),
            'brouillons': Article.objects.filter(statut='brouillon').count(),
        }
        return Response(stats)

    @action(detail=True, methods=['delete'], permission_classes=[IsAdminUser])
    def supprimer(self, request, pk=None):
        """Supprimer définitivement un article"""
        article = self.get_object()
        article.delete()
        return Response({'message': 'Article supprimé'}, status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def articles_admin_list(request):
    """Liste des articles pour modération"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    statut = request.GET.get('statut', 'all')
    articles = Article.objects.all().order_by('-date_modification')

    if statut != 'all':
        articles = articles.filter(statut=statut)

    serializer = ArticleSerializer(articles, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def article_admin_detail(request, pk):
    """Détail d'un article pour modération"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    try:
        article = Article.objects.get(pk=pk)
        serializer = ArticleSerializer(article, context={'request': request})
        return Response(serializer.data)
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def article_valider(request, pk):
    """Valider un article (admin)"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    try:
        article = Article.objects.get(pk=pk)

        if article.statut not in ['en_attente', 'refuse', 'desactive']:
            return Response({'error': 'Cet article ne peut pas être validé'}, status=400)

        article.statut = 'valide'
        article.valide_par = request.user
        from django.utils import timezone
        article.date_validation = timezone.now()
        article.commentaire_moderation = request.data.get('commentaire', '')
        article.save()

        return Response({
            'message': 'Article validé avec succès',
            'statut': article.statut
        })
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def article_refuser(request, pk):
    """Refuser un article (admin)"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    commentaire = request.data.get('commentaire')
    if not commentaire:
        return Response({'error': 'Le commentaire est obligatoire pour refuser un article'}, status=400)

    try:
        article = Article.objects.get(pk=pk)

        article.statut = 'refuse'
        article.valide_par = request.user
        from django.utils import timezone
        article.date_validation = timezone.now()
        article.commentaire_moderation = commentaire
        article.save()

        return Response({
            'message': 'Article refusé',
            'statut': article.statut
        })
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def article_desactiver(request, pk):
    """Désactiver un article publié (admin)"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    try:
        article = Article.objects.get(pk=pk)

        if article.statut != 'valide':
            return Response({'error': 'Seuls les articles validés peuvent être désactivés'}, status=400)

        article.statut = 'desactive'
        article.commentaire_moderation = request.data.get('commentaire', 'Article désactivé')
        article.save()

        return Response({
            'message': 'Article désactivé',
            'statut': article.statut
        })
    except Article.DoesNotExist:
        return Response({'error': 'Article non trouvé'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def articles_statistics(request):
    """Statistiques des articles pour le dashboard admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    from django.db.models import Count, Sum
    stats = {
        'total': Article.objects.count(),
        'brouillons': Article.objects.filter(statut='brouillon').count(),
        'en_attente': Article.objects.filter(statut='en_attente').count(),
        'valides': Article.objects.filter(statut='valide').count(),
        'refuses': Article.objects.filter(statut='refuse').count(),
        'desactives': Article.objects.filter(statut='desactive').count(),
        'total_vues': Article.objects.filter(statut='valide').aggregate(total=Sum('vues'))['total'] or 0,
        'par_categorie': list(Article.objects.filter(statut='valide').values('categorie').annotate(count=Count('id')))
    }

    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Liste tous les utilisateurs pour l'admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès non autorisé'}, status=403)

    users = User.objects.all().order_by('-date_joined')
    data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': getattr(user, 'role', 'patient'),  # Default to 'patient' if role not set
        'is_active': user.is_active,
        'date_joined': user.date_joined
    } for user in users]

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_user(request):
    """Créer un nouvel utilisateur par l'admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès non autorisé'}, status=403)

    try:
        # Create user with provided data
        user_data = request.data.copy()
        
        # Check if username already exists
        if User.objects.filter(username=user_data.get('username')).exists():
            return Response({'error': 'Ce nom d\'utilisateur est déjà utilisé'}, status=400)
            
        # Check if email already exists
        if User.objects.filter(email=user_data.get('email')).exists():
            return Response({'error': 'Cet email est déjà utilisé'}, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=user_data.get('username'),
            password=user_data.get('password'),
            email=user_data.get('email'),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            role=user_data.get('role', 'patient'),
            is_active=user_data.get('is_active', True)
        )
        
        # Create profile based on role
        if user.role == 'patient':
            Patient.objects.get_or_create(user=user, defaults={'adresse': user_data.get('adresse', '')})
        elif user.role == 'medecin':
            Medecin.objects.get_or_create(user=user, defaults={
                'specialite': user_data.get('specialite', 'Généraliste'),
                'disponibilite': user_data.get('disponibilite', True)
            })
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': f'Erreur lors de la création de l\'utilisateur: {str(e)}'}, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, user_id):
    """Mettre à jour un utilisateur par l'admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès non autorisé'}, status=403)

    try:
        user = User.objects.get(id=user_id)
        
        # Prevent admin from modifying another admin
        if user.role == 'admin' and user.id != request.user.id:
            return Response({'error': 'Impossible de modifier un autre administrateur'}, status=400)
        
        # Update user fields
        user_data = request.data
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.username = user_data.get('username', user.username)
        
        # Only allow role change if it's not an admin
        if user.role != 'admin':
            user.role = user_data.get('role', user.role)
        
        # Update active status
        user.is_active = user_data.get('is_active', user.is_active)
        
        # Save user
        user.save()
        
        # Update profile based on role
        if user.role == 'patient':
            patient, created = Patient.objects.get_or_create(user=user)
            if 'adresse' in user_data:
                patient.adresse = user_data['adresse']
                patient.save()
        elif user.role == 'medecin':
            medecin, created = Medecin.objects.get_or_create(user=user)
            if 'specialite' in user_data:
                medecin.specialite = user_data['specialite']
            if 'disponibilite' in user_data:
                medecin.disponibilite = user_data['disponibilite']
            medecin.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=404)
    except Exception as e:
        return Response({'error': f'Erreur lors de la mise à jour de l\'utilisateur: {str(e)}'}, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_toggle_user_status(request, user_id):
    """Activer/désactiver un utilisateur"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès non autorisé'}, status=403)

    try:
        user = User.objects.get(id=user_id)
        if user.role == 'admin' and user.id != request.user.id:
            return Response({'error': 'Impossible de modifier un autre administrateur'}, status=400)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'message': f'Utilisateur {"activé" if user.is_active else "désactivé"}',
            'is_active': user.is_active
        })
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    """Supprimer un utilisateur"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès non autorisé'}, status=403)

    try:
        user = User.objects.get(id=user_id)
        if user.role == 'admin':
            return Response({'error': 'Impossible de supprimer un administrateur'}, status=400)
        user.delete()
        return Response({'message': 'Utilisateur supprimé'}, status=204)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_facilities(request):
    """Liste de tous les centres de santé pour la carte"""
    facilities = []

    # Récupérer les hôpitaux
    hopitaux = Hopital.objects.all()
    for hopital in hopitaux:
        facilities.append({
            'id': f'hopital_{hopital.id}',
            'nom': hopital.nom,
            'type': 'hopital',
            'adresse': getattr(hopital, 'adresse', ''),
            'latitude': float(getattr(hopital, 'latitude', 14.6928)),
            'longitude': float(getattr(hopital, 'longitude', -17.4467)),
            'telephone': getattr(hopital, 'telephone', ''),
            'horaires': getattr(hopital, 'horaires', ''),
        })

    # Récupérer les cliniques
    cliniques = Clinique.objects.all()
    for clinique in cliniques:
        facilities.append({
            'id': f'clinique_{clinique.id}',
            'nom': clinique.nom,
            'type': 'clinique',
            'adresse': getattr(clinique, 'adresse', ''),
            'latitude': float(getattr(clinique, 'latitude', 14.6928)),
            'longitude': float(getattr(clinique, 'longitude', -17.4467)),
            'telephone': getattr(clinique, 'telephone', ''),
            'horaires': getattr(clinique, 'horaires', ''),
        })

    # Récupérer les pharmacies
    pharmacies = Pharmacie.objects.all()
    for pharmacie in pharmacies:
        facilities.append({
            'id': f'pharmacie_{pharmacie.id}',
            'nom': pharmacie.nom,
            'type': 'pharmacie',
            'adresse': getattr(pharmacie, 'adresse', ''),
            'latitude': float(getattr(pharmacie, 'latitude', 14.6928)),
            'longitude': float(getattr(pharmacie, 'longitude', -17.4467)),
            'telephone': getattr(pharmacie, 'telephone', ''),
            'horaires': getattr(pharmacie, 'horaires', ''),
        })

    # Récupérer les dentistes
    dentistes = Dentiste.objects.all()
    for dentiste in dentistes:
        facilities.append({
            'id': f'dentiste_{dentiste.id}',
            'nom': dentiste.nom,
            'type': 'dentiste',
            'adresse': getattr(dentiste, 'adresse', ''),
            'latitude': float(getattr(dentiste, 'latitude', 14.6928)),
            'longitude': float(getattr(dentiste, 'longitude', -17.4467)),
            'telephone': getattr(dentiste, 'telephone', ''),
            'horaires': getattr(dentiste, 'horaires', ''),
        })

    return Response(facilities)


# -------------------- Admin Chatbot Management --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_chatbot_knowledge_base(request):
    """Get all chatbot knowledge base entries for admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    entries = ChatbotKnowledgeBase.objects.all().order_by('-created_at')
    serializer = ChatbotKnowledgeBaseSerializer(entries, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_chatbot_entry(request):
    """Create a new chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    serializer = ChatbotKnowledgeBaseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_update_chatbot_entry(request, pk):
    """Update a chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        entry = ChatbotKnowledgeBase.objects.get(pk=pk)
    except ChatbotKnowledgeBase.DoesNotExist:
        return Response({'error': 'Entrée non trouvée'}, status=404)
    
    serializer = ChatbotKnowledgeBaseSerializer(entry, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_chatbot_entry(request, pk):
    """Delete a chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        entry = ChatbotKnowledgeBase.objects.get(pk=pk)
        entry.delete()
        return Response({'message': 'Entrée supprimée avec succès'}, status=status.HTTP_204_NO_CONTENT)
    except ChatbotKnowledgeBase.DoesNotExist:
        return Response({'error': 'Entrée non trouvée'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_chatbot_statistics(request):
    """Get chatbot statistics for admin dashboard"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    from django.db.models import Count
    
    # Get top questions from conversation history
    top_questions = ChatbotConversation.objects.values('message_user').annotate(
        count=Count('message_user')
    ).order_by('-count')[:10]
    
    stats = {
        'total_conversations': ChatbotConversation.objects.count(),
        'total_users': ChatbotConversation.objects.values('patient').distinct().count(),
        'avg_response_time': '2.3s',  # This would need to be calculated in a real implementation
        'top_questions': [
            {'question': item['message_user'], 'count': item['count']} 
            for item in top_questions
        ]
    }
    
    return Response(stats)


# -------------------- Admin Chatbot Management --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_chatbot_knowledge_base(request):
    """Get all chatbot knowledge base entries for admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    entries = ChatbotKnowledgeBase.objects.all().order_by('-created_at')
    serializer = ChatbotKnowledgeBaseSerializer(entries, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_chatbot_entry(request):
    """Create a new chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    serializer = ChatbotKnowledgeBaseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_update_chatbot_entry(request, pk):
    """Update a chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        entry = ChatbotKnowledgeBase.objects.get(pk=pk)
    except ChatbotKnowledgeBase.DoesNotExist:
        return Response({'error': 'Entrée non trouvée'}, status=404)
    
    serializer = ChatbotKnowledgeBaseSerializer(entry, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_chatbot_entry(request):
    """Create a new chatbot knowledge base entry"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    serializer = ChatbotKnowledgeBaseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------- Admin Appointment Management --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_appointments_list(request):
    """List all appointments for admin dashboard"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    # Get all appointments with related data
    appointments = RendezVous.objects.select_related('patient', 'medecin').all().order_by('-date_creation')
    
    # Apply filters if provided
    status = request.GET.get('status')
    if status:
        appointments = appointments.filter(statut=status)
    
    date_from = request.GET.get('date_from')
    if date_from:
        appointments = appointments.filter(date__gte=date_from)
        
    date_to = request.GET.get('date_to')
    if date_to:
        appointments = appointments.filter(date__lte=date_to)
    
    serializer = RendezVousSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_validate_appointment(request, pk):
    """Validate an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        
        # Only validate confirmed appointments
        if appointment.statut != 'CONFIRMED':
            return Response({'error': 'Seuls les rendez-vous confirmés peuvent être validés'}, status=400)
        
        appointment.statut = 'TERMINE'
        appointment.save()
        
        return Response({
            'message': 'Rendez-vous validé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_appointment(request, pk):
    """Cancel an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        
        # Store old status for notification
        old_status = appointment.statut
        appointment.statut = 'CANCELLED'
        appointment.save()
        
        # Send cancellation notification if not already cancelled
        if old_status != 'CANCELLED':
            NotificationService.send_appointment_cancellation(appointment)
        
        return Response({
            'message': 'Rendez-vous annulé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reschedule_appointment(request, pk):
    """Reschedule an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        new_date = request.data.get('date')
        new_time = request.data.get('heure')
        
        if not new_date or not new_time:
            return Response({'error': 'Date et heure requises pour reprogrammer'}, status=400)
        
        # Store old values for notification
        old_date = appointment.date
        old_time = appointment.heure
        old_status = appointment.statut
        
        # Update appointment
        appointment.date = new_date
        appointment.heure = new_time
        appointment.statut = 'RESCHEDULED'
        appointment.save()
        
        # Send reschedule notification if not already rescheduled
        if old_status != 'RESCHEDULED':
            NotificationService.send_appointment_reschedule(appointment, old_date, old_time)
        
        return Response({
            'message': 'Rendez-vous reprogrammé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_appointments_statistics(request):
    """Get appointment statistics for admin dashboard"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    from django.db.models import Count
    from datetime import date, timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    stats = {
        'total_appointments': RendezVous.objects.count(),
        'today_appointments': RendezVous.objects.filter(date=today).count(),
        'week_appointments': RendezVous.objects.filter(date__gte=week_ago).count(),
        'month_appointments': RendezVous.objects.filter(date__gte=month_ago).count(),
        'appointments_by_status': list(RendezVous.objects.values('statut').annotate(count=Count('id'))),
        'confirmed_appointments': RendezVous.objects.filter(statut='CONFIRMED').count(),
        'cancelled_appointments': RendezVous.objects.filter(statut='CANCELLED').count(),
        'rescheduled_appointments': RendezVous.objects.filter(statut='RESCHEDULED').count(),
        'pending_appointments': RendezVous.objects.filter(statut='PENDING').count(),
        'completed_appointments': RendezVous.objects.filter(statut='TERMINE').count(),
    }
    
    return Response(stats)


# -------------------- Messaging Functionality --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get all conversations for the current user"""
    conversations = request.user.conversations.all()
    serializer = ConversationSerializer(conversations, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get all messages for a specific conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        messages = conversation.messages.all()
        
        # Mark messages as read (except those sent by the current user)
        for message in messages:
            if message.sender != request.user and not message.is_read:
                message.mark_as_read()
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation non trouvée"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Create a new conversation"""
    try:
        recipient_id = request.data.get('recipient_id')
        subject = request.data.get('subject', 'Nouvelle conversation')
        
        if not recipient_id:
            return Response({"error": "ID du destinataire requis"}, status=400)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "Destinataire non trouvé"}, status=404)
        
        # Check if conversation already exists between these two users
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).distinct()
        
        if existing_conversation.exists():
            conversation = existing_conversation.first()
        else:
            # Create new conversation
            conversation = Conversation.objects.create(subject=subject)
            conversation.participants.add(request.user, recipient)
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a new message"""
    try:
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content')
        
        if not conversation_id or not content:
            return Response({"error": "ID de conversation et contenu requis"}, status=400)
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation non trouvée"}, status=404)
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_message_as_read(request, message_id):
    """Mark a message as read"""
    try:
        message = Message.objects.get(id=message_id, conversation__participants=request.user)
        message.mark_as_read()
        return Response({"message": "Message marqué comme lu"})
    except Message.DoesNotExist:
        return Response({"error": "Message non trouvé"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get unread messages count for the current user"""
    unread_count = Message.objects.filter(
        conversation__participants=request.user,
        is_read=False
    ).exclude(sender=request.user).count()
    
    return Response({"unread_count": unread_count})


# -------------------- Admin Appointment Management --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_appointments_list(request):
    """List all appointments for admin dashboard"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    # Get all appointments with related data
    appointments = RendezVous.objects.select_related('patient', 'medecin').all().order_by('-date_creation')
    
    # Apply filters if provided
    status = request.GET.get('status')
    if status:
        appointments = appointments.filter(statut=status)
    
    date_from = request.GET.get('date_from')
    if date_from:
        appointments = appointments.filter(date__gte=date_from)
        
    date_to = request.GET.get('date_to')
    if date_to:
        appointments = appointments.filter(date__lte=date_to)
    
    serializer = RendezVousSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_validate_appointment(request, pk):
    """Validate an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        
        # Only validate confirmed appointments
        if appointment.statut != 'CONFIRMED':
            return Response({'error': 'Seuls les rendez-vous confirmés peuvent être validés'}, status=400)
        
        appointment.statut = 'TERMINE'
        appointment.save()
        
        return Response({
            'message': 'Rendez-vous validé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_appointment(request, pk):
    """Cancel an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        
        # Store old status for notification
        old_status = appointment.statut
        appointment.statut = 'CANCELLED'
        appointment.save()
        
        # Send cancellation notification if not already cancelled
        if old_status != 'CANCELLED':
            NotificationService.send_appointment_cancellation(appointment)
        
        return Response({
            'message': 'Rendez-vous annulé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_appointment(request, pk):
    """Cancel an appointment by admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)
    
    try:
        appointment = RendezVous.objects.get(pk=pk)
        
        # Store old status for notification
        old_status = appointment.statut
        appointment.statut = 'CANCELLED'
        appointment.save()
        
        # Send cancellation notification if not already cancelled
        if old_status != 'CANCELLED':
            NotificationService.send_appointment_cancellation(appointment)
        
        return Response({
            'message': 'Rendez-vous annulé avec succès',
            'appointment': RendezVousSerializer(appointment).data
        })
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=404)


# -------------------- Messaging Functionality --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get all conversations for the current user"""
    conversations = request.user.conversations.all()
    serializer = ConversationSerializer(conversations, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get all messages for a specific conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        messages = conversation.messages.all()
        
        # Mark messages as read (except those sent by the current user)
        for message in messages:
            if message.sender != request.user and not message.is_read:
                message.mark_as_read()
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation non trouvée"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Create a new conversation"""
    try:
        recipient_id = request.data.get('recipient_id')
        subject = request.data.get('subject', 'Nouvelle conversation')
        
        if not recipient_id:
            return Response({"error": "ID du destinataire requis"}, status=400)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({"error": "Destinataire non trouvé"}, status=404)
        
        # Check if conversation already exists between these two users
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).distinct()
        
        if existing_conversation.exists():
            conversation = existing_conversation.first()
        else:
            # Create new conversation
            conversation = Conversation.objects.create(subject=subject)
            conversation.participants.add(request.user, recipient)
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a new message"""
    try:
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content')
        
        if not conversation_id or not content:
            return Response({"error": "ID de conversation et contenu requis"}, status=400)
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation non trouvée"}, status=404)
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a new message"""
    try:
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content')
        
        if not conversation_id or not content:
            return Response({"error": "ID de conversation et contenu requis"}, status=400)
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation non trouvée"}, status=404)
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# ========== URGENCES PATIENT ==========

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def urgences_patient(request):
    """Gestion des urgences pour les patients"""
    if request.user.role != 'patient':
        return Response({'error': 'Accès réservé aux patients'}, status=403)

    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response({'error': 'Profil patient non trouvé'}, status=404)

    if request.method == 'GET':
        urgences = Urgence.objects.filter(patient=patient).order_by('-date_creation')
        serializer = UrgenceSerializer(urgences, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['patient'] = patient.id

        serializer = UrgenceSerializer(data=data)
        if serializer.is_valid():
            urgence = serializer.save()

            # Envoyer notifications aux médecins disponibles
            notifier_medecins_urgence(urgence)

            # Envoyer email au patient
            from .notifications import NotificationService
            NotificationService.send_urgence_confirmation(urgence)

            return Response(UrgenceSerializer(urgence).data, status=201)
        return Response(serializer.errors, status=400)


def notifier_medecins_urgence(urgence):
    """Envoyer des notifications aux médecins disponibles"""
    # Récupérer les médecins disponibles (vous pouvez affiner la logique)
    medecins = Medecin.objects.filter(disponibilite='disponible')[:5]  # Top 5

    for medecin in medecins:
        NotificationUrgence.objects.create(
            urgence=urgence,
            medecin=medecin
        )

        # Envoyer email au médecin
        from .notifications import NotificationService
        NotificationService.send_urgence_notification_medecin(urgence, medecin)


# ========== URGENCES MÉDECIN ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def urgences_medecin(request):
    """Liste des urgences pour les médecins"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
    except Medecin.DoesNotExist:
        return Response({'error': 'Profil médecin non trouvé'}, status=404)

    statut = request.GET.get('statut', 'en_attente')

    if statut == 'mes_prises_en_charge':
        urgences = Urgence.objects.filter(medecin_charge=medecin)
    else:
        urgences = Urgence.objects.filter(statut=statut)

    urgences = urgences.order_by('-priorite', '-date_creation')
    serializer = UrgenceSerializer(urgences, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def urgence_prendre_en_charge(request, pk):
    """Prendre en charge une urgence"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
        urgence = Urgence.objects.get(pk=pk)
    except Medecin.DoesNotExist:
        return Response({'error': 'Profil médecin non trouvé'}, status=404)
    except Urgence.DoesNotExist:
        return Response({'error': 'Urgence non trouvée'}, status=404)

    if urgence.statut != 'en_attente':
        return Response({'error': 'Cette urgence a déjà été prise en charge'}, status=400)

    urgence.statut = 'prise_en_charge'
    urgence.medecin_charge = medecin
    urgence.date_prise_en_charge = timezone.now()
    urgence.save()

    # Notifier le patient
    from .notifications import NotificationService
    NotificationService.send_urgence_prise_en_charge(urgence)

    return Response({
        'message': 'Urgence prise en charge',
        'urgence': UrgenceSerializer(urgence).data
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def urgence_resoudre(request, pk):
    """Marquer une urgence comme résolue"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
        urgence = Urgence.objects.get(pk=pk, medecin_charge=medecin)
    except Urgence.DoesNotExist:
        return Response({'error': 'Urgence non trouvée ou non autorisée'}, status=404)

    urgence.statut = 'resolue'
    urgence.notes_medecin = request.data.get('notes', '')
    urgence.save()

    return Response({
        'message': 'Urgence marquée comme résolue',
        'urgence': UrgenceSerializer(urgence).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_urgences_medecin(request):
    """Récupérer les notifications d'urgences pour un médecin"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
    except Medecin.DoesNotExist:
        return Response({'error': 'Profil médecin non trouvé'}, status=404)

    # Notifications non lues en premier
    notifications = NotificationUrgence.objects.filter(
        medecin=medecin
    ).order_by('lue', '-date_envoi')[:20]

    serializer = NotificationUrgenceSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_marquer_lue(request, pk):
    """Marquer une notification comme lue"""
    if request.user.role != 'medecin':
        return Response({'error': 'Accès réservé aux médecins'}, status=403)

    try:
        medecin = Medecin.objects.get(user=request.user)
        notification = NotificationUrgence.objects.get(pk=pk, medecin=medecin)

        notification.lue = True
        notification.date_lecture = timezone.now()
        notification.save()

        return Response({'message': 'Notification marquée comme lue'})
    except NotificationUrgence.DoesNotExist:
        return Response({'error': 'Notification non trouvée'}, status=404)


# ========== URGENCES ADMIN ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def urgences_admin_dashboard(request):
    """Dashboard des urgences pour l'admin"""
    if request.user.role != 'admin':
        return Response({'error': 'Accès réservé aux administrateurs'}, status=403)

    stats = {
        'total': Urgence.objects.count(),
        'en_attente': Urgence.objects.filter(statut='en_attente').count(),
        'prise_en_charge': Urgence.objects.filter(statut='prise_en_charge').count(),
        'resolues': Urgence.objects.filter(statut='resolue').count(),
        'critiques': Urgence.objects.filter(priorite='critique', statut__in=['en_attente', 'prise_en_charge']).count(),
        'par_priorite': list(Urgence.objects.values('priorite').annotate(count=models.Count('id'))),
        'temps_moyen_prise_en_charge': 'À calculer',  # TODO
    }

    # Urgences récentes
    urgences_recentes = Urgence.objects.all().order_by('-date_creation')[:10]

    return Response({
        'statistics': stats,
        'urgences_recentes': UrgenceSerializer(urgences_recentes, many=True).data
    })


# ========== EXPORT DONNÉES RGPD ==========

import json
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_mes_donnees(request):
    """Exporter toutes les données de l'utilisateur (RGPD)"""
    user = request.user

    # Collecter toutes les données
    data = {
        'utilisateur': {
            'username': user.username,
            'email': user.email,
            'prenom': user.first_name,
            'nom': user.last_name,
            'role': user.role,
            'date_inscription': user.date_joined.isoformat(),
        }
    }

    # Si patient
    if user.role == 'patient':
        try:
            patient = Patient.objects.get(user=user)
            data['patient'] = {
                'adresse': patient.adresse,
            }

            # Rendez-vous
            rendez_vous = RendezVous.objects.filter(patient=patient)
            data['rendez_vous'] = list(rendez_vous.values())

            # Consultations
            consultations = Consultation.objects.filter(patient=patient)
            data['consultations'] = list(consultations.values())

        except Patient.DoesNotExist:
            pass

    # LOG D'AUDIT
    log_action(
        user=user,
        action='export',
        model_name='UserData',
        details={'export_type': 'full'},
        request=request
    )

    # Créer le fichier JSON
    response = HttpResponse(
        json.dumps(data, indent=2, ensure_ascii=False, default=str),
        content_type='application/json'
    )
    response['Content-Disposition'] = f'attachment; filename="mes_donnees_assistosante.json"'

    return response


# -------------------- Search Functionality --------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    """Global search across doctors, patients, articles, and appointments"""
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({
            'doctors': [],
            'patients': [],
            'articles': [],
            'appointments': []
        })
    
    # Search doctors
    doctors = Medecin.objects.filter(
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query) |
        Q(specialite__icontains=query)
    )[:10]
    
    doctors_data = []
    for doctor in doctors:
        doctors_data.append({
            'id': doctor.id,
            'name': f"Dr. {doctor.user.first_name} {doctor.user.last_name}",
            'specialty': doctor.specialite,
            'rating': 4.5  # In a real implementation, this would be calculated from ratings
        })
    
    # Search patients (only for authenticated users with proper permissions)
    patients_data = []
    if request.user.is_authenticated and request.user.role in ['medecin', 'admin']:
        patients = Patient.objects.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query)
        )[:10]
        
        for patient in patients:
            patients_data.append({
                'id': patient.id,
                'name': f"{patient.user.first_name} {patient.user.last_name}",
                'age': 30,  # In a real implementation, this would be calculated
                'lastVisit': '2023-10-15'  # In a real implementation, this would be from actual data
            })
    
    # Search articles
    articles = Article.objects.filter(
        Q(titre__icontains=query) |
        Q(contenu__icontains=query) |
        Q(resume__icontains=query) |
        Q(tags__icontains=query)
    ).filter(statut='valide')[:10]
    
    articles_data = []
    for article in articles:
        articles_data.append({
            'id': article.id,
            'title': article.titre,
            'excerpt': article.resume,
            'author': f"Dr. {article.auteur.user.first_name} {article.auteur.user.last_name}",
            'date': article.date_publication.strftime('%Y-%m-%d') if article.date_publication else '',
            'views': article.vues
        })
    
    # Search appointments (only for authenticated users)
    appointments_data = []
    if request.user.is_authenticated:
        appointments = RendezVous.objects.filter(
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(medecin__first_name__icontains=query) |
            Q(medecin__last_name__icontains=query)
        )
        
        # Filter by user role
        if request.user.role == 'patient':
            appointments = appointments.filter(patient=request.user)
        elif request.user.role == 'medecin':
            appointments = appointments.filter(medecin=request.user)
        # Admin can see all appointments
        
        appointments = appointments[:10]
        
        for appointment in appointments:
            appointments_data.append({
                'id': appointment.id,
                'patient': f"{appointment.patient.first_name} {appointment.patient.last_name}",
                'doctor': f"Dr. {appointment.medecin.first_name} {appointment.medecin.last_name}",
                'specialty': getattr(appointment.medecin, 'specialite', '') if hasattr(appointment.medecin, 'medecin') else '',
                'date': appointment.date.strftime('%Y-%m-%d') if appointment.date else '',
                'time': appointment.heure.strftime('%H:%M') if appointment.heure else '',
                'status': appointment.get_statut_display()
            })
    
    return Response({
        'doctors': doctors_data,
        'patients': patients_data,
        'articles': articles_data,
        'appointments': appointments_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def nearby_health_facilities(request):
    """Liste des centres de santé à proximité d'une position donnée"""
    try:
        lat = float(request.GET.get('lat', 14.6937))
        lng = float(request.GET.get('lng', -17.444))
        radius = float(request.GET.get('radius', 10))  # Rayon en km, par défaut 10km
    except ValueError:
        return Response({'error': 'Paramètres de localisation invalides'}, status=400)
    
    # Fonction pour calculer la distance entre deux points (formule de Haversine)
    def calculate_distance(lat1, lon1, lat2, lon2):
        from math import radians, cos, sin, asin, sqrt
        # Convertir les degrés en radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Formule de Haversine
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Rayon de la Terre en km
        return c * r
    
    # Récupérer tous les centres de santé
    facilities = []
    
    # Récupérer les hôpitaux
    hopitaux = Hopital.objects.all()
    for hopital in hopitaux:
        if hopital.latitude and hopital.longitude:
            distance = calculate_distance(lat, lng, float(hopital.latitude), float(hopital.longitude))
            if distance <= radius:
                facilities.append({
                    'id': f'hopital_{hopital.id}',
                    'nom': hopital.nom,
                    'type': 'hopital',
                    'adresse': getattr(hopital, 'adresse', ''),
                    'latitude': float(hopital.latitude),
                    'longitude': float(hopital.longitude),
                    'telephone': getattr(hopital, 'telephone', ''),
                    'horaires': getattr(hopital, 'horaires', ''),
                    'distance': round(distance, 2)
                })

    # Récupérer les cliniques
    cliniques = Clinique.objects.all()
    for clinique in cliniques:
        if clinique.latitude and clinique.longitude:
            distance = calculate_distance(lat, lng, float(clinique.latitude), float(clinique.longitude))
            if distance <= radius:
                facilities.append({
                    'id': f'clinique_{clinique.id}',
                    'nom': clinique.nom,
                    'type': 'clinique',
                    'adresse': getattr(clinique, 'adresse', ''),
                    'latitude': float(clinique.latitude),
                    'longitude': float(clinique.longitude),
                    'telephone': getattr(clinique, 'telephone', ''),
                    'horaires': getattr(clinique, 'horaires', ''),
                    'distance': round(distance, 2)
                })

    # Récupérer les pharmacies
    pharmacies = Pharmacie.objects.all()
    for pharmacie in pharmacies:
        if pharmacie.latitude and pharmacie.longitude:
            distance = calculate_distance(lat, lng, float(pharmacie.latitude), float(pharmacie.longitude))
            if distance <= radius:
                facilities.append({
                    'id': f'pharmacie_{pharmacie.id}',
                    'nom': pharmacie.nom,
                    'type': 'pharmacie',
                    'adresse': getattr(pharmacie, 'adresse', ''),
                    'latitude': float(pharmacie.latitude),
                    'longitude': float(pharmacie.longitude),
                    'telephone': getattr(pharmacie, 'telephone', ''),
                    'horaires': getattr(pharmacie, 'horaires', ''),
                    'distance': round(distance, 2)
                })

    # Récupérer les dentistes
    dentistes = Dentiste.objects.all()
    for dentiste in dentistes:
        if dentiste.latitude and dentiste.longitude:
            distance = calculate_distance(lat, lng, float(dentiste.latitude), float(dentiste.longitude))
            if distance <= radius:
                facilities.append({
                    'id': f'dentiste_{dentiste.id}',
                    'nom': dentiste.nom,
                    'type': 'dentiste',
                    'adresse': getattr(dentiste, 'adresse', ''),
                    'latitude': float(dentiste.latitude),
                    'longitude': float(dentiste.longitude),
                    'telephone': getattr(dentiste, 'telephone', ''),
                    'horaires': getattr(dentiste, 'horaires', ''),
                    'distance': round(distance, 2)
                })

    return Response(facilities)



@csrf_exempt
def chatbot(request):
    """
    Vue permettant de communiquer avec le serveur Rasa.
    Aucune authentification nécessaire pour tester le chatbot.
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "").strip()

            if not user_message:
                return JsonResponse({"responses": [{"text": "Message vide reçu."}]})

            payload = {"sender": "user", "message": user_message}

            try:
                rasa_response = requests.post(RASA_URL, json=payload, timeout=5)
                rasa_response.raise_for_status()
                responses = rasa_response.json()
            except requests.exceptions.RequestException:
                responses = [{"text": "Erreur : le serveur Rasa est injoignable."}]

            return JsonResponse({"responses": responses})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Format JSON invalide."}, status=400)

    return JsonResponse({"error": "Méthode non autorisée."}, status=405)



# L’URL du serveur Rasa
RASA_URL = "http://127.0.0.1:5005/webhooks/rest/webhook"


# une API pour terminer une téléconsultation
@api_view(['POST'])
def terminer_teleconsultation(request, rendezvous_id):
    try:
        teleconsult = Teleconsultation.objects.get(rendezvous_id=rendezvous_id)
        teleconsult.statut = "TERMINE"
        teleconsult.save()
        return Response({"message": "Téléconsultation terminée"})
    except Teleconsultation.DoesNotExist:
        return Response({"error": "Téléconsultation non trouvée"}, status=404)


# endpoint pour que l'administrateur puissent consulter les cteleconsultations
@api_view(['GET'])
@permission_classes([IsAdminUser])
def liste_teleconsultations(request):
    # Retourner toutes les téléconsultations avec infos
    teleconsults = Teleconsultation.objects.all().values(
        "id", "rendezvous__patient__username", "rendezvous__medecin__username",
        "channel_name", "statut", "date_creation", "duree_minutes"
    )
    return Response(list(teleconsults))

@api_view(['GET'])
@permission_classes([IsAdminUser])
def teleconsultation_detail(request, teleconsult_id):
    try:
        teleconsult = Teleconsultation.objects.get(id=teleconsult_id)
        data = {
            "id": teleconsult.id,
            "patient": teleconsult.rendezvous.patient.username,
            "medecin": teleconsult.rendezvous.medecin.username,
            "channel_name": teleconsult.channel_name,
            "statut": teleconsult.statut,
            "date_creation": teleconsult.date_creation,
            "duree_minutes": teleconsult.duree_minutes
        }
        return Response(data)
    except Teleconsultation.DoesNotExist:
        return Response({"error": "Téléconsultation non trouvée"}, status=404)
    

 

from django.http import JsonResponse
from .zoom_utils import get_zoom_access_token, create_zoom_meeting
import requests


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_zoom_meeting_for_rdv(request, rdv_id):
    """
    Crée une réunion Zoom pour un rendez-vous donné et met à jour le RDV
    avec les informations de la réunion (start_url, join_url, meeting_id, password).
    """
    # Récupération du rendez-vous
    rdv = get_object_or_404(RendezVous, numero=rdv_id)

    try:
        # Création de la réunion Zoom
        meeting_data = create_zoom_meeting(rdv)

        # Vérifier si une erreur a été renvoyée par create_zoom_meeting
        if "error" in meeting_data:
            return Response({
                "error": meeting_data["error"]
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour le RDV avec les infos Zoom
        rdv.zoom_start_url = meeting_data.get("start_url")
        rdv.zoom_join_url = meeting_data.get("join_url")
        rdv.zoom_meeting_id = meeting_data.get("id") or meeting_data.get("meeting_id")
        rdv.zoom_password = meeting_data.get("password")
        rdv.save()

        return Response({
            "message": "Réunion Zoom créée avec succès",
            "meeting": meeting_data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # Retourner l'erreur exacte pour faciliter le débogage
        return Response({
            "error": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)





def confirmer_rendez_vous(rdv_id):
    rdv = RendezVous.objects.get(id=rdv_id)
    rdv.statut = 'CONFIRMED'
    
    if rdv.type_consultation == 'teleconsultation':
        meeting_data = create_zoom_meeting_for_rdv(rdv)
        rdv.zoom_start_url = meeting_data['start_url']
        rdv.zoom_join_url = meeting_data['join_url']
    
    rdv.save()



# Concernant la consultation

@action(detail=True, methods=['post'])
def save_notes(self, request, pk=None):
    consultation = self.get_object()
    notes = request.data.get("notes", "")

    consultation.set_notes_securisees(notes)
    consultation.save()

    return Response({"message": "Notes enregistrées"})


@action(detail=True, methods=['post'])
def save_diagnostic(self, request, pk=None):
    consultation = self.get_object()
    diagnostic = request.data.get("diagnostic", "")

    consultation.set_diagnostic_securise(diagnostic)
    consultation.save()

    return Response({"message": "Diagnostic enregistré"})



@action(detail=True, methods=['post'])
def add_traitement(self, request, pk=None):
    consultation = self.get_object()
    serializer = TraitementSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(consultation=consultation)
    return Response(serializer.data, status=201)


@action(detail=True, methods=['post'])
def add_mesure(self, request, pk=None):
    consultation = self.get_object()
    data = request.data.copy()
    data["consultation"] = consultation.id

    serializer = MesureSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data, status=201)


# Envoie de mail Pour a consultation a un patient
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def envoyer_consultation_patient(request):
    try:
        patient_email = request.data.get("email")
        consultation = request.data.get("consultation")

        if not patient_email:
            return Response({"error": "Email du patient manquant"}, status=400)

        # Template HTML du mail
        html_content = render_to_string("consultation_email.html", {
            "consultation": consultation
        })

        email = EmailMessage(
            subject="Votre compte-rendu de consultation",
            body=html_content,
            from_email="ndoumbistandeyendoumbe@gmail.com",
            to=[patient_email],
        )
        email.content_subtype = "html"  
        email.send()

        return Response({"message": "Consultation envoyée au patient ✅"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

# Parametrage du chatbot
from rest_framework.permissions import IsAuthenticatedOrReadOnly

@api_view(["GET", "PUT"])
def chatbot_config(request):
    # ✅ Toujours récupérer ou créer la config
    config = ChatbotConfig.get_config()

    # ✅ GET autorisé pour tous les utilisateurs connectés
    if request.method == "GET":
        serializer = ChatbotConfigSerializer(config)
        return Response(serializer.data, status=200)

    # ✅ PUT réservé aux admins
    if request.method == "PUT":
        if not request.user.is_staff:
            return Response({"error": "Permission refusée"}, status=403)

        serializer = ChatbotConfigSerializer(
            config, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data, status=200)

        return Response(serializer.errors, status=400)
    

