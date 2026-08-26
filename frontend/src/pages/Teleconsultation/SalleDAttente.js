import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { teleconsultationAPI, consultationAPI } from "../../services/api";
import { toast } from "react-toastify";
import {
  FaUserMd,
  FaUser,
  FaFileMedical,
  FaClock,
  FaPhone,
} from "react-icons/fa";
import "./SalleDAttente.css";

function SalleDAttente() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State variables
  const [consultation, setConsultation] = useState(null);
  const [teleconsultation, setTeleconsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Check user role
  useEffect(() => {
    if (user) {
      setIsDoctor(user.role === "medecin");
      setIsPatient(user.role === "patient");
    }
  }, [user]);

  // Load consultation details
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load consultation
        const consultationResponse = await consultationAPI.getConsultation(
          consultationId
        );
        setConsultation(consultationResponse.data);

        // Try to load existing teleconsultation
        try {
          const teleconsultationResponse =
            await teleconsultationAPI.getByConsultation(consultationId);
          setTeleconsultation(teleconsultationResponse.data);
        } catch (err) {
          // No existing teleconsultation, that's fine
          console.log("No existing teleconsultation found");
        }

        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement de la consultation");
        toast.error("Erreur lors du chargement de la consultation");
        setLoading(false);
      }
    };

    if (consultationId) {
      loadData();
    }
  }, [consultationId]);

  // Create teleconsultation
  const handleCreateTeleconsultation = async () => {
    try {
      setIsCreating(true);
      const response = await teleconsultationAPI.create({
        consultation: consultationId,
      });
      setTeleconsultation(response.data);
      toast.success("Téléconsultation créée avec succès");
    } catch (err) {
      console.error("Error creating teleconsultation:", err);
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(
          "Erreur lors de la création de la téléconsultation: " +
            err.response.data.error
        );
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.detail
      ) {
        toast.error(
          "Erreur lors de la création de la téléconsultation: " +
            err.response.data.detail
        );
      } else {
        toast.error(
          "Erreur lors de la création de la téléconsultation: " +
            (err.message || "Erreur inconnue")
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Join teleconsultation
  const handleJoinTeleconsultation = () => {
    if (teleconsultation) {
      navigate(`/teleconsultation/${teleconsultation.id}`);
    }
  };

  if (loading) {
    return (
      <div className="salle-d-attente">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de la salle d'attente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salle-d-attente">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="salle-d-attente">
      {/* Header */}
      <div className="salle-header">
        <div className="header-info">
          <h2>Salle d'attente virtuelle</h2>
          <div className="consultation-details">
            <div className="detail-item">
              <FaUserMd className="detail-icon" />
              <span>
                {isDoctor
                  ? `${consultation?.patient?.user?.first_name} ${consultation?.patient?.user?.last_name}`
                  : `Dr. ${consultation?.medecin?.user?.first_name} ${consultation?.medecin?.user?.last_name}`}
              </span>
            </div>
            <div className="detail-item">
              <FaFileMedical className="detail-icon" />
              <span>
                {consultation?.date} à {consultation?.heure}
              </span>
            </div>
            <div className="detail-item">
              <FaClock className="detail-icon" />
              <span>En attente de connexion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="salle-content">
        <div className="waiting-area">
          <div className="waiting-card">
            <div className="participant-info">
              <div className="participant-avatar">
                {isDoctor ? <FaUser /> : <FaUserMd />}
              </div>
              <div className="participant-details">
                <h3>
                  {isDoctor
                    ? `${consultation?.patient?.user?.first_name} ${consultation?.patient?.user?.last_name}`
                    : `Dr. ${consultation?.medecin?.user?.first_name} ${consultation?.medecin?.user?.last_name}`}
                </h3>
                <p className="participant-role">
                  {isDoctor ? "Patient" : "Médecin"}
                </p>
                <div className="status-indicator online">
                  <span className="status-dot"></span>
                  <span>En ligne</span>
                </div>
              </div>
            </div>

            <div className="waiting-actions">
              {!teleconsultation ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCreateTeleconsultation}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Création en cours...
                    </>
                  ) : (
                    "Créer la téléconsultation"
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleJoinTeleconsultation}
                >
                  <FaPhone className="me-2" />
                  Rejoindre la téléconsultation
                </button>
              )}

              <button
                className="btn btn-outline-secondary btn-lg"
                onClick={() => navigate(-1)}
              >
                Retour
              </button>
            </div>
          </div>

          <div className="info-section">
            <h4>Instructions</h4>
            <ul className="instructions-list">
              <li>
                Assurez-vous que votre caméra et votre microphone fonctionnent
                correctement
              </li>
              <li>Trouvez un endroit calme et bien éclairé</li>
              <li>Préparez les informations médicales pertinentes</li>
              <li>
                La téléconsultation commencera dès que les deux participants
                seront connectés
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalleDAttente;
