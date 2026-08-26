# RDV System Analysis

## 1️⃣ Pour les créneaux grisés (Problème 1)

### Composant React qui affiche les créneaux horaires disponibles

Le composant React se trouve dans `frontend/src/pages/Patient/PriseDeRendezVous.jsx`.

#### Fonction qui récupère les créneaux disponibles

```javascript
// Charger les disponibilités quand un médecin est sélectionné
useEffect(() => {
  if (selectedMedecin && selectedDate) {
    const fetchAvailableSlots = async (medecinId, date) => {
      try {
        setLoading(true);
        console.log("🔄 Récupération créneaux...", { medecinId, date });

        // Formater la date en YYYY-MM-DD
        const dateFormatted =
          date instanceof Date ? date.toISOString().split("T")[0] : date;

        const response = await rendezVousAPI.creneauxDisponibles(
          medecinId,
          dateFormatted
        );

        console.log("✅ Créneaux reçus:", response);

        if (response && Array.isArray(response.slots)) {
          setAvailableSlots(response.slots);
          console.log(`✅ ${response.slots.length} créneaux chargés`);
        } else {
          console.error("❌ Format de réponse invalide:", response);
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error("❌ Erreur récupération créneaux:", error);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    // Fix: Check if selectedMedecin has user property before accessing it
    if (selectedMedecin.user && selectedMedecin.user.id) {
      fetchAvailableSlots(selectedMedecin.user.id, selectedDate);
    } else if (selectedMedecin.id) {
      // Fallback to medecin.id if user is not available
      fetchAvailableSlots(selectedMedecin.id, selectedDate);
    }
  }
}, [selectedMedecin, selectedDate]);
```

#### Logique qui détermine si un créneau est disabled/grisé

```javascript
{
  availableSlots.map((slot, index) => (
    <div key={index} className="col-4">
      <button
        className={`btn w-100 rounded-pill slot-button ${
          slot.disponible
            ? selectedSlot === slot.heure
              ? "btn-primary"
              : "btn-outline-secondary"
            : "unavailable"
        }`}
        onClick={() => {
          if (slot.disponible) {
            console.log("🖱️ Bouton cliqué - heure:", slot.heure);
            handleSlotSelect(slot.heure);
          }
        }}
        disabled={!slot.disponible}
        title={slot.disponible ? "" : slot.motif_indisponibilite}
      >
        {slot.heure}
        {!slot.disponible && (
          <span className="badge bg-dark ms-1">
            <small>❌</small>
          </span>
        )}
      </button>
    </div>
  ));
}
```

#### Appel API pour vérifier la disponibilité

Dans `frontend/src/services/api.js`:

```javascript
/**
 * Créneaux disponibles pour un médecin à une date
 * @param {number} medecinId - ID du médecin (user_id)
 * @param {string} date - Format "YYYY-MM-DD"
 */
creneauxDisponibles: async (medecinId, date) => {
  try {
    console.log("🔍 Récupération créneaux:", { medecinId, date });

    const response = await api.get("/rendezvous/creneaux_disponibles/", {
      params: {
        medecin_id: medecinId,
        date: date,
      },
    });

    console.log("✅ Créneaux reçus:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur créneaux:", error.response?.data);
    throw error;
  }
},
```

## 2️⃣ Pour la liste des RDV du patient (Problème 2)

### 1. API endpoint qui retourne les rendez-vous du patient

Endpoint: `GET /api/rendezvous/mes-demandes/`

### 2. ViewSet dans views.py qui gère cette requête

Dans `Sante_Virtuelle/sante_app/views.py`:

```python
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
```

### 3. Composant React qui affiche la liste des rendez-vous du patient

Dans `frontend/src/pages/Patient/RendezVous.jsx`:

```javascript
// Charger les rendez-vous depuis l'API
const chargerMesRendezVous = async () => {
  try {
    setLoading(true);
    console.log("🔄 Chargement RDV patient...");

    let rdvs;
    if (filter === "à_venir") {
      rdvs = await rendezVousAPI.aVenir();
    } else if (filter === "historique") {
      rdvs = await rendezVousAPI.historique();
    } else {
      rdvs = await rendezVousAPI.mesRendezVous();
    }

    console.log("✅ RDV reçus:", rdvs);

    // VÉRIFIE QUE rdvs est un array
    if (Array.isArray(rdvs)) {
      setRendezvous(rdvs);
      setFilteredRdv(rdvs);
    } else {
      console.warn("⚠️ Réponse non-array:", rdvs);
      setRendezvous([]);
      setFilteredRdv([]);
    }

    setLoading(false);

    // Initialize appointment reminders for confirmed appointments
    if (Array.isArray(rdvs)) {
      rdvs
        .filter((app) => app.statut === "CONFIRMED")
        .forEach((app) => {
          appointmentReminderService.addAppointmentReminder(app);
        });
    }
  } catch (error) {
    console.error("❌ Erreur chargement RDV:", error);
    setRendezvous([]); // ✅ Initialiser à [] en cas d'erreur
    setFilteredRdv([]);
    setError("Erreur lors du chargement des rendez-vous");
    setLoading(false);
  }
};
```

## 3️⃣ Pour l'affichage de l'heure (Problème 3)

### Serializer RendezVousSerializer

Dans `Sante_Virtuelle/sante_app/serializers.py`:

#### Champs 'heure' et 'date' dans la définition (class Meta)

```python
class RendezVousSerializer(serializers.ModelSerializer):
    medecin_id = serializers.IntegerField(write_only=True, required=False)
    medecin = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    medecin_nom = serializers.CharField(source="medecin.get_full_name", read_only=True)
    patient_nom = serializers.CharField(source="patient.get_full_name", read_only=True)
    original_date = serializers.DateField(read_only=True)
    original_heure = serializers.TimeField(read_only=True)
    # Add date_rdv field to handle combined datetime from frontend
    date_rdv = serializers.DateTimeField(write_only=True, required=False)
    # Add heure field to ensure it's properly validated
    heure = serializers.TimeField(write_only=True, required=True)

    class Meta:
        model = RendezVous
        fields = [
            'numero', 'medecin_id', 'medecin', 'patient', 'date', 'heure', 'description', 'motif_consultation', 'statut',
            'type_consultation', 'medecin_nom', 'patient_nom',
            'original_date', 'original_heure', 'date_creation', 'date_modification', 'date_rdv'
        ]
        # Remove 'date' and 'heure' from read_only_fields to allow them to be set during creation
        read_only_fields = ['patient', 'date_creation', 'date_modification', 'original_date', 'original_heure']
```

#### Méthode to_representation (si elle existe)

Le serializer n'a pas de méthode `to_representation` personnalisée, il utilise donc le comportement par défaut de DRF.

#### Comment l'heure est retournée au frontend

Le champ [heure](file://c:\backendUniversite\Licence\ASV\Sante_Virtuelle\sante_app\models.py#L391-L391) est un `TimeField` dans le modèle Django, donc il est automatiquement sérialisé au format "HH:MM:SS" par défaut. Lorsque les données sont envoyées au frontend, l'heure apparaît dans ce format.

Pour personnaliser le format, on pourrait ajouter une méthode `to_representation`:

```python
def to_representation(self, instance):
    data = super().to_representation(instance)
    # Format heure as HH:MM instead of HH:MM:SS
    if 'heure' in data and data['heure']:
        data['heure'] = data['heure'][:5]  # Take only HH:MM part
    return data
```
