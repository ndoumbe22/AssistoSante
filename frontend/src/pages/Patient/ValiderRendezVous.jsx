import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCalendarCheck, FaStar, FaComment, FaPrescription } from "react-icons/fa";
import { appointmentAPI, patientAPI } from "../../services/api";
import RatingComponent from "../../components/RatingComponent";

function ValiderRendezVous() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointment(id);
      setAppointment(response.data);
    } catch (err) {
      setError("Erreur lors du chargement du rendez-vous");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const ratingData = {
        note: rating,
        commentaire: comment
      };
      
      await patientAPI.validateAppointment(id, ratingData);
      setSuccess(true);
    } catch (err) {
      setError("Erreur lors de la validation du rendez-vous: " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // Extract HH:MM
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card text-center p-5">
              <div className="text-success mb-3">
                <FaCalendarCheck size={60} />
              </div>
              <h2 className="text-success">Rendez-vous validé !</h2>
              <p className="lead">Merci d'avoir validé votre rendez-vous et laissé votre évaluation.</p>
              <p>Votre avis est précieux pour améliorer la qualité de nos services.</p>
              <div className="mt-4">
                <button className="btn btn-success me-2" onClick={() => navigate("/patient/rendez-vous")}>
                  Voir mes rendez-vous
                </button>
                <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <FaCalendarCheck className="me-2" />
            Valider le rendez-vous terminé
          </h2>
          
          {appointment && (
            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Détails du rendez-vous</h5>
                  </div>
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-4"><strong>Médecin:</strong></div>
                      <div className="col-8">Dr. {appointment.medecin_nom}</div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-4"><strong>Date:</strong></div>
                      <div className="col-88">{formatDate(appointment.date)}</div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-4"><strong>Heure:</strong></div>
                      <div className="col-8">{formatTime(appointment.heure)}</div>
                    </div>
                    {appointment.description && (
                      <div className="row mb-3">
                        <div className="col-4"><strong>Description:</strong></div>
                        <div className="col-8">{appointment.description}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <FaStar className="me-2" />
                      Évaluer la consultation
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                          {error}
                          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label className="form-label">Votre note</label>
                        <div className="d-flex align-items-center">
                          <RatingComponent 
                            initialRating={rating}
                            onRatingChange={setRating}
                            size="lg"
                          />
                          <span className="ms-3 fw-bold">{rating}/5</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label">
                          <FaComment className="me-1" />
                          Votre commentaire
                        </label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Partagez votre expérience avec ce médecin..."
                        ></textarea>
                        <div className="form-text">
                          Votre commentaire sera visible publiquement. Soyez respectueux dans vos commentaires.
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => navigate("/patient/rendez-vous")}
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-success"
                          disabled={submitting || rating === 0}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Validation en cours...
                            </>
                          ) : (
                            "Valider et noter"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <FaPrescription className="me-2" />
                      Documents de la consultation
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted">
                      Si une ordonnance ou d'autres documents ont été générés lors de cette consultation, 
                      ils seront disponibles ici après validation.
                    </p>
                    <div className="text-center py-3">
                      <FaPrescription size={40} className="text-muted" />
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Informations importantes</h5>
                  </div>
                  <div className="card-body">
                    <ul className="mb-0">
                      <li>Votre évaluation est anonyme</li>
                      <li>Les commentaires doivent être respectueux</li>
                      <li>Les évaluations aident les autres patients</li>
                      <li>Les médecins peuvent répondre aux évaluations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ValiderRendezVous;