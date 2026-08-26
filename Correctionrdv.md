# Correction du système de rendez-vous - Analyse et Solutions

## 1. Comment medecinId est défini dans PriseDeRendezVous.jsx

Dans le composant `PriseDeRendezVous.jsx`, la variable `medecinId` est définie dans la fonction `handleConfirm` :

```javascript
// Déterminer le bon ID médecin - Use the user_id from the medecin object
// The medecin object now has a user_id property that contains the actual User ID needed
const medecinId = selectedMedecin.user_id || selectedMedecin.id;
console.log("8️⃣ ID médecin calculé:", medecinId);
```

Cette logique permet de récupérer l'ID du médecin de deux façons possibles :

- `selectedMedecin.user_id` : L'ID utilisateur du médecin (préféré)
- `selectedMedecin.id` : L'ID du médecin comme fallback

## 2. La fonction handleConfirm complète (lignes ~259-327)

```javascript
const handleConfirm = async () => {
  console.log("=== 📤 DÉBUT CRÉATION RENDEZ-VOUS ===");
  console.log("1️⃣ selectedMedecin COMPLET:", selectedMedecin);
  console.log("2️⃣ selectedMedecin.id:", selectedMedecin?.id);
  console.log("3️⃣ selectedMedecin.user_id:", selectedMedecin?.user_id);
  console.log("4️⃣ selectedDate:", selectedDate);
  console.log("5️⃣ selectedSlot:", selectedSlot);
  console.log("6️⃣ motif:", motif);
  console.log("7️⃣ typeConsultation:", typeConsultation);

  // Validation
  if (!selectedMedecin || !selectedDate || !selectedSlot || !motif) {
    alert("Veuillez remplir tous les champs requis");
    console.error("❌ Validation échouée");
    return;
  }

  try {
    // Déterminer le bon ID médecin - Use the user_id from the medecin object
    // The medecin object now has a user_id property that contains the actual User ID needed
    const medecinId = selectedMedecin.user_id || selectedMedecin.id;
    console.log("8️⃣ ID médecin calculé:", medecinId);

    if (!medecinId) {
      alert("ERREUR: Impossible de récupérer l'ID du médecin");
      console.error("❌ selectedMedecin:", selectedMedecin);
      return;
    }

    // Format de la date : YYYY-MM-DD
    const dateFormatted = selectedDate.toISOString().split("T")[0];

    // Format de l'heure : HH:MM (sans les secondes)
    const heureFormatted = selectedSlot.substring(0, 5);

    // Créer le payload
    const appointmentData = {
      medecin_id: medecinId,
      date: dateFormatted, // ✅ Format YYYY-MM-DD
      heure: heureFormatted, // ✅ Format HH:MM
      motif_consultation: motif,
      type_consultation: typeConsultation || "cabinet",
    };

    console.log("⏰ Format heure final:", appointmentData.heure);
    console.log("9️⃣ PAYLOAD FINAL:", appointmentData);
    console.log("1️⃣0️⃣ PAYLOAD JSON:", JSON.stringify(appointmentData));

    // Appel API
    console.log("1️⃣1️⃣ Envoi de la requête...");
    const response = await rendezVousAPI.creer(appointmentData);

    console.log("✅ SUCCÈS - Réponse:", response);
    alert("Rendez-vous créé avec succès ! Le médecin a été notifié.");

    // Navigate to the patient's appointment list page
    navigate("/patient/rendez-vous");
  } catch (error) {
    console.error("❌ ERREUR CRÉATION:", error);
    console.error("❌ Response:", error.response);
    console.error("❌ Data:", error.response?.data);

    if (error.response?.data) {
      const errors = error.response.data;
      let errorMsg = "Erreur :\n";
      Object.keys(errors).forEach((key) => {
        errorMsg += `${key}: ${errors[key]}\n`;
      });
      alert(errorMsg);
    } else {
      alert("Erreur lors de la création du rendez-vous");
    }
  }
};
```

## 3. La fonction qui charge les créneaux disponibles

La fonction qui charge les créneaux disponibles se trouve dans le `useEffect` hook (lignes ~126-157) :

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

Et la fonction dans le service API (`frontend/src/services/api.js`) :

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

## 4. Backend views.py - la fonction creneaux_disponibles

Dans `Sante_Virtuelle/sante_app/views.py`, la méthode `creneaux_disponibles` du `RendezVousViewSet` :

```python
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
            medecin = Medecin.objects.get(user_id=medecin_id)
        except Medecin.DoesNotExist:
            return Response({
                'error': 'Médecin introuvable'
            }, status=404)

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

        # 6. RÉCUPÉRER TOUS LES RDV CONFIRMÉS OU EN ATTENTE POUR CE MÉDECIN CE JOUR
        rdv_existants = RendezVous.objects.filter(
            medecin=medecin.user,  # Note: medecin is a User instance
            date=date_obj,
            statut__in=['CONFIRMED', 'PENDING']  # CRITIQUE: Seulement ces statuts
        )

        # Convertir en set d'heures (HH:MM) pour comparaison rapide
        heures_reservees = set()
        for rdv in rdv_existants:
            heure_str = rdv.heure.strftime('%H:%M')
            heures_reservees.add(heure_str)
            print(f"🕐 RDV existant - ID: {rdv.numero}, Heure: {rdv.heure}, Heure formatée: {heure_str}")

        print(f"📅 Date: {date_str}, Jour: {jour}")
        print(f"🕐 Heures réservées: {heures_reservees}")
        print(f"🔍 Doctor ID: {medecin_id}, Doctor User ID: {medecin.user.id}")

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
            if est_disponible and heure_str in heures_reservees:
                est_disponible = False
                motif_indisponibilite = "Déjà réservé"
                print(f"DEBUG: Slot {heure_str} marked as unavailable because it's already booked")

            slots.append({
                'heure': heure_str,
                'disponible': est_disponible,
                'motif_indisponibilite': motif_indisponibilite
            })

            current_time += delta

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
```
