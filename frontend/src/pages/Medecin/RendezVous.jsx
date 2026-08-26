import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { rendezVousAPI } from "../../services/api";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaUser, FaSearch, FaCheck, FaTimes, FaClock, FaEdit, FaFilter } from "react-icons/fa";
import DemarrerConsultationButton from "./DemarrerConsultationButton";


function RendezVous() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({});
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('demandes'); // 'demandes', 'a_venir', 'historique', 'annules'
  const [zoomLinks, setZoomLinks] = useState({});
  const [stats, setStats] = useState({
    demandes: 0,
    aVenir: 0,
    historique: 0,
    annules: 0
  });


  const chargerDemandes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📄 Chargement RDV médecin...');
      
      // Récupérer TOUS les RDV du médecin
      const response = await rendezVousAPI.mesRendezVousMedecin();
      const tousLesRdv = Array.isArray(response) ? response : (response.data || []);
      
      console.log('✅ Total RDV:', tousLesRdv.length);
      
      // Calculer les stats pour les badges
      const now = new Date();
      const stats = {
        demandes: tousLesRdv.filter(rdv => rdv.statut === 'PENDING').length,
        aVenir: tousLesRdv.filter(rdv => 
          rdv.statut === 'CONFIRMED' && new Date(rdv.date) >= now
        ).length,
        historique: tousLesRdv.filter(rdv => 
          rdv.statut === 'TERMINE' || (rdv.statut === 'CONFIRMED' && new Date(rdv.date) < now)
        ).length,
        annules: tousLesRdv.filter(rdv => rdv.statut === 'CANCELLED').length
      };
      
      setStats(stats);
      
      // Filtrer selon l'onglet actif
      let rdvsFiltres = [];
      switch(activeTab) {
        case 'demandes':
          rdvsFiltres = tousLesRdv.filter(rdv => rdv.statut === 'PENDING');
          break;
        case 'a_venir':
          rdvsFiltres = tousLesRdv.filter(rdv => 
            rdv.statut === 'CONFIRMED' && new Date(rdv.date) >= now
          );
          break;
        case 'historique':
          rdvsFiltres = tousLesRdv.filter(rdv => 
            rdv.statut === 'TERMINE' || (rdv.statut === 'CONFIRMED' && new Date(rdv.date) < now)
          );
          break;
        case 'annules':
          rdvsFiltres = tousLesRdv.filter(rdv => rdv.statut === 'CANCELLED');
          break;
        default:
          rdvsFiltres = tousLesRdv;
      }
      
      // Trier par date (plus récent en premier pour demandes, plus proche en premier pour à venir)
      rdvsFiltres.sort((a, b) => {
        if (activeTab === 'demandes' || activeTab === 'historique') {
          return new Date(b.date) - new Date(a.date); // Plus récent d'abord
        } else {
          return new Date(a.date) - new Date(b.date); // Plus proche d'abord
        }
      });
      
      console.log(`📊 ${activeTab}:`, rdvsFiltres.length, 'RDV');
      setRendezVous(rdvsFiltres);
      
    } catch (err) {
      setError("Erreur lors du chargement des rendez-vous");
      console.error("❌ Erreur chargement:", err);
      toast.error("Erreur lors du chargement des rendez-vous");
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    chargerDemandes();
  }, [chargerDemandes]);

  const handleConfirmer = async (appointmentId) => {
    try {
      await rendezVousAPI.confirmer(appointmentId);
      // Recharger les données pour mettre à jour les stats et la liste
      chargerDemandes();
      toast.success("Rendez-vous confirmé avec succès !");
    } catch (err) {
      setError("Erreur lors de la confirmation du rendez-vous");
      console.error("Error confirming appointment:", err);
      toast.error("Erreur lors de la confirmation du rendez-vous");
    }
  };

  const handleAnnuler = async (appointmentId) => {
    try {
      await rendezVousAPI.annuler(appointmentId);
      // Recharger les données pour mettre à jour les stats et la liste
      chargerDemandes();
      toast.success("Rendez-vous annulé avec succès !");
    } catch (err) {
      setError("Erreur lors de l'annulation du rendez-vous");
      console.error("Error cancelling appointment:", err);
      toast.error("Erreur lors de l'annulation du rendez-vous");
    }
  };

  // Open reschedule modal
  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleData({
      date: appointment.date || "",
      heure: appointment.heure || "",
      description: appointment.description || ""
    });
    setShowRescheduleModal(true);
  };

  // Close reschedule modal
  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setRescheduleData({});
  };

  // Handle reschedule form changes
  const handleRescheduleChange = (e) => {
    const { name, value } = e.target;
    setRescheduleData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Nouvelle fonction pour démarrer la téléconsultation Zoom
   const handleStartConsultation = async (rdv) => {
  try {
    const rdvId = rdv.id; // utiliser uniquement id

    if (!rdvId) {
      toast.error("Impossible de démarrer la téléconsultation : ID de rendez-vous manquant");
      return;
    }

    if (!zoomLinks[rdvId]) {
      const response = await axios.post(`/api/zoom/create-meeting_for_rdv/${rdvId}/`);
      const { start_url, join_url } = response.data;

      setZoomLinks(prev => ({
        ...prev,
        [rdvId]: { start_url, join_url }
      }));

      window.open(start_url, "_blank");
    } else {
      window.open(zoomLinks[rdvId].start_url, "_blank");
    }
  } catch (err) {
    console.error("Erreur création ou démarrage réunion Zoom:", err);
    toast.error("Impossible de démarrer la téléconsultation. Veuillez réessayer.");
  }
};



   // Fonction pour vérifier si le rendez-vous est prêt à démarrer
  const isConsultationReady = (rdv) => {
    const now = new Date();
    const rdvDate = new Date(`${rdv.date}T${rdv.heure}`);
    // Autoriser 5 minutes avant et 5 minutes après l'heure prévue
    const startWindow = new Date(rdvDate.getTime() - 5 * 60 * 1000);
    const endWindow = new Date(rdvDate.getTime() + 5 * 60 * 1000);
    return now >= startWindow && now <= endWindow;
  };

  // Reschedule appointment function for doctors
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Use the ID field that's available in the appointment object
      const id = selectedAppointment.numero || selectedAppointment.id;
      
      if (!id) {
        throw new Error("ID de rendez-vous manquant");
      }
      
      // Call the doctor reschedule API endpoint
      await rendezVousAPI.doctorRescheduleAppointment(id, rescheduleData);
      
      // Reload appointments to get the updated data
      chargerDemandes();
      
      // Close modal and show success message
      closeRescheduleModal();
      toast.success("Rendez-vous reprogrammé et confirmé avec succès ! Le patient a été notifié de la nouvelle date.");
    } catch (err) {
      setError("Erreur lors de la reprogrammation du rendez-vous");
      console.error("Error rescheduling appointment:", err);
      // Show specific error message to user
      const errorMessage = err.message || "Erreur lors de la reprogrammation du rendez-vous";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="badge bg-success">Confirmé</span>;
      case "CANCELLED":
        return <span className="badge bg-danger">Annulé</span>;
      case "RESCHEDULED":
        return <span className="badge bg-warning">Reprogrammé</span>;
      case "PENDING":
        return <span className="badge bg-info">En attente</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-5">Chargement...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Rendez-vous</h2>
          <button 
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Interface des onglets */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex gap-3 flex-wrap">
            {/* Onglet Demandes */}
            <button
              className={`btn ${activeTab === 'demandes' ? 'btn-warning' : 'btn-outline-warning'} position-relative`}
              onClick={() => setActiveTab('demandes')}
            >
              📋 Demandes en attente
              {stats.demandes > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {stats.demandes}
                </span>
              )}
            </button>
            
            {/* Onglet À venir */}
            <button
              className={`btn ${activeTab === 'a_venir' ? 'btn-primary' : 'btn-outline-primary'} position-relative`}
              onClick={() => setActiveTab('a_venir')}
            >
              📅 À venir
              {stats.aVenir > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info">
                  {stats.aVenir}
                </span>
              )}
            </button>
            
            {/* Onglet Historique */}
            <button
              className={`btn ${activeTab === 'historique' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setActiveTab('historique')}
            >
              ✅ Historique ({stats.historique})
            </button>
            
            {/* Onglet Annulés */}
            <button
              className={`btn ${activeTab === 'annules' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('annules')}
            >
              ❌ Annulés ({stats.annules})
            </button>
          </div>
        </div>
      </div>

      {rendezVous.length === 0 && !loading && (
        <div className="alert alert-info text-center">
          {activeTab === 'demandes' && '📭 Aucune demande en attente'}
          {activeTab === 'a_venir' && '📅 Aucun rendez-vous à venir'}
          {activeTab === 'historique' && '📋 Aucun rendez-vous terminé'}
          {activeTab === 'annules' && '❌ Aucun rendez-vous annulé'}
        </div>
      )}

      {rendezVous.length > 0 && (
        <div className="row">
          {rendezVous.map((rdv, index) => (
            <div key={`rdv-${rdv.numero || rdv.id || index}`} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    <FaUser className="me-2" />
                    {rdv.patient_nom}
                  </h5>
                  <p className="card-text">
                    <FaCalendarAlt className="me-2" />
                    {formatDate(rdv.date)}
                  </p>
                  <p className="card-text">
                    <FaClock className="me-2" />
                    {rdv.heure || '00:00'}
                  </p>
                  {rdv.description && (
                    <p className="card-text">{rdv.description}</p>
                  )}
                  <p className="card-text">
                    <strong>Type :</strong>{" "}
                    {rdv.type_consultation === "teleconsultation" ? (
                      <span className="badge bg-info">📹 Téléconsultation</span>
                    ) : (
                      <span className="badge bg-success">🏥 Au cabinet</span>
                    )}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    {getStatusBadge(rdv.statut)}
                    
                    {/* Boutons d'action selon le statut */}
                    {activeTab === 'demandes' && rdv.statut === 'PENDING' && (
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleConfirmer(rdv.numero || rdv.id)}
                        >
                          ✅ Confirmer
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAnnuler(rdv.numero || rdv.id)}
                        >
                          ❌ Refuser
                        </button>
                      </div>
                    )}

                    {activeTab === 'historique' && rdv.statut === 'CONFIRMED' && (
  <div className="d-flex gap-2">
    <button 
      className="btn btn-warning btn-sm"
      onClick={() => openRescheduleModal(rdv)}
    >
      📝 Reporter
    </button>
    <button 
      className="btn btn-danger btn-sm"
      onClick={() => handleAnnuler(rdv.numero || rdv.id)}
    >
      ❌ Annuler
    </button>

    {/* ✅ Bouton Téléconsultation réutilisable */}
    <DemarrerConsultationButton rdv={rdv} />
  </div>
)}


                    {activeTab === 'historique' && (
                      <span className="badge bg-success">✅ Terminé</span>
                    )}

                    {activeTab === 'annules' && (
                      <span className="badge bg-secondary">❌ Annulé</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reprogrammer le rendez-vous</h5>
                <button type="button" className="btn-close" onClick={closeRescheduleModal}></button>
              </div>
              <form onSubmit={handleRescheduleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Patient</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedAppointment?.patient_nom || ""}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nouvelle date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={rescheduleData.date || ""}
                      onChange={handleRescheduleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nouvelle heure</label>
                    <input
                      type="time"
                      className="form-control"
                      name="heure"
                      value={rescheduleData.heure || ""}
                      onChange={handleRescheduleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description (optionnelle)</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={rescheduleData.description || ""}
                      onChange={handleRescheduleChange}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeRescheduleModal}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Reprogrammer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RendezVous;