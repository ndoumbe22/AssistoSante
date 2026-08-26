from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.utils import timezone
# Importer les fonctions de chiffrement
from .encryption import encrypt_field, decrypt_field

class User(AbstractUser):
    ROLES = (
        ('admin', 'Administrateur'),
        ('medecin', 'Médecin'),
        ('patient', 'Patient'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default="patient")
    telephone = models.CharField(max_length=20, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    
    def get_full_name(self):
        """Return the full name of the user."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    class Meta :
        db_table = 'utilisateur'

# -------------------- Patient --------------------
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    adresse = models.TextField()

    class Meta :
        db_table = 'Patient'


    def __str__(self):
        return f"Patient: {self.user.first_name} {self.user.last_name}"

# -------------------- Médecin --------------------
class Medecin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='medecin')
    disponibilite = models.BooleanField(default=True)

    specialite = models.CharField(max_length=100)

    class Meta :
        db_table = 'Medecin'

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name} ({self.specialite})"


# -------------------- Disponibilité Médecin --------------------
class DisponibiliteMedecin(models.Model):
    JOURS_SEMAINE = [
        ('lundi', 'Lundi'),
        ('mardi', 'Mardi'),
        ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'),
        ('vendredi', 'Vendredi'),
        ('samedi', 'Samedi'),
        ('dimanche', 'Dimanche'),
    ]
    
    medecin = models.ForeignKey('Medecin', on_delete=models.CASCADE, related_name='disponibilites')
    jour = models.CharField(max_length=20, choices=JOURS_SEMAINE)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    duree_consultation = models.IntegerField(default=30, help_text="Durée en minutes")
    pause_dejeuner_debut = models.TimeField(null=True, blank=True)
    pause_dejeuner_fin = models.TimeField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['medecin', 'jour']
    
    def __str__(self):
        return f"{self.medecin} - {self.get_jour_display()} ({self.heure_debut}-{self.heure_fin})"
    
    def generate_time_slots(self, date):
        """
        Génère tous les créneaux disponibles pour une date donnée
        """
        from django.utils import timezone
        from datetime import datetime, timedelta
        import calendar
        
        # Vérifier que la date correspond au jour de la semaine de cette disponibilité
        day_names_fr = {
            'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3,
            'vendredi': 4, 'samedi': 5, 'dimanche': 6
        }
        
        if date.weekday() != day_names_fr[self.jour]:
            return []
        
        # Générer les créneaux
        slots = []
        current_time = datetime.combine(date, self.heure_debut)
        end_time = datetime.combine(date, self.heure_fin)
        slot_duration = timedelta(minutes=self.duree_consultation)
        
        while current_time + slot_duration <= end_time:
            slot_time = current_time.time()
            
            # Vérifier si ce créneau est pendant la pause déjeuner
            if (self.pause_dejeuner_debut and self.pause_dejeuner_fin and
                self.pause_dejeuner_debut <= slot_time < self.pause_dejeuner_fin):
                current_time += slot_duration
                continue
            
            # Vérifier si ce créneau est dans le passé
            slot_datetime = timezone.make_aware(datetime.combine(date, slot_time))
            if slot_datetime < timezone.now():
                current_time += slot_duration
                continue
            
            slots.append(slot_time)
            current_time += slot_duration
        
        return slots
    
    def is_available_at(self, datetime_check):
        """
        Vérifie si le médecin travaille à cette date/heure
        """
        from datetime import time
        
        # Vérifier que le jour correspond
        day_names_fr = {
            0: 'lundi', 1: 'mardi', 2: 'mercredi', 3: 'jeudi',
            4: 'vendredi', 5: 'samedi', 6: 'dimanche'
        }
        
        if self.jour != day_names_fr[datetime_check.weekday()]:
            return False
        
        # Vérifier l'heure
        check_time = datetime_check.time()
        if not (self.heure_debut <= check_time <= self.heure_fin):
            return False
        
        # Vérifier la pause déjeuner
        if (self.pause_dejeuner_debut and self.pause_dejeuner_fin and
            self.pause_dejeuner_debut <= check_time < self.pause_dejeuner_fin):
            return False
        
        return True
    
    def get_next_available_slot(self, start_date=None):
        """
        Retourne le prochain créneau libre
        """
        from django.utils import timezone
        from datetime import timedelta
        import calendar
        
        if not start_date:
            start_date = timezone.now().date()
        
        # Trouver le prochain jour correspondant à ce jour de la semaine
        day_names_fr = {
            'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3,
            'vendredi': 4, 'samedi': 5, 'dimanche': 6
        }
        
        target_weekday = day_names_fr[self.jour]
        days_ahead = target_weekday - start_date.weekday()
        
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        
        next_date = start_date + timedelta(days=days_ahead)
        
        # Générer les créneaux pour cette date
        slots = self.generate_time_slots(next_date)
        
        if slots:
            # Retourner le premier créneau disponible
            return datetime.combine(next_date, slots[0])
        
        return None
    
    def clean(self):
        """
        Validation des données de la disponibilité
        """
        from django.core.exceptions import ValidationError
        from django.utils import timezone
        
        # Vérifier que l'heure de fin est > heure de début
        if self.heure_fin <= self.heure_debut:
            raise ValidationError("L'heure de fin doit être supérieure à l'heure de début")
        
        # Vérifier la durée de consultation
        if self.duree_consultation < 15 or self.duree_consultation > 120:
            raise ValidationError("La durée de consultation doit être entre 15 et 120 minutes")
        
        # Vérifier la pause déjeuner
        if (self.pause_dejeuner_debut and self.pause_dejeuner_fin):
            if self.pause_dejeuner_fin <= self.pause_dejeuner_debut:
                raise ValidationError("L'heure de fin de pause doit être supérieure à l'heure de début de pause")
            if (self.pause_dejeuner_debut < self.heure_debut or 
                self.pause_dejeuner_fin > self.heure_fin):
                raise ValidationError("La pause déjeuner doit être comprise entre l'heure de début et l'heure de fin")
        
        # Vérifier les chevauchements avec d'autres disponibilités
        if self.medecin and self.jour:
            overlapping_dispos = DisponibiliteMedecin.objects.filter(
                medecin=self.medecin,
                jour=self.jour
            )
            if self.pk:
                overlapping_dispos = overlapping_dispos.exclude(pk=self.pk)
            
            for disp in overlapping_dispos:
                if (disp.heure_debut < self.heure_fin and disp.heure_fin > self.heure_debut):
                    raise ValidationError(
                        f"Chevauchement avec une disponibilité existante : {disp.heure_debut} - {disp.heure_fin}"
                    )
    
    def save(self, *args, **kwargs):
        """
        Sauvegarde avec validation
        """
        self.clean()
        super().save(*args, **kwargs)


class IndisponibiliteMedecin(models.Model):
    TYPE_CHOICES = [
        ('conges', 'Congés'),
        ('formation', 'Formation'),
        ('maladie', 'Maladie'),
        ('autre', 'Autre'),
    ]
    
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='indisponibilites')
    date_debut = models.DateField()
    date_fin = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='autre')
    raison = models.CharField(max_length=200, blank=True)
    toute_la_journee = models.BooleanField(default=True)
    heure_debut = models.TimeField(null=True, blank=True)
    heure_fin = models.TimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'IndisponibiliteMedecin'
        verbose_name = 'Indisponibilité Médecin'
        verbose_name_plural = 'Indisponibilités Médecins'
    
    def __str__(self):
        if self.toute_la_journee:
            return f"{self.medecin} - Indisponible du {self.date_debut} au {self.date_fin}"
        else:
            return f"{self.medecin} - Indisponible le {self.date_debut} de {self.heure_debut} à {self.heure_fin}"
    
    def clean(self):
        """
        Validation des données de l'indisponibilité
        """
        from django.core.exceptions import ValidationError
        from django.utils import timezone
        
        # Vérifier que la date de fin est >= date de début
        if self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être supérieure ou égale à la date de début")
        
        # Vérifier que l'indisponibilité n'est pas dans le passé
        if self.date_fin < timezone.now().date():
            raise ValidationError("Impossible de créer une indisponibilité dans le passé")
        
        # Vérifier les heures si ce n'est pas toute la journée
        if not self.toute_la_journee:
            if not self.heure_debut or not self.heure_fin:
                raise ValidationError("Les heures de début et de fin sont requises si ce n'est pas toute la journée")
            if self.heure_fin <= self.heure_debut:
                raise ValidationError("L'heure de fin doit être supérieure à l'heure de début")
        
        # Vérifier les chevauchements avec d'autres indisponibilités
        if self.medecin:
            overlapping_indispos = IndisponibiliteMedecin.objects.filter(
                medecin=self.medecin
            )
            if self.pk:
                overlapping_indispos = overlapping_indispos.exclude(pk=self.pk)
            
            for indisp in overlapping_indispos:
                if (indisp.date_debut <= self.date_fin and indisp.date_fin >= self.date_debut):
                    raise ValidationError(
                        f"Chevauchement avec une indisponibilité existante : {indisp.date_debut} - {indisp.date_fin}"
                    )
    
    def save(self, *args, **kwargs):
        """
        Sauvegarde avec validation
        """
        self.clean()
        super().save(*args, **kwargs)

# -------------------- Consultation --------------------
class Consultation(models.Model):
    numero = models.AutoField(primary_key=True)
    date = models.DateField()
    heure = models.TimeField()
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="consultations")
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name="consultations")
    rendez_vous = models.OneToOneField('RendezVous', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status for online consultations
    STATUT_CHOICES = [
        ('programmee', 'Programmée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='programmee')
    
    # Ajouter des champs pour les données chiffrées
    notes_chiffrees = models.TextField(blank=True, verbose_name="Notes chiffrées")
    diagnostic_chiffre = models.TextField(blank=True, verbose_name="Diagnostic chiffré")

    def set_notes_securisees(self, notes):
        """Définir des notes avec chiffrement"""
        self.notes_chiffrees = encrypt_field(notes)

    def get_notes_securisees(self):
        """Récupérer les notes déchiffrées"""
        return decrypt_field(self.notes_chiffrees)

    def set_diagnostic_securise(self, diagnostic):
        """Définir un diagnostic avec chiffrement"""
        self.diagnostic_chiffre = encrypt_field(diagnostic)

    def get_diagnostic_securise(self):
        """Récupérer le diagnostic déchiffré"""
        return decrypt_field(self.diagnostic_chiffre)

    def save(self, *args, **kwargs):
        # Check if status is changing
        old_statut = None
        if self.numero:  # If this is an update, not a new object
            try:
                old_instance = Consultation.objects.get(numero=self.numero)
                old_statut = old_instance.statut
            except Consultation.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # If status changed and there's an associated RDV, update it
        if old_statut and old_statut != self.statut and self.rendez_vous:
            self.update_associated_rdv()

    def update_associated_rdv(self):
        """Update the associated RDV based on consultation status"""
        try:
            rendez_vous = self.rendez_vous
            
            # Update RDV status based on consultation status
            if self.statut == 'annulee':
                rendez_vous.statut = "CANCELLED"
            elif self.statut == 'terminee':
                rendez_vous.statut = "TERMINE"
            elif self.statut == 'en_cours':
                rendez_vous.statut = "CONFIRMED"  # Or you might want a new "IN_PROGRESS" status
            elif self.statut == 'programmee':
                # Only update to CONFIRMED if it's not already cancelled or completed
                if rendez_vous.statut not in ["CANCELLED", "TERMINE"]:
                    rendez_vous.statut = "CONFIRMED"
            
            rendez_vous.save()
        except RendezVous.DoesNotExist:
            # No associated RDV, nothing to update
            pass

    def __str__(self):
        return f"Consultation {self.numero} - {self.patient}"
    
    class Meta :
        db_table = 'Consultation'


# -------------------- Rendez-vous --------------------
class RendezVous(models.Model):
    numero = models.AutoField(primary_key=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rdv_patient")
    medecin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rdv_medecin")
    date = models.DateField()
    heure = models.TimeField()
    description = models.TextField(blank=True, null=True)
    motif_consultation = models.TextField(blank=True, null=True, help_text="Motif de la consultation")
    zoom_start_url = models.CharField(max_length=500, blank=True, null=True)
    zoom_join_url  = models.CharField(max_length=500, blank=True, null=True)
    zoom_meeting_id = models.CharField(max_length=50, blank=True, null=True)
    zoom_password = models.CharField(max_length=50, blank=True, null=True)

    # Add consultation type field
    TYPE_CONSULTATION_CHOICES = [
        ("cabinet", "Consultation au cabinet"),
        ("teleconsultation", "Téléconsultation en ligne"),
    ]
    type_consultation = models.CharField(max_length=20, choices=TYPE_CONSULTATION_CHOICES, default="cabinet")

    STATUT_CHOICES = [
        ("CONFIRMED", "Confirmé"),
        ("CANCELLED", "Annulé"),
        ("RESCHEDULED", "Reprogrammé"),
        ("PENDING", "En attente"),
        ("TERMINE", "Terminé"),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="PENDING")
    
    # Track rescheduling history
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    # Original appointment details for rescheduling tracking
    original_date = models.DateField(null=True, blank=True)
    original_heure = models.TimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # If this is the first time saving and it's being rescheduled, store original details
        if self.statut == "RESCHEDULED" and not self.original_date and self.numero:
            # Get the original appointment details
            original = RendezVous.objects.get(numero=self.numero)
            if not self.original_date:
                self.original_date = original.date
                self.original_heure = original.heure
        
        # Check if status is changing
        old_statut = None
        if self.numero:  # If this is an update, not a new object
            try:
                old_instance = RendezVous.objects.get(numero=self.numero)
                old_statut = old_instance.statut
            except RendezVous.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # If status changed, update associated teleconsultation if it exists
        if old_statut and old_statut != self.statut:
            self.update_associated_teleconsultation()

    def update_associated_teleconsultation(self):
        """Update the associated teleconsultation based on RDV status"""
        try:
            # Get the associated consultation through the rendez_vous foreign key
            consultation = Consultation.objects.get(rendez_vous=self)
            teleconsultation = Teleconsultation.objects.get(consultation=consultation)
            
            # Update teleconsultation status based on RDV status
            if self.statut == "CANCELLED":
                consultation.statut = 'annulee'
                teleconsultation.ended_at = timezone.now()  # End the teleconsultation
            elif self.statut == "TERMINE":
                consultation.statut = 'terminee'
                teleconsultation.ended_at = timezone.now()  # End the teleconsultation
            elif self.statut == "CONFIRMED":
                consultation.statut = 'programmee'
            
            consultation.save()
            teleconsultation.save()
        except (Consultation.DoesNotExist, Teleconsultation.DoesNotExist):
            # No associated consultation or teleconsultation, nothing to update
            pass

    def __str__(self):
        return f"{self.patient.username} - {self.date} {self.heure}"
    
    class Meta :
        db_table = 'RendezVous'


# -------------------- Pathologie --------------------
class Pathologie(models.Model):
    nom = models.CharField(max_length=150)
    description = models.TextField()
    disponibilite = models.BooleanField(default=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    patients = models.ManyToManyField(Patient, related_name="pathologies")
    medecins = models.ManyToManyField(Medecin, related_name="pathologies")

    def __str__(self):
        return self.nom
    
    class Meta :
        db_table = 'Pathologie'


# -------------------- Médicaments & Traitements --------------------
class Medicament(models.Model):
    nom = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)

    def __str__(self):
        return self.nom
    
    class Meta :
        db_table = 'Medicament'


class Traitement(models.Model):
    id_traitement = models.AutoField(primary_key=True)
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name="traitements")
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE, related_name="traitements")
    posologie = models.TextField()

    def __str__(self):
        return f"Traitement {self.id_traitement} - {self.medicament.nom}"
    
    class Meta :
        db_table = 'Traitement'


# -------------------- Constantes & Mesures --------------------
class Constante(models.Model):
    nom_constante = models.CharField(max_length=100)

    def __str__(self):
        return self.nom_constante
    
    class Meta :
        db_table = 'Constante'
    


class Mesure(models.Model):
    id_mesure = models.AutoField(primary_key=True)
    valeur = models.FloatField()
    unite = models.CharField(max_length=20)
    constante = models.ForeignKey(Constante, on_delete=models.CASCADE, related_name="mesures")

# -------------------- Teleconsultation --------------------
class Teleconsultation(models.Model):
    id = models.AutoField(primary_key=True)
    consultation = models.OneToOneField(Consultation, on_delete=models.CASCADE, related_name="teleconsultation")
    channel_name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Check if this is an update (not a new object) and if ended_at is being set
        old_ended_at = None
        if self.id:  # If this is an update, not a new object
            try:
                old_instance = Teleconsultation.objects.get(id=self.id)
                old_ended_at = old_instance.ended_at
            except Teleconsultation.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # If ended_at was just set, update associated consultation and RDV
        if self.ended_at and (not old_ended_at or old_ended_at != self.ended_at):
            self.update_associated_entities()

    def update_associated_entities(self):
        """Update the associated consultation and RDV when teleconsultation ends"""
        try:
            # Update consultation status
            self.consultation.statut = 'terminee'
            self.consultation.save()
            
            # Update RDV status if it exists
            if self.consultation.rendez_vous:
                self.consultation.rendez_vous.statut = "TERMINE"
                self.consultation.rendez_vous.save()
        except Exception as e:
            # Log the error but don't fail the save operation
            print(f"Error updating associated entities: {e}")

    def __str__(self):
        return f"Teleconsultation {self.id} for Consultation {self.consultation.numero}"
    
    class Meta:
        db_table = 'Teleconsultation'

# -------------------- Articles --------------------
class Article(models.Model):
    """Articles de santé rédigés par les médecins"""
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
        ('desactive', 'Désactivé'),
    ]

    CATEGORIE_CHOICES = [
        ('prevention', 'Prévention'),
        ('nutrition', 'Nutrition'),
        ('maladies', 'Maladies'),
        ('bien_etre', 'Bien-être'),
        ('grossesse', 'Grossesse'),
        ('pediatrie', 'Pédiatrie'),
        ('geriatrie', 'Gériatrie'),
        ('autre', 'Autre'),
    ]

    # Contenu
    titre = models.CharField(max_length=200, verbose_name="Titre")
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    contenu = models.TextField(verbose_name="Contenu")
    resume = models.TextField(max_length=500, verbose_name="Résumé")
    image = models.ImageField(upload_to='articles/', blank=True, null=True)

    # Relations
    auteur = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='articles')
    categorie = models.CharField(max_length=50, choices=CATEGORIE_CHOICES, default='autre')
    tags = models.CharField(max_length=200, blank=True)

    # Modération
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles_valides')
    date_validation = models.DateTimeField(null=True, blank=True)
    commentaire_moderation = models.TextField(blank=True)

    # Métadonnées
    date_publication = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    vues = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date_publication']
        verbose_name = "Article de Santé"
        verbose_name_plural = "Articles de Santé"
        db_table = 'Article'

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre)
            # S'assurer que le slug est unique
            original_slug = self.slug
            counter = 1
            while Article.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    def incrementer_vues(self):
        self.vues += 1
        self.save(update_fields=['vues'])

# -------------------- Structures & Services --------------------
class StructureDeSante(models.Model):
    nom = models.CharField(max_length=150)
    adresse = models.TextField()

    def __str__(self):
        return self.nom
    
    class Meta :
        db_table = 'StructureDeSante'


class Service(models.Model):
    id_service = models.AutoField(primary_key=True)
    nom_service = models.CharField(max_length=100)
    description = models.TextField()
    responsable = models.CharField(max_length=100)
    structure = models.ForeignKey(StructureDeSante, on_delete=models.CASCADE, related_name="services")

    def __str__(self):
        return self.nom_service
    
    class Meta :
        db_table = 'Service'


# Le formulaire dans le footer
class MessageContact(models.Model):
    nom = models.CharField(max_length=150)
    email = models.EmailField()
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} - {self.sujet}"
    

class Hopital(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    site_web = models.URLField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.nom


class Clinique(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.nom


class Dentiste(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    cabinet = models.CharField(max_length=150, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.nom


class Pharmacie(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ouvert_24h = models.BooleanField(default=False)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.nom


class ContactFooter(models.Model):
    nom = models.CharField(max_length=150)
    email = models.EmailField()
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} - {self.sujet}"


class ChatbotConversation(models.Model):
    """Historique des conversations avec le chatbot"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='conversations')
    message_user = models.TextField(verbose_name="Message utilisateur")
    message_bot = models.TextField(verbose_name="Réponse chatbot")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Date/Heure")
    sentiment = models.CharField(max_length=20, blank=True, null=True, verbose_name="Sentiment")

    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Chat avec {self.patient.user.username} - {self.timestamp}"


class RappelMedicament(models.Model):
    """Rappels de prise de médicaments"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='rappels_medicaments')
    medicament = models.CharField(max_length=100, verbose_name="Nom du médicament")
    dosage = models.CharField(max_length=50, verbose_name="Dosage")
    frequence = models.CharField(max_length=50, verbose_name="Fréquence")
    heure_rappel = models.TimeField(verbose_name="Heure du rappel")
    date_debut = models.DateField(verbose_name="Date de début")
    date_fin = models.DateField(verbose_name="Date de fin", null=True, blank=True)
    actif = models.BooleanField(default=True, verbose_name="Rappel actif")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes supplémentaires")

    class Meta:
        verbose_name = "Rappel médicament"
        verbose_name_plural = "Rappels médicaments"
        ordering = ['heure_rappel']
        
    def __str__(self):
        return f"{self.medicament} - {self.patient.user.username}"


class HistoriquePriseMedicament(models.Model):
    """Historique de prise des médicaments"""
    rappel = models.ForeignKey(RappelMedicament, on_delete=models.CASCADE, related_name='historique_prises')
    date_prise = models.DateTimeField(auto_now_add=True, verbose_name="Date de prise")
    prise_effectuee = models.BooleanField(default=False, verbose_name="Prise effectuée")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")

    class Meta:
        verbose_name = "Historique prise médicament"
        verbose_name_plural = "Historiques prises médicaments"
        ordering = ['-date_prise']
        
    def __str__(self):
        return f"{self.rappel.medicament} - {self.date_prise.strftime('%d/%m/%Y %H:%M')}"

# -------------------- Audit Logs --------------------
class AuditLog(models.Model):
    """Journal d'audit des actions sensibles"""
    ACTION_CHOICES = [
        ('create', 'Création'),
        ('read', 'Lecture'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
        ('export', 'Export de données'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Log d'Audit"
        verbose_name_plural = "Logs d'Audit"
        db_table = 'AuditLog'

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"


def log_action(user, action, model_name, object_id=None, details=None, request=None):
    """Helper pour créer un log d'audit"""
    ip_address = None
    user_agent = ''

    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:300]

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent
    )

# -------------------- Urgences --------------------
class Urgence(models.Model):
    """Signalements d'urgences médicales"""
    PRIORITE_CHOICES = [
        ('faible', 'Faible'),
        ('moyenne', 'Moyenne'),
        ('elevee', 'Élevée'),
        ('critique', 'Critique'),
    ]

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('prise_en_charge', 'Prise en charge'),
        ('resolue', 'Résolue'),
        ('annulee', 'Annulée'),
    ]

    # Patient
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='urgences')

    # Description
    type_urgence = models.CharField(max_length=100, verbose_name="Type d'urgence")
    description = models.TextField(verbose_name="Description détaillée")
    symptomes = models.TextField(verbose_name="Symptômes")

    # Localisation
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    adresse = models.CharField(max_length=300, blank=True)

    # Priorisation
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='moyenne')
    priorite_automatique = models.CharField(max_length=20, choices=PRIORITE_CHOICES, blank=True)
    score_urgence = models.IntegerField(default=0, help_text="Score calculé automatiquement")

    # Statut et prise en charge
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    medecin_charge = models.ForeignKey(Medecin, on_delete=models.SET_NULL, null=True, blank=True, related_name='urgences_prises_en_charge')
    date_prise_en_charge = models.DateTimeField(null=True, blank=True)

    # Contact
    telephone_contact = models.CharField(max_length=20, verbose_name="Téléphone de contact")
    personne_contact = models.CharField(max_length=100, blank=True, verbose_name="Nom de la personne à contacter")

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    notes_medecin = models.TextField(blank=True, verbose_name="Notes du médecin")

    class Meta:
        ordering = ['-priorite', '-date_creation']
        verbose_name = "Urgence"
        verbose_name_plural = "Urgences"
        db_table = 'Urgence'

    def __str__(self):
        return f"Urgence {self.type_urgence} - {self.patient.user.username} ({self.priorite})"

    def calculer_score_urgence(self):
        """Calculer automatiquement le score d'urgence basé sur les mots-clés"""
        score = 0
        mots_cles_critiques = [
            'infarctus', 'avc', 'hémorragie', 'accident', 'inconscient',
            'difficulté respirer', 'douleur poitrine', 'paralysie'
        ]
        mots_cles_elevees = [
            'fièvre élevée', 'vomissements', 'diarrhée', 'douleur intense',
            'saignement', 'chute', 'brûlure'
        ]

        description_lower = (self.description + ' ' + self.symptomes).lower()

        for mot in mots_cles_critiques:
            if mot in description_lower:
                score += 10

        for mot in mots_cles_elevees:
            if mot in description_lower:
                score += 5

        self.score_urgence = score

        # Déterminer la priorité automatique
        if score >= 20:
            self.priorite_automatique = 'critique'
        elif score >= 10:
            self.priorite_automatique = 'elevee'
        elif score >= 5:
            self.priorite_automatique = 'moyenne'
        else:
            self.priorite_automatique = 'faible'

        return score

    def save(self, *args, **kwargs):
        # Calculer le score automatiquement
        if not self.pk:  # Nouvelle urgence
            self.calculer_score_urgence()
            if not self.priorite or self.priorite == 'moyenne':
                self.priorite = self.priorite_automatique
        super().save(*args, **kwargs)


class NotificationUrgence(models.Model):
    """Notifications envoyées aux médecins pour les urgences"""
    urgence = models.ForeignKey(Urgence, on_delete=models.CASCADE, related_name='notifications')
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='notifications_urgences')
    date_envoi = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_envoi']
        verbose_name = "Notification Urgence"
        verbose_name_plural = "Notifications Urgences"
        db_table = 'NotificationUrgence'

    def __str__(self):
        return f"Notification pour Dr. {self.medecin.user.username} - {self.urgence.type_urgence}"

# -------------------- Consultation Messages --------------------
class ConsultationMessage(models.Model):
    """Messages exchanged during online consultations"""
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultation_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        db_table = 'ConsultationMessage'
        verbose_name = "Message de consultation"
        verbose_name_plural = "Messages de consultation"

    def __str__(self):
        return f"Message de {self.sender.username} pour consultation {self.consultation.numero}"


# -------------------- Ratings & Reviews --------------------
class Rating(models.Model):
    """Évaluations des médecins par les patients"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='ratings')
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='ratings')
    rendez_vous = models.OneToOneField(RendezVous, on_delete=models.CASCADE, related_name='rating')
    note = models.IntegerField(choices=[(i, i) for i in range(1, 6)], verbose_name="Note (1-5)")
    commentaire = models.TextField(blank=True, verbose_name="Commentaire")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('patient', 'rendez_vous')
        ordering = ['-date_creation']
        verbose_name = "Évaluation"
        verbose_name_plural = "Évaluations"
        db_table = 'Rating'

    def __str__(self):
        return f"Évaluation de {self.patient.user.username} pour Dr. {self.medecin.user.username} - {self.note}/5"


# -------------------- Messaging --------------------  
class Conversation(models.Model):
    """Conversation between two users"""
    participants = models.ManyToManyField(User, related_name='conversations')
    subject = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']
        db_table = 'Conversation'

    def __str__(self):
        participant_names = ", ".join([p.username for p in self.participants.all()])
        return f"Conversation: {self.subject} ({participant_names})"

    def get_other_participant(self, user):
        """Get the other participant in a conversation (for 1-on-1 chats)"""
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """Individual messages within a conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['timestamp']
        db_table = 'Message'

    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation.subject}"

    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


# -------------------- Chatbot Knowledge Base --------------------
class ChatbotKnowledgeBase(models.Model):
    """Knowledge base entries for the chatbot"""
    CATEGORY_CHOICES = [
        ('general', 'Général'),
        ('symptoms', 'Symptômes'),
        ('services', 'Services'),
        ('emergency', 'Urgences'),
        ('medication', 'Médicaments'),
        ('appointment', 'Rendez-vous'),
        ('other', 'Autre'),
    ]
    
    keyword = models.CharField(max_length=100, verbose_name="Mot-clé")
    response = models.TextField(verbose_name="Réponse")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general', verbose_name="Catégorie")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Entrée de base de connaissances"
        verbose_name_plural = "Entrées de base de connaissances"
        db_table = 'ChatbotKnowledgeBase'
        ordering = ['keyword']
    
    def __str__(self):
        return f"{self.keyword} - {self.get_category_display()}"


# -------------------- Notifications --------------------
class Notification(models.Model):
    TYPE_CHOICES = [
        ('article_valide', 'Article validé'),
        ('article_refuse', 'Article refusé'),
        ('article_desactive', 'Article désactivé'),
    ]
    
    medecin = models.ForeignKey(Medecin, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    article_titre = models.CharField(max_length=200, blank=True)
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Notification'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.article_titre}"

# -------------------- Medical Documents --------------------
class MedicalDocument(models.Model):
    """Medical documents shared between patients and doctors"""
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_documents')
    medecin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_documents')
    rendez_vous = models.ForeignKey(RendezVous, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    document_type = models.CharField(max_length=100, verbose_name="Type de document")
    description = models.TextField(blank=True, verbose_name="Description")
    file = models.FileField(upload_to='medical_documents/', verbose_name="Fichier")
    
    # Nouveaux champs à remplir par le patient
    nom_patient = models.CharField(max_length=100, verbose_name="Nom du patient", blank=True, default="")
    prenom_patient = models.CharField(max_length=100, verbose_name="Prénom du patient", blank=True, default="")
    date_naissance = models.DateField(verbose_name="Date de naissance", null=True, blank=True)
    poids = models.FloatField(verbose_name="Poids (kg)", null=True, blank=True)
    taille = models.FloatField(verbose_name="Taille (cm)", null=True, blank=True)
    adresse = models.CharField(max_length=255, verbose_name="Adresse", blank=True, default="")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone", blank=True, default="")

    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'upload")
    
    class Meta:
        db_table = 'MedicalDocument'
        verbose_name = "Document médical"
        verbose_name_plural = "Documents médicaux"
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.document_type} - {self.patient.get_full_name()} to Dr. {self.medecin.get_full_name()}"




class ZoomToken(models.Model):
    access_token = models.TextField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ZoomToken valid until {self.expires_at}"


class ChatbotConfig(models.Model):
    welcome_message = models.CharField(max_length=255, default="Bonjour {user}! 👋 Je suis votre assistant virtuel.")
    fallback_message = models.CharField(max_length=255, default="Je n'ai pas compris.")
    placeholder_text = models.CharField(max_length=255, default="Rechercher...")
    input_placeholder = models.CharField(max_length=255, default="Écrire un message Ici...")
    primary_color = models.CharField(max_length=7, default="#22c55e")  # #RRGGBB
    confidence_threshold = models.FloatField(default=0.5)

    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ MÉTHODE MANQUANTE DANS TON PROJET (cause de l’erreur)
    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id=1)
        return config

    def __str__(self):
        return "Configuration du chatbot"
    


class MedicamentReminder(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE)
    dosage = models.CharField(max_length=50)
    quantity = models.IntegerField()
    time = models.CharField(max_length=10)  # format "14:00"

    def __str__(self):
        return f"Rappel {self.medicament.nom} pour {self.patient.nom}"