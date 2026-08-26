import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaCheck, FaTimes, FaRedo, FaFilter, FaChartBar } from "react-icons/fa";
import { adminService } from "../../services/adminService";
import { appointmentAPI } from "../../services/api";

function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: "", heure: "" });
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadStatistics();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [searchTerm, filterStatus, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAppointments();
      setAppointments(response.data);
      
      // Refresh statistics after loading appointments
      loadStatistics();
    } catch (err) {
      setError("Erreur lors du chargement des rendez-vous: " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await adminService.getAppointmentStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(appointment => appointment.statut === filterStatus);
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.patient_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.medecin_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.date.includes(searchTerm)
      );
    }
    
    // Sort by date and time (closest future date first)
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.heure}`);
      const dateB = new Date(`${b.date}T${b.heure}`);
      return dateA - dateB;
    });

    setFilteredAppointments(filtered);
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
      case "TERMINE":
        return <span className="badge bg-secondary">Terminé</span>;
      default:
        return <span className="badge bg-light">{status}</span>;
    }
  };

  const handleValidate = async (appointmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir valider ce rendez-vous ?")) {
      try {
        await adminService.validateAppointment(appointmentId);
        loadAppointments(); // This will also refresh statistics
        alert("Rendez-vous validé avec succès");
      } catch (err) {
        alert("Erreur lors de la validation: " + (err.response?.data?.error || err.message));
        console.error(err);
      }
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      try {
        await adminService.cancelAppointment(appointmentId);
        loadAppointments(); // This will also refresh statistics
        alert("Rendez-vous annulé avec succès");
      } catch (err) {
        alert("Erreur lors de l'annulation: " + (err.response?.data?.error || err.message));
        console.error(err);
      }
    }
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleData({ date: appointment.date, heure: appointment.heure });
    setShowRescheduleModal(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await adminService.rescheduleAppointment(selectedAppointment.id, rescheduleData);
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleData({ date: "", heure: "" });
      loadAppointments(); // This will also refresh statistics
      alert("Rendez-vous reprogrammé avec succès");
    } catch (err) {
      alert("Erreur lors de la reprogrammation: " + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Gestion des Rendez-vous
              </h2>
              <button 
                className="btn btn-outline-secondary btn-sm mt-2"
                onClick={() => window.history.back()}
              >
                ← Retour
              </button>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5 className="card-title">Total</h5>
                    <h2>{statistics.total_appointments}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5 className="card-title">Confirmés</h5>
                    <h2>{statistics.confirmed_appointments}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <h5 className="card-title">En attente</h5>
                    <h2>{statistics.pending_appointments}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h5 className="card-title">Aujourd'hui</h5>
                    <h2>{statistics.today_appointments}</h2>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par patient, médecin ou date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="CANCELLED">Annulé</option>
                <option value="RESCHEDULED">Reprogrammé</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary w-100" onClick={loadAppointments}>
                <FaRedo className="me-2" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="alert alert-info text-center">
              <FaCalendarAlt size={30} className="mb-2" />
              <h4>Aucun rendez-vous trouvé</h4>
              <p>Il n'y a aucun rendez-vous correspondant à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.patient_nom}</td>
                      <td>{appointment.medecin_nom}</td>
                      <td>{formatDate(appointment.date)}</td>
                      <td>{appointment.heure}</td>
                      <td>{getStatusBadge(appointment.statut)}</td>
                      <td>
                        <div className="btn-group" role="group">
                          {appointment.statut === "CONFIRMED" && (
                            <button
                              className="btn btn-success btn-sm me-1"
                              onClick={() => handleValidate(appointment.id)}
                              title="Valider"
                            >
                              <FaCheck />
                            </button>
                          )}
                          {appointment.statut !== "CANCELLED" && appointment.statut !== "TERMINE" && (
                            <button
                              className="btn btn-danger btn-sm me-1"
                              onClick={() => handleCancel(appointment.id)}
                              title="Annuler"
                            >
                              <FaTimes />
                            </button>
                          )}
                          {appointment.statut !== "TERMINE" && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => openRescheduleModal(appointment)}
                              title="Reprogrammer"
                            >
                              <FaRedo />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={rescheduleData.date}
                      onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Heure</label>
                    <input
                      type="time"
                      className="form-control"
                      value={rescheduleData.heure}
                      onChange={(e) => setRescheduleData({...rescheduleData, heure: e.target.value})}
                      required
                    />
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

export default AppointmentManagement;