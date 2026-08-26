import React, { useState, useEffect } from "react";
import { rendezVousAPI } from '../../services/api';
import { toast } from 'react-toastify';

function RendezVousMedecin() {
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");

  // Filter appointments based on status and sort by date/time
  const filterAndSortAppointments = (appointments) => {
    let filtered = appointments;
    
    // Apply status filter
    if (filter === 'en_attente') {
      filtered = filtered.filter(rdv => rdv.statut === 'PENDING');
    } else if (filter === 'confirmé') {
      filtered = filtered.filter(rdv => rdv.statut === 'CONFIRMED');
    } else if (filter === 'reporté') {
      filtered = filtered.filter(rdv => rdv.statut === 'RESCHEDULED');
    } else if (filter === 'annulé') {
      filtered = filtered.filter(rdv => rdv.statut === 'CANCELLED');
    }
    // For 'tous', we show all appointments
    
    // Sort by date and time (closest future date first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_rdv || `${a.date}T${a.heure}`);
      const dateB = new Date(b.date_rdv || `${b.date}T${b.heure}`);
      return dateA - dateB;
    });
    
    return filtered;
  };

  // Charger les demandes de rendez-vous
  const chargerDemandes = async () => {
    try {
      setLoading(true);
      console.log('📄 Chargement RDV médecin...', {filter});
      
      let rdvs = [];
      
      if (filter === 'en_attente') {
        // Demandes PENDING uniquement
        console.log('🔍 Appel mesDemandes()...');
        const response = await rendezVousAPI.mesDemandes();
        console.log('✅ Réponse mesDemandes:', response);
        // The mesDemandes API returns an object with a 'demandes' property
        rdvs = response.demandes || response.data || response || [];
        
      } else {
        // TOUS les RDV du médecin
        console.log('🔍 Appel mesRendezVousMedecin()...');
        const response = await rendezVousAPI.mesRendezVousMedecin();
        console.log('✅ Réponse mesRendezVousMedecin:', response);
        
        // The mesRendezVousMedecin API returns a direct array
        rdvs = Array.isArray(response) ? response : (response.data || []);
        
        console.log('📊 RDV bruts récupérés:', rdvs.length);
      }
      
      console.log('🎯 RDV finaux à afficher:', rdvs);
      // Ensure we always set an array
      setRendezVous(Array.isArray(rdvs) ? rdvs : []);
      
    } catch (error) {
      console.error('❌ Erreur chargement RDV:', error);
      console.error('❌ Détails:', error.response?.data);
      toast.error('Erreur lors du chargement des rendez-vous: ' + (error.response?.data?.error || error.message));
      // Always set an empty array on error
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDemandes();
  }, [filter]);

  // Confirmer un rendez-vous
  const handleConfirmer = async (rdvId) => {
    try {
      console.log('✅ Confirmation RDV:', rdvId);
      
      await rendezVousAPI.confirmer(rdvId);
      
      toast.success('Rendez-vous confirmé avec succès');
      
      // Recharger la liste
      chargerDemandes();
      
    } catch (error) {
      console.error('❌ Erreur confirmation:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };

  // Annuler un rendez-vous
  const handleAnnuler = async (rdvId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }
    
    try {
      console.log('❌ Annulation RDV:', rdvId);
      
      await rendezVousAPI.annuler(rdvId);
      
      toast.success('Rendez-vous annulé avec succès');
      
      // Recharger la liste
      chargerDemandes();
      
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };
  console.log('🔍 Type consultation:', rdv.type_consultation);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Mes Rendez-vous</h2>
          <button 
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>
        </div>
        
        {/* FILTRES */}
        <div className="btn-group" role="group">
          <button
            className={`btn ${filter === 'en_attente' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('en_attente')}
          >
            En attente ({rendezVous.filter(d => d.statut === 'PENDING').length})
          </button>
          <button
            className={`btn ${filter === 'confirmé' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setFilter('confirmé')}
          >
            Confirmés ({rendezVous.filter(d => d.statut === 'CONFIRMED').length})
          </button>
          <button
            className={`btn ${filter === 'reporté' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setFilter('reporté')}
          >
            Reportés ({rendezVous.filter(d => d.statut === 'RESCHEDULED').length})
          </button>
          <button
            className={`btn ${filter === 'annulé' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setFilter('annulé')}
          >
            Annulés ({rendezVous.filter(d => d.statut === 'CANCELLED').length})
          </button>
          <button
            className={`btn ${filter === 'tous' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('tous')}
          >
            Tous ({rendezVous.length})
          </button>
        </div>
      </div>
      
      {/* LOADING */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      )}
      
      {/* LISTE DES RDV */}
      {!loading && filterAndSortAppointments(rendezVous).length === 0 && (
        <div className="alert alert-info">
          Aucun rendez-vous à afficher
        </div>
      )}
      
      {!loading && filterAndSortAppointments(rendezVous).length > 0 && (
        <div className="row">
          {filterAndSortAppointments(rendezVous).map((rdv) => (
            <div key={rdv.numero || rdv.id} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">
                      {rdv.patient_nom || 'Patient'}
                    </h5>
                    <span className={`badge ${
                      rdv.statut === 'PENDING' ? 'bg-warning' :
                      rdv.statut === 'CONFIRMED' ? 'bg-success' :
                      rdv.statut === 'RESCHEDULED' ? 'bg-warning' :
                      rdv.statut === 'CANCELLED' ? 'bg-danger' :
                      'bg-secondary'
                    }`}>
                      {rdv.statut === 'PENDING' ? 'En attente' :
                       rdv.statut === 'CONFIRMED' ? 'Confirmé' :
                       rdv.statut === 'RESCHEDULED' ? 'Reporté' :
                       rdv.statut === 'CANCELLED' ? 'Annulé' :
                       rdv.statut}
                    </span>
                  </div>
                  
                  <p className="card-text">
                    <strong>📅 Date :</strong> {new Date(rdv.date_rdv || `${rdv.date}T${rdv.heure}`).toLocaleString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  <p className="card-text">
                    <strong>📝 Motif :</strong> {rdv.motif_consultation || rdv.description || 'Non spécifié'}
                  </p>
                  
                  <p className="card-text">
                    <strong>🏥 Type :</strong> {
                      rdv.type_consultation === 'teleconsultation' ? 'Téléconsultation' : 'Au cabinet'
                    }
                  </p>
                  
                  {/* ACTIONS */}
                  {rdv.statut === 'PENDING' && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-success btn-sm flex-fill"
                        onClick={() => handleConfirmer(rdv.numero || rdv.id)}
                      >
                        ✅ Confirmer
                      </button>
                      <button
                        className="btn btn-danger btn-sm flex-fill"
                        onClick={() => handleAnnuler(rdv.numero || rdv.id)}
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  )}
                  
                  {rdv.statut === 'CONFIRMED' && (
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => handleAnnuler(rdv.numero || rdv.id)}
                      >
                        ❌ Annuler ce rendez-vous
                      </button>
                    </div>
                  )}
                  
                  {rdv.statut === 'RESCHEDULED' && (
                    <div className="mt-3">
                      <button
                        className="btn btn-success btn-sm w-100"
                        onClick={() => handleConfirmer(rdv.numero || rdv.id)}
                      >
                        ✅ Confirmer le nouveau créneau
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RendezVousMedecin;