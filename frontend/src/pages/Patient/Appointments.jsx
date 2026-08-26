import React, { useState, useEffect } from "react";
import { patientAPI } from "../../services/api";
import { FaCalendarAlt, FaHistory, FaRedo, FaCheck, FaTimes, FaClock, FaFilter } from "react-icons/fa";

function Appointments() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    new_date: "",
    new_heure: "",
    reason: ""
  });
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      if (activeTab === "upcoming") {
        const response = await patientAPI.getAppointments();
        setUpcomingAppointments(response.data);
      } else {
        const response = await patientAPI.getAppointmentHistory();
        setPastAppointments(response.data);
      }
    } catch (err) {
      setError("Erreur lors du chargement des rendez-vous");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await patientAPI.proposeReschedule(selectedAppointment.id, rescheduleData);
      setShowRescheduleModal(false);
      setRescheduleData({ new_date: "", new_heure: "", reason: "" });
      loadAppointments();
    } catch (err) {
      setError("Erreur lors de la proposition de reprogrammation");
      console.error(err);
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

  // Filter appointments based on status and sort by date/time
  const filterAndSortAppointments = (appointments) => {
    let filtered = appointments;
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(appointment => appointment.statut === filterStatus);
    }
    
    // Sort by date and time (closest future date first)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.heure}`);
      const dateB = new Date(`${b.date}T${b.heure}`);
      return dateA - dateB;
    });
    
    return filtered;
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
          <h2>Mes Rendez-vous</h2>
          <button 
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>
        </div>
        
        <ul className="nav nav-tabs mb-0">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              <FaCalendarAlt className="me-1" />
              À venir
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <FaHistory className="me-1" />
              Historique
            </button>
          </li>
        </ul>
      </div>

      {/* Status Filter */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <FaFilter />
            </span>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="RESCHEDULED">Reprogrammé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {activeTab === "upcoming" && (
        <div>
          {filterAndSortAppointments(upcomingAppointments).length === 0 ? (
            <div className="alert alert-info">Aucun rendez-vous à venir.</div>
          ) : (
            <div className="row">
              {filterAndSortAppointments(upcomingAppointments).map((appointment) => (
                <div key={appointment.id} className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">
                        Dr. {appointment.medecin_nom}
                      </h5>
                      <p className="card-text">
                        <FaCalendarAlt className="me-2" />
                        {formatDate(appointment.date)}
                      </p>
                      <p className="card-text">
                        <FaClock className="me-2" />
                        {appointment.heure}
                      </p>
                      {appointment.description && (
                        <p className="card-text">{appointment.description}</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        {getStatusBadge(appointment.statut)}
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowRescheduleModal(true);
                          }}
                        >
                          <FaRedo className="me-1" />
                          Reprogrammer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {filterAndSortAppointments(pastAppointments).length === 0 ? (
            <div className="alert alert-info">Aucun rendez-vous dans l'historique.</div>
          ) : (
            <div className="row">
              {filterAndSortAppointments(pastAppointments).map((appointment) => (
                <div key={appointment.id} className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">
                        Dr. {appointment.medecin_nom}
                      </h5>
                      <p className="card-text">
                        <FaCalendarAlt className="me-2" />
                        {formatDate(appointment.date)}
                      </p>
                      <p className="card-text">
                        <FaClock className="me-2" />
                        {appointment.heure}
                      </p>
                      {appointment.description && (
                        <p className="card-text">{appointment.description}</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        {getStatusBadge(appointment.statut)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reprogrammer le rendez-vous</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRescheduleModal(false)}
                ></button>
              </div>
              <form onSubmit={handleReschedule}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nouvelle date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={rescheduleData.new_date}
                      onChange={(e) => setRescheduleData({...rescheduleData, new_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nouvelle heure</label>
                    <input
                      type="time"
                      className="form-control"
                      value={rescheduleData.new_heure}
                      onChange={(e) => setRescheduleData({...rescheduleData, new_heure: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Raison</label>
                    <textarea
                      className="form-control"
                      value={rescheduleData.reason}
                      onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRescheduleModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Proposer
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

export default Appointments;