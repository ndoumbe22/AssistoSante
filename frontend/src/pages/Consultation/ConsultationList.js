import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { rendezVousAPI } from "../../services/api";
import { toast } from "react-toastify";
import { FaUser, FaCalendarAlt, FaClock, FaFileMedical } from "react-icons/fa";

function ConsultationListe() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charge les rendez-vous confirmés du médecin
  const chargerConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rendezVousAPI.mesRendezVousMedecin();
      const tousLesRdv = Array.isArray(response) ? response : (response.data || []);

      // Filtrer uniquement ceux confirmés
      const rdvsConfirms = tousLesRdv.filter(rdv => rdv.statut === "CONFIRMED");

      // Trier par date proche en premier
      rdvsConfirms.sort((a, b) => new Date(a.date) - new Date(b.date));

      setRdvs(rdvsConfirms);
    } catch (err) {
      console.error("Erreur chargement consultations :", err);
      setError("Impossible de charger les consultations confirmées");
      toast.error("Erreur lors du chargement des consultations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerConsultations();
  }, [chargerConsultations]);

  const handleRedigerConsultation = (rdv) => {
  // Redirige vers la page ConsultationPage avec le rendez-vous dans state
  navigate(`/consultations`, { state: { rdv } });
};


  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("fr-FR");

  if (loading) return <div className="text-center py-5">Chargement...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (rdvs.length === 0) return <div className="alert alert-info text-center">Aucune consultation confirmée.</div>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Consultations à rédiger</h2>
      <div className="row">
        {rdvs.map((rdv, idx) => (
          <div key={rdv.numero || idx} className="col-md-6 mb-3">
            <div className="card shadow-sm">
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
                  {rdv.heure || "00:00"}
                </p>
                <button
                  className="btn btn-primary w-100 mt-2"
                  onClick={() => handleRedigerConsultation(rdv)}
                >
                  <FaFileMedical className="me-1" />
                  Rédiger consultation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConsultationListe;
