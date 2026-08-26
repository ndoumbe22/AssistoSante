import React, { useState, useEffect } from "react";
import { FaPills, FaCheck } from "react-icons/fa";
import medicationService from "../services/medicationService";

function MedicationTodayWidget() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTodayMedications();
  }, []);

  const loadTodayMedications = async () => {
    try {
      setLoading(true);
      // Get all medication reminders
      const reminders = await medicationService.getReminders();
      
      // Filter for today's medications (this would be enhanced with actual logic)
      // For now, we'll show all active reminders as examples
      const todayMeds = reminders.filter(reminder => reminder.actif);
      
      setMedications(todayMeds);
    } catch (err) {
      setError("Erreur lors du chargement des médicaments: " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (reminderId) => {
    try {
      await medicationService.markTaken(reminderId, "Pris via widget dashboard");
      // Refresh the list
      loadTodayMedications();
    } catch (err) {
      alert("Erreur lors de la mise à jour: " + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const getTimeUntilNextDose = (heure_rappel) => {
    if (!heure_rappel) return "Heure non définie";
    
    const now = new Date();
    const [hours, minutes] = heure_rappel.split(':');
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If the reminder time has passed today, show it as past due
    if (reminderTime < now) {
      const diffMs = now - reminderTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `En retard de ${diffHours}h${diffMinutes.toString().padStart(2, '0')}`;
    } else {
      const diffMs = reminderTime - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Dans ${diffHours}h${diffMinutes.toString().padStart(2, '0')}`;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="card-title d-flex align-items-center">
            <FaPills className="me-2" />
            Médicaments aujourd'hui
          </h5>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="card-title d-flex align-items-center">
            <FaPills className="me-2" />
            Médicaments aujourd'hui
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title d-flex align-items-center">
          <FaPills className="me-2" />
          Médicaments aujourd'hui
        </h5>
      </div>
      <div className="card-body">
        {medications.length === 0 ? (
          <p className="text-muted text-center">
            Aucun médicament prévu pour aujourd'hui
          </p>
        ) : (
          <div className="list-group">
            {medications.slice(0, 3).map((med) => (
              <div key={med.id} className="list-group-item border-0 px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold">{med.medicament}</div>
                    <div className="small text-muted">
                      {med.dosage} - {med.heure_rappel}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="small text-primary">
                      {getTimeUntilNextDose(med.heure_rappel)}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-success mt-1"
                      onClick={() => handleMarkTaken(med.id)}
                    >
                      <FaCheck size={12} className="me-1" />
                      Pris
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {medications.length > 3 && (
              <div className="text-center mt-2">
                <span className="text-muted small">
                  + {medications.length - 3} autres médicaments
                </span>
              </div>
            )}
          </div>
        )}
        <div className="mt-3">
          <button 
            className="btn btn-primary w-100"
            onClick={() => window.location.hash = "/patient/medication-reminders"}
          >
            Voir tous les médicaments
          </button>
        </div>
      </div>
    </div>
  );
}

export default MedicationTodayWidget;