import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { rendezVousAPI, patientAPI } from "../../services/api";
import { FaCalendarCheck, FaUserMd, FaSearch, FaEdit, FaVideo, FaArrowLeft, FaHistory, FaCheck, FaClock, FaTimes } from "react-icons/fa";
import appointmentReminderService from "../../services/appointmentReminderService";

function RendezVous() {
  const navigate = useNavigate();
  const [rendezvous, setRendezvous] = useState([]); // ✅ DOIT être [] par défaut
  const [filteredRdv, setFilteredRdv] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [filter, setFilter] = useState("à_venir"); // Changed default to "à_venir" to show pending appointments
  const [statusFilter, setStatusFilter] = useState("all");

  // Check for today's appointments
  useEffect(() => {
    if (rendezvous && Array.isArray(rendezvous)) {
      // Filter for confirmed appointments that are today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysConfirmedAppointments = rendezvous.filter(rdv => {
        if (rdv.statut !== "CONFIRMED") return false;
        
        // Parse appointment date
        let appointmentDate;
        if (typeof rdv.date === 'string') {
          if (rdv.date.includes('-')) {
            appointmentDate = new Date(rdv.date);
          } else if (rdv.date.includes('/')) {
            const parts = rdv.date.split('/');
            appointmentDate = new Date(parts[2], parts[1] - 1, parts[0]);
          } else {
            appointmentDate = new Date(rdv.date);
          }
        } else {
          appointmentDate = new Date(rdv.date);
        }
        
        if (isNaN(appointmentDate.getTime())) return false;
        
        appointmentDate.setHours(0, 0, 0, 0);
        return today.getTime() === appointmentDate.getTime();
      });
      
      setTodaysAppointments(todaysConfirmedAppointments);
    }
  }, [rendezvous]);

  // Charger les rendez-vous depuis l'API
  const chargerMesRendezVous = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement RDV patient...');
      console.log('📊 Filtre actuel:', filter);
      
      let rdvs;
      if (filter === 'à_venir') {
        // Charger TOUS les rendez-vous, puis filtrer côté frontend
        const allRdvs = await rendezVousAPI.mesRendezVous();
        console.log('📥 Tous les RDV:', allRdvs);
        
        // Filtrer pour garder seulement les RDV futurs (PENDING ou CONFIRMED)
        const now = new Date();
        rdvs = allRdvs.filter(rdv => {
          const rdvDate = new Date(rdv.date_rdv || rdv.date);
          const isFuture = rdvDate >= now;
          const isPendingOrConfirmed = ['PENDING', 'CONFIRMED'].includes(rdv.statut);
          
          console.log(`RDV ${rdv.id}: date=${rdvDate}, isFuture=${isFuture}, statut=${rdv.statut}, inclus=${isFuture && isPendingOrConfirmed}`);
          
          return isFuture && isPendingOrConfirmed;
        });
        
        console.log('✅ RDV à venir filtrés:', rdvs.length);
        
      } else if (filter === 'historique') {
        rdvs = await rendezVousAPI.historique();
        console.log('📥 RDV historique:', rdvs);
      } else {
        rdvs = await rendezVousAPI.mesRendezVous();
        console.log('📥 Tous les RDV:', rdvs);
      }
      
      console.log('✅ RDV reçus:', rdvs);
      console.log('📊 Nombre:', rdvs.length);
      
      // Afficher le détail des RDV PENDING
      const pendingRdvs = rdvs.filter(rdv => rdv.statut === 'PENDING');
      console.log('⏳ RDV en attente:', pendingRdvs);
      console.log('📊 Nombre en attente:', pendingRdvs.length);
      
      // VÉRIFIE QUE rdvs est un array
      if (Array.isArray(rdvs)) {
        setRendezvous(rdvs);
        setFilteredRdv(rdvs);
      } else {
        console.warn('⚠️ Réponse non-array:', rdvs);
        setRendezvous([]);
        setFilteredRdv([]);
      }
      
      setLoading(false);
      
      // Initialize appointment reminders for confirmed appointments
      if (Array.isArray(rdvs)) {
        rdvs
          .filter(app => app.statut === "CONFIRMED")
          .forEach(app => {
            appointmentReminderService.addAppointmentReminder(app);
          });
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement RDV:', error);
      setRendezvous([]); // ✅ Initialiser à [] en cas d'erreur
      setFilteredRdv([]);
      setError("Erreur lors du chargement des rendez-vous");
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerMesRendezVous();
  }, [filter]);

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
      filtered = filtered.filter(rdv => rdv.statut === statusFilter);
    }
    
    // Sort by date and time (closest future date first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_rdv || `${a.date}T${a.heure}`);
      const dateB = new Date(b.date_rdv || `${b.date}T${b.heure}`);
      return dateB - dateA; // Sort by date descending for history
    });
    
    setFilteredRdv(filtered);
  }, [searchTerm, rendezvous, statusFilter]);

  // Annuler un rendez-vous
  const handleAnnuler = async (rdvId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }
    
    try {
      await rendezVousAPI.annuler(rdvId);
      setRendezvous((prev) =>
        Array.isArray(prev) 
          ? prev.map((rdv) =>
              (rdv.id === rdvId || rdv.numero === rdvId) ? { ...rdv, statut: "CANCELLED" } : rdv
            )
          : []
      );
      
      // Remove the reminder for this appointment
      appointmentReminderService.removeReminder(rdvId);
      
      // Show success message
      alert("Rendez-vous annulé avec succès !");
      
      // Recharger la liste
      chargerMesRendezVous();
      
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      
      // Show specific error message to user
      let errorMessage = "Erreur lors de l'annulation du rendez-vous. Veuillez réessayer.";
      
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = `Erreur: ${error.response.data.error}`;
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = `Erreur: ${error.response.data.detail}`;
        } else if (error.response.status) {
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Reprogrammer un rendez-vous
  const rescheduleAppointment = async (appointment) => {
    // Get today's date for validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newDate = prompt("Nouvelle date (YYYY-MM-DD) :");
    if (!newDate) return;
    
    // Validate that the date is not in the past
    const newDateObj = new Date(newDate);
    newDateObj.setHours(0, 0, 0, 0);
    
    if (newDateObj < today) {
      alert("Veuillez sélectionner une date future valide");
      return;
    }
    
    const newHeure = prompt("Nouvelle heure (HH:MM) :");
    if (!newHeure) return;

    try {
      // Use the ID field that's available in the appointment object
      const id = appointment.id || appointment.numero;
      
      // Note: This functionality might need to be updated to use rendezVousAPI if available
      // For now, keeping existing implementation as it may require backend changes
      await patientAPI.rescheduleAppointment(id, { date: newDate, heure: newHeure });
      
      setRendezvous((prev) =>
        Array.isArray(prev)
          ? prev.map((rdv) =>
              (rdv.id === id || rdv.numero === id) ? { ...rdv, date: newDate, heure: newHeure, statut: "RESCHEDULED" } : rdv
            )
          : []
      );
      
      // Update the reminder for this appointment
      appointmentReminderService.removeReminder(id);
      // Add new reminder if needed
      
      // Show success message
      alert("Rendez-vous reprogrammé avec succès !");
    } catch (error) {
      console.error("Erreur lors du reprogrammation :", error);
      
      // Show specific error message to user
      let errorMessage = "Erreur lors de la reprogrammation du rendez-vous. Veuillez réessayer.";
      
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = `Erreur: ${error.response.data.error}`;
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = `Erreur: ${error.response.data.detail}`;
        } else if (error.response.status) {
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Proposer une reprogrammation (nouvelle fonctionnalité)
  const proposeReschedule = async (appointment) => {
    // Get today's date for validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newDate = prompt("Proposer une nouvelle date (YYYY-MM-DD) :");
    if (!newDate) return;
    
    // Validate that the date is not in the past
    const newDateObj = new Date(newDate);
    newDateObj.setHours(0, 0, 0, 0);
    
    if (newDateObj < today) {
      alert("Veuillez sélectionner une date future valide");
      return;
    }
    
    const newHeure = prompt("Proposer une nouvelle heure (HH:MM) :");
    if (!newHeure) return;

    try {
      // Use the ID field that's available in the appointment object
      const id = appointment.id || appointment.numero;
      
      // Use the propose reschedule API endpoint
      // Note: This functionality might need to be updated to use rendezVousAPI if available
      // For now, keeping existing implementation as it may require backend changes
      const response = await patientAPI.proposeReschedule(id, { date: newDate, heure: newHeure });
      
      setRendezvous((prev) =>
        Array.isArray(prev)
          ? prev.map((rdv) =>
              (rdv.id === id || rdv.numero === id) ? { ...rdv, date: newDate, heure: newHeure, statut: "RESCHEDULED" } : rdv
            )
          : []
      );
      
      // Remove the reminder for this appointment since it's now rescheduled
      appointmentReminderService.removeReminder(id);
      
      alert("Proposition de reprogrammation envoyée. En attente de confirmation du médecin.");
    } catch (error) {
      console.error("Erreur lors de la proposition de reprogrammation :", error);
      
      // Show specific error message to user
      let errorMessage = "Erreur lors de la proposition de reprogrammation du rendez-vous. Veuillez réessayer.";
      
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = `Erreur: ${error.response.data.error}`;
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = `Erreur: ${error.response.data.detail}`;
        } else if (error.response.status) {
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Vérifier si un rendez-vous peut être reprogrammé (plus de 30 minutes après confirmation)
  const canReschedule = (rdv) => {
    // Si le rendez-vous est confirmé, vérifier s'il s'est écoulé plus de 30 minutes
    if (rdv.statut === "CONFIRMED") {
      const appointmentTime = new Date(`${rdv.date}T${rdv.heure}`);
      const now = new Date();
      const timeDiff = now - appointmentTime;
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Si plus de 30 minutes se sont écoulées depuis la confirmation, on peut reprogrammer
      return minutesDiff > 30;
    }
    
    // Si le rendez-vous est reprogrammé, on peut en proposer un autre immédiatement
    if (rdv.statut === "RESCHEDULED") {
      return true;
    }
    
    // Pour les autres statuts, on ne peut pas reprogrammer
    return false;
  };

  // Vérifier si un rendez-vous peut être confirmé par le patient
  // (This should never be true as patients don't confirm appointments directly)
  const canConfirm = (rdv) => {
    // Patients should never be able to confirm appointments directly
    // Only doctors can confirm appointments
    return false;
  };

  // Get status badge with color
  const getStatusBadge = (statut) => {
    const statusConfig = {
      "CONFIRMED": { text: "Confirmé", color: "success", icon: <FaCheck /> },
      "PENDING": { text: "En attente", color: "warning", icon: <FaClock /> },
      "CANCELLED": { text: "Annulé", color: "danger", icon: <FaTimes /> },
      "RESCHEDULED": { text: "Reprogrammé", color: "info", icon: <FaEdit /> }
    };
    
    const config = statusConfig[statut] || { text: statut, color: "secondary", icon: null };
    
    return (
      <span className={`badge bg-${config.color} d-flex align-items-center gap-1`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Vérifier si un rendez-vous est aujourd'hui
  const isToday = (dateString) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let appointmentDate;
      if (dateString instanceof Date) {
        appointmentDate = dateString;
      } else if (typeof dateString === 'string') {
        if (dateString.includes('/')) {
          // Format: DD/MM/YYYY
          const parts = dateString.split('/');
          appointmentDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateString.includes('-')) {
          // Format: YYYY-MM-DD
          appointmentDate = new Date(dateString);
        } else {
          appointmentDate = new Date(dateString);
        }
      } else {
        appointmentDate = new Date(dateString);
      }
      
      if (isNaN(appointmentDate.getTime())) {
        return false;
      }
      
      appointmentDate.setHours(0, 0, 0, 0);
      return today.getTime() === appointmentDate.getTime();
    } catch (error) {
      console.error("Error in isToday function:", error);
      return false;
    }
  };


  // Accéder à la téléconsultation Zoom
const joinZoomMeeting = async (rdv) => {
  try {
    // Appel API backend pour générer/récupérer la réunion Zoom
    const token = localStorage.getItem("accessToken"); // ou ton auth token
    const response = await fetch(
      `http://127.0.0.1:8000/api/zoom/create-meeting/${rdv.id}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Erreur lors de la récupération du lien Zoom");
    }

    const data = await response.json();
    // Ouvrir la réunion Zoom dans un nouvel onglet
    window.open(data.join_url, "_blank");
  } catch (error) {
    console.error("Erreur téléconsultation Zoom:", error);
    alert("Impossible de rejoindre la téléconsultation. Veuillez réessayer.");
  }
};


  // Accéder à la téléconsultation
  const goToTeleconsultation = (appointment) => {
    // Navigate to the consultation list where teleconsultation can be accessed
    navigate("/patient/consultations");
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      {/* Teleconsultation Banner */}
      {Array.isArray(todaysAppointments) && todaysAppointments.length > 0 && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <div className="d-flex align-items-center">
            <FaVideo className="me-2" />
            <div>
              <strong>Téléconsultation disponible!</strong> Vous avez {todaysAppointments.length} rendez-vous aujourd'hui. 
              Vous pouvez démarrer une téléconsultation avec votre médecin.
              <button 
                className="btn btn-sm btn-info ms-3"
                onClick={() => navigate("/patient/consultations")}
              >
                Accéder aux téléconsultations
              </button>
            </div>
          </div>
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      <div className="row">
        {/* Back button */}
        <div className="col-12 mb-4">
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => navigate("/patient/dashboard")}
          >
            <FaArrowLeft />
            Retour au tableau de bord
          </button>
        </div>
        
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Filtres</h5>
            </div>
            <div className="list-group list-group-flush">
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${filter === 'historique' ? 'active' : ''}`}
                onClick={() => setFilter('historique')}
              >
                <FaHistory />
                Historique
              </button>
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${filter === 'à_venir' ? 'active' : ''}`}
                onClick={() => setFilter('à_venir')}
              >
                <FaCalendarCheck />
                À venir
              </button>
              <button 
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${filter === 'tous' ? 'active' : ''}`}
                onClick={() => setFilter('tous')}
              >
                <FaUserMd />
                Tous les RDV
              </button>
            </div>
            
            <div className="card-body border-top">
              <h6 className="card-title">Filtrer par statut</h6>
              <div className="d-flex flex-column gap-2">
                <button 
                  className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Tous les statuts
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'CONFIRMED' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setStatusFilter('CONFIRMED')}
                >
                  Confirmés
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setStatusFilter('PENDING')}
                >
                  En attente
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'CANCELLED' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setStatusFilter('CANCELLED')}
                >
                  Annulés
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              {filter === 'historique' && 'Historique des Rendez-vous'}
              {filter === 'à_venir' && 'Rendez-vous à venir'}
              {filter === 'tous' && 'Tous les Rendez-vous'}
            </h2>
            <div className="d-flex gap-2">
              <div style={{ position: "relative", width: "250px" }}>
                <input
                  type="text"
                  placeholder="Rechercher un rendez-vous..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
                <FaSearch
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    color: "#888",
                  }}
                />
              </div>
            </div>
          </div>

          {/* DANS le rendu JSX, VÉRIFIE qu'on vérifie toujours si c'est un array */}
          {Array.isArray(filteredRdv) && filteredRdv.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucun rendez-vous trouvé</h4>
              <p>
                {filter === 'historique' && 'Vous n\'avez aucun rendez-vous dans l\'historique.'}
                {filter === 'à_venir' && 'Vous n\'avez aucun rendez-vous à venir.'}
                {filter === 'tous' && 'Vous n\'avez aucun rendez-vous.'}
              </p>
              <a href="/patient/prise-rendez-vous" className="btn btn-success">Prendre un rendez-vous</a>
            </div>
          ) : (
            <div className="row g-4">
              {Array.isArray(filteredRdv) && filteredRdv.map((rdv, index) => (
                <div key={`rdv-${rdv.id || rdv.numero || index}`} className="col-md-12">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="card-title mb-1">{rdv.medecin_nom}</h5>
                          <div className="d-flex align-items-center gap-3 text-muted mb-2">
                            <span><i className="bi bi-calendar-event"></i> {rdv.date}</span>
                            <span><i className="bi bi-clock"></i> {rdv.heure || '00:00'}</span>
                            <span>
                              <i className={`bi ${rdv.type_consultation === "teleconsultation" ? "bi-camera-video" : "bi-building"}`}></i>
                              {rdv.type_consultation === "teleconsultation" ? " Téléconsultation" : " Cabinet"}
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
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          {rdv.statut === "CONFIRMED" && (
                            <div className="d-flex gap-2">
                              {isToday(rdv.date) && rdv.statut === "CONFIRMED" && rdv.type_consultation === "teleconsultation" && (
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => joinZoomMeeting(rdv)}
                                >
                                  <FaVideo className="me-1" /> Rejoindre la téléconsultation
                                </button>
                              )}
                              {canReschedule(rdv) ? (
                                <>
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => proposeReschedule(rdv)}
                                  >
                                    <FaEdit className="me-1" /> Proposer un changement
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleAnnuler(rdv.id || rdv.numero)}
                                  >
                                    Annuler
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    className="btn btn-sm btn-secondary"
                                    disabled
                                  >
                                    Changement possible après 30 min
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleAnnuler(rdv.id || rdv.numero)}
                                  >
                                    Annuler
                                  </button>
                                </>
                              )}
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
                          
                          {rdv.statut === "RESCHEDULED" && (
                            <div className="d-flex gap-2">
                              {isToday(rdv.date) && (
                                <button 
                                  className="btn btn-sm btn-info"
                                  onClick={() => goToTeleconsultation(rdv)}
                                >
                                  <FaVideo className="me-1" /> Téléconsultation
                                </button>
                              )}
                              <button 
                                className="btn btn-sm btn-warning"
                                onClick={() => proposeReschedule(rdv)}
                              >
                                <FaEdit className="me-1" /> Proposer un autre changement
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleAnnuler(rdv.id || rdv.numero)}
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                          
                          {rdv.statut === "CANCELLED" && (
                            <div>
                              <button className="btn btn-sm btn-secondary" disabled>
                                Rendez-vous annulé
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-end">
                          <small className="text-muted">RDV #{rdv.id || rdv.numero}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RendezVous;