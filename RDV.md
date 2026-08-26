# Patient Appointment Component Analysis

## Component File

**File Name:** `RendezVous.jsx`
**Location:** `frontend/src/pages/Patient/RendezVous.jsx`

## Function that Loads Appointments

The component uses the `chargerMesRendezVous` function to load appointments:

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

## How Appointments are Filtered/Displayed

The component implements multiple filtering mechanisms:

### 1. Main Filter (History/Upcoming/All)

```javascript
// Filter by main category
useEffect(() => {
  chargerMesRendezVous();
}, [filter]);
```

### 2. Search and Status Filter

```javascript
// Filtrer selon recherche et statut
useEffect(() => {
  let filtered = Array.isArray(rendezvous)
    ? rendezvous.filter(
        (rdv) =>
          rdv.medecin_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rdv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rdv.date?.includes(searchTerm)
      )
    : [];

  // Apply status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter((rdv) => rdv.statut === statusFilter);
  }

  // Sort by date and time (closest future date first)
  filtered.sort((a, b) => {
    const dateA = new Date(a.date_rdv || `${a.date}T${a.heure}`);
    const dateB = new Date(b.date_rdv || `${b.date}T${b.heure}`);
    return dateB - dateA; // Sort by date descending for history
  });

  setFilteredRdv(filtered);
}, [searchTerm, rendezvous, statusFilter]);
```

### 3. Status Filter Options

The UI provides buttons to filter by appointment status:

- **All Statuses** (`statusFilter === 'all'`)
- **Confirmed** (`statusFilter === 'CONFIRMED'`)
- **Pending** (`statusFilter === 'PENDING'`)
- **Cancelled** (`statusFilter === 'CANCELLED'`)

### 4. Display Logic

```javascript
// In the JSX render section
{
  Array.isArray(filteredRdv) &&
    filteredRdv.map((rdv, index) => (
      <div key={`rdv-${rdv.id || rdv.numero || index}`} className="col-md-12">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="card-title mb-1">{rdv.medecin_nom}</h5>
                <div className="d-flex align-items-center gap-3 text-muted mb-2">
                  <span>
                    <i className="bi bi-calendar-event"></i> {rdv.date}
                  </span>
                  <span>
                    <i className="bi bi-clock"></i> {rdv.heure}
                  </span>
                  <span>
                    <i
                      className={`bi ${
                        rdv.type_consultation === "teleconsultation"
                          ? "bi-camera-video"
                          : "bi-building"
                      }`}
                    ></i>
                    {rdv.type_consultation === "teleconsultation"
                      ? " Téléconsultation"
                      : " Cabinet"}
                  </span>
                </div>
                <p className="text-muted mb-0">{rdv.description}</p>
              </div>

              <div className="d-flex flex-column align-items-end gap-2">
                {getStatusBadge(rdv.statut)}
                {isToday(rdv.date) && (
                  <span className="badge bg-info">
                    <FaVideo className="me-1" />
                    Aujourd'hui
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons based on status */}
            <div className="d-flex justify-content-between align-items-center">
              <div>
                {rdv.statut === "CONFIRMED" && (
                  <div className="d-flex gap-2">
                    {isToday(rdv.date) && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => goToTeleconsultation(rdv)}
                      >
                        <FaVideo className="me-1" /> Téléconsultation
                      </button>
                    )}
                    {/* ... other buttons ... */}
                  </div>
                )}

                {rdv.statut === "PENDING" && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-info" disabled>
                      En attente de confirmation
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleAnnuler(rdv.id || rdv.numero)}
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {/* ... other status handling ... */}
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
}
```

## API Endpoints Used

1. **`rendezVousAPI.mesRendezVous()`** - Maps to `/api/rendezvous/mes-demandes/` (all appointments)
2. **`rendezVousAPI.aVenir()`** - Maps to `/api/rendezvous/upcoming/` (future appointments)
3. **`rendezVousAPI.historique()`** - Maps to `/api/rendezvous/history/` (past appointments)

## Key Features

- **Status-based filtering** with visual indicators
- **Search functionality** across doctor names, descriptions, and dates
- **Sorting** by date and time
- **Action buttons** based on appointment status
- **Today's appointments** highlighted with special badges
- **Teleconsultation access** for today's confirmed appointments
