import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import RatingComponent from "./RatingComponent";
import { useAuth } from "../context/AuthContext";

function DoctorRating({ doctorId, onRatingSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userRating, setUserRating] = useState(null);
  const { user } = useAuth();

  // In a real implementation, you would fetch the user's existing rating
  // useEffect(() => {
  //   if (user && doctorId) {
  //     fetchUserRating();
  //   }
  // }, [user, doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setSubmitError("Veuillez sélectionner une note");
      return;
    }
    
    if (comment.trim().length < 10) {
      setSubmitError("Votre commentaire doit contenir au moins 10 caractères");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // In a real implementation, you would send the rating to the backend
      // const response = await api.post(`/doctors/${doctorId}/rating/`, {
      //   rating,
      //   comment
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      if (onRatingSubmit) {
        onRatingSubmit({ rating, comment });
      }
      
      // Reset form
      setRating(0);
      setComment("");
    } catch (error) {
      setSubmitError("Erreur lors de l'envoi de votre évaluation. Veuillez réessayer.");
      console.error("Erreur lors de l'envoi de l'évaluation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setSubmitSuccess(false);
  };

  if (!user || user.role !== "patient") {
    return (
      <div className="alert alert-info">
        Vous devez être connecté en tant que patient pour évaluer ce médecin.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5>Évaluer ce médecin</h5>
      </div>
      <div className="card-body">
        {submitSuccess ? (
          <div className="alert alert-success">
            <h5>Merci pour votre évaluation !</h5>
            <p>Votre avis a été enregistré avec succès.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setSubmitSuccess(false)}
            >
              Évaluer à nouveau
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="alert alert-danger">
                {submitError}
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label">Votre note</label>
              <div className="d-flex align-items-center">
                <RatingComponent 
                  initialRating={rating}
                  onRatingChange={handleRatingChange}
                  size="lg"
                />
                <span className="ms-2 fw-bold">{rating}/5</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Votre commentaire</label>
              <textarea
                className="form-control"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience avec ce médecin..."
              ></textarea>
              <div className="form-text">
                Minimum 10 caractères. Soyez respectueux dans vos commentaires.
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Envoi en cours...
                  </>
                ) : (
                  "Soumettre l'évaluation"
                )}
              </button>
              
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setRating(0);
                  setComment("");
                  setSubmitError("");
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DoctorRating;