from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Patient, Medecin, Consultation, RendezVous,
    Pathologie, Medicament, Traitement,
    Constante, Mesure, Article,
    StructureDeSante, Service, User, Hopital,Clinique,Dentiste,Pharmacie,ContactFooter,
    ChatbotConversation, RappelMedicament, HistoriquePriseMedicament,
    Urgence, NotificationUrgence, AuditLog, Teleconsultation, DisponibiliteMedecin, IndisponibiliteMedecin  # Added AuditLog
)

# -------------------- Patient --------------------
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("user", "get_first_name", "get_last_name", "user_email", "adresse")
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")
    list_select_related = ("user",)

    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = "Prénom"

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = "Nom"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"


# -------------------- Médecin --------------------
class GeneralisteSpecialisteFilter(admin.SimpleListFilter):
    title = "Type de médecin"
    parameter_name = "type_medecin"

    def lookups(self, request, model_admin):
        return [
            ('generaliste', "Généralistes"),
            ('specialiste', "Spécialistes"),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'generaliste':
            return queryset.filter(specialite__iexact="Généraliste")
        if self.value() == 'specialiste':
            return queryset.exclude(specialite__iexact="Généraliste")
        return queryset


@admin.register(Medecin)
class MedecinAdmin(admin.ModelAdmin):
    list_display = ("user", "get_first_name", "get_last_name", "user_email", "specialite", "disponibilite")
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name", "specialite")
    list_filter = ("specialite", "disponibilite", GeneralisteSpecialisteFilter)
    list_select_related = ("user",)

    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = "Prénom"

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = "Nom"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"


# -------------------- Consultation --------------------
@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ("numero", "date", "heure", "patient", "medecin")
    search_fields = ("patient__user__first_name", "patient__user__last_name", "medecin__user__first_name", "medecin__user__last_name")
    list_filter = ("date", "medecin")
    list_select_related = ("patient__user", "medecin__user")


# -------------------- Rendez-vous --------------------
@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ("numero", "date", "heure", "patient", "medecin")
    search_fields = ("patient__user__first_name", "patient__user__last_name", "medecin__user__first_name", "medecin__user__last_name")
    list_filter = ("date", "medecin")
    list_select_related = ("patient__user", "medecin__user")


# -------------------- Pathologie --------------------
@admin.register(Pathologie)
class PathologieAdmin(admin.ModelAdmin):
    list_display = ("nom", "description", "disponibilite")
    search_fields = ("nom", "description")
    list_filter = ("disponibilite",)


# -------------------- Médicaments --------------------
@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ("nom", "dosage")
    search_fields = ("nom",)


# -------------------- Traitement --------------------
@admin.register(Traitement)
class TraitementAdmin(admin.ModelAdmin):
    list_display = ("id_traitement", "consultation", "medicament", "posologie")
    search_fields = ("medicament__nom", "consultation__patient__user__first_name", "consultation__patient__user__last_name")
    list_filter = ("consultation",)


# -------------------- Constantes --------------------
@admin.register(Constante)
class ConstanteAdmin(admin.ModelAdmin):
    list_display = ("id", "nom_constante")
    search_fields = ("nom_constante",)


# -------------------- Mesures --------------------
@admin.register(Mesure)
class MesureAdmin(admin.ModelAdmin):
    list_display = ("id_mesure", "constante", "valeur", "unite")
    search_fields = ("constante__nom_constante",)
    list_filter = ("constante",)


# -------------------- Articles --------------------
@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['titre', 'auteur', 'categorie', 'statut', 'vues', 'date_publication']
    list_filter = ['statut', 'categorie', 'date_publication']
    search_fields = ['titre', 'contenu', 'tags']
    prepopulated_fields = {'slug': ('titre',)}
    readonly_fields = ['vues', 'date_publication', 'date_modification']


# -------------------- Structures de Santé --------------------
@admin.register(StructureDeSante)
class StructureDeSanteAdmin(admin.ModelAdmin):
    list_display = ("nom", "adresse")
    search_fields = ("nom", "adresse")


# -------------------- Services --------------------
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("nom_service", "responsable", "structure")
    search_fields = ("nom_service", "responsable")
    list_filter = ("structure",)


# -------------------- User Admin --------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'role')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('username',)


@admin.register(Hopital)
class HopitalAdmin(admin.ModelAdmin):
    list_display = ("nom", "adresse", "telephone", "email", "site_web")
    search_fields = ("nom", "adresse")
    list_filter = ("adresse",)


@admin.register(Clinique)
class CliniqueAdmin(admin.ModelAdmin):
    list_display = ("nom", "adresse", "telephone", "email")
    


@admin.register(Dentiste)
class DentisteAdmin(admin.ModelAdmin):
    list_display = ("nom", "adresse", "cabinet", "telephone", "email")
    search_fields = ("nom", "cabinet")
    list_filter = ("cabinet",)


@admin.register(Pharmacie)
class PharmacieAdmin(admin.ModelAdmin):
    list_display = ("nom", "adresse", "telephone", "email", "ouvert_24h")
    search_fields = ("nom", "adresse")
    list_filter = ("ouvert_24h",)

@admin.register(ContactFooter)
class ContactFooterAdmin(admin.ModelAdmin):
    list_display = ("nom", "email", "sujet", "date_envoi")
    search_fields = ("nom", "email", "sujet")


# Add admin registrations for new models
@admin.register(ChatbotConversation)
class ChatbotConversationAdmin(admin.ModelAdmin):
    list_display = ("patient", "message_user", "message_bot", "timestamp", "sentiment")
    search_fields = ("message_user", "message_bot", "patient__user__username")
    list_filter = ("timestamp", "sentiment")
    readonly_fields = ("timestamp",)


@admin.register(RappelMedicament)
class RappelMedicamentAdmin(admin.ModelAdmin):
    list_display = ("patient", "medicament", "frequence", "heure_rappel", "date_debut", "date_fin", "actif")
    search_fields = ("medicament", "patient__user__username")
    list_filter = ("frequence", "actif", "date_debut", "heure_rappel")
    # Remove readonly_fields as 'created_at' doesn't exist in the model


@admin.register(HistoriquePriseMedicament)
class HistoriquePriseMedicamentAdmin(admin.ModelAdmin):
    list_display = ("rappel", "date_prise", "prise_effectuee")
    search_fields = ("rappel__medicament", "rappel__patient__user__username")
    list_filter = ("date_prise", "prise_effectuee")
    readonly_fields = ("date_prise",)


# -------------------- Audit Logs --------------------
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "model_name", "object_id", "timestamp")
    list_filter = ("action", "model_name", "timestamp")
    search_fields = ("user__username", "model_name", "details")
    readonly_fields = ("timestamp", "ip_address", "user_agent")
    
    def has_add_permission(self, request):
        return False  # Empêcher l'ajout manuel de logs
    
    def has_change_permission(self, request, obj=None):
        return False  # Empêcher la modification de logs


# -------------------- Urgences --------------------
@admin.register(Urgence)
class UrgenceAdmin(admin.ModelAdmin):
    list_display = ("type_urgence", "patient", "priorite", "statut", "date_creation")
    list_filter = ("priorite", "statut", "date_creation")
    search_fields = ("type_urgence", "description", "patient__user__username")
    readonly_fields = ("date_creation", "date_modification", "score_urgence")


@admin.register(NotificationUrgence)
class NotificationUrgenceAdmin(admin.ModelAdmin):
    list_display = ("urgence", "medecin", "lue", "date_envoi")
    list_filter = ("lue", "date_envoi")
    search_fields = ("urgence__type_urgence", "medecin__user__username")
    readonly_fields = ("date_envoi",)



admin.register(Teleconsultation)
class TeleconsultationAdmin(admin.ModelAdmin):
    list_display = ('id', 'consultation', 'channel_name', 'created_at', 'ended_at')
    search_fields = ('consultation__numero', 'channel_name')
    list_filter = ('created_at', 'ended_at')


@admin.register(Teleconsultation)
class TeleconsultationAdmin(admin.ModelAdmin):
    # Colonnes à afficher dans la liste
    list_display = ('id', 'consultation', 'channel_name', 'created_at', 'ended_at')
    
    # Champs cliquables pour accéder à l'objet
    list_display_links = ('id', 'consultation')
    
    # Champs filtrables
    list_filter = ('created_at', 'ended_at')
    
    # Barre de recherche
    search_fields = ('consultation__numero', 'channel_name')
    
    # Lecture seule pour certains champs
    readonly_fields = ('created_at',)
    
    # Organisation des champs dans le formulaire
    fieldsets = (
        (None, {
            'fields': ('consultation', 'channel_name')
        }),
        ('Dates', {
            'fields': ('created_at', 'ended_at')
        }),
    )    



@admin.register(DisponibiliteMedecin)
class DisponibiliteMedecinAdmin(admin.ModelAdmin):
    list_display = ('medecin', 'jour', 'heure_debut', 'heure_fin', 'actif')
    list_filter = ('jour', 'actif')
    search_fields = ('medecin__user__username', 'medecin__user__first_name', 'medecin__user__last_name')    


@admin.register(IndisponibiliteMedecin)
class IndisponibiliteMedecinAdmin(admin.ModelAdmin):
    list_display = ('medecin', 'date_debut', 'date_fin', 'toute_la_journee')
    list_filter = ('toute_la_journee', 'type')
    search_fields = ('medecin__user__username',)
