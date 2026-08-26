import React, { useState, useEffect } from "react";
import { appointmentAPI } from "../../services/api";
import { FaUserMd, FaCalendarAlt, FaClock, FaCheck, FaTimes } from "react-icons/fa";

function AppointmentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointments();
      
      // Ensure we're working with an array
      let appointmentsData = [];
      if (response && response.data) {
        appointmentsData = Array.isArray(response.data) ? response.data : [];
      }
      
      // Filter for pending appointments
      const pendingAppointments = appointmentsData.filter(app => app.statut === "PENDING");
      setRequests(pendingAppointments);
    } catch (err) {
      setError("Erreur lors du chargement des demandes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const response = await appointmentAPI.updateAppointment(id, { statut: "CONFIRMED" });
      setRequests(requests.filter(req => req.id !== id));
      // Show success message
      alert("Rendez-vous confirmé avec succès !");
    } catch (err) {
      console.error("Error accepting appointment:", err);
      let errorMessage = "Erreur lors de l'acceptation du rendez-vous";
      
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          errorMessage += ": " + err.response.data.error;
        } else if (err.response.data && err.response.data.detail) {
          errorMessage += ": " + err.response.data.detail;
        } else if (err.response.status) {
          errorMessage += " (Code: " + err.response.status + ")";
        }
      } else if (err.message) {
        errorMessage += ": " + err.message;
      }
      
      setError(errorMessage);
      console.error(err);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await appointmentAPI.updateAppointment(id, { statut: "CANCELLED" });
      setRequests(requests.filter(req => req.id !== id));
      // Show success message
      alert("Rendez-vous annulé avec succès !");
    } catch (err) {
      console.error("Error rejecting appointment:", err);
      let errorMessage = "Erreur lors du rejet du rendez-vous";
      
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          errorMessage += ": " + err.response.data.error;
        } else if (err.response.data && err.response.data.detail) {
          errorMessage += ": " + err.response.data.detail;
        } else if (err.response.status) {
          errorMessage += " (Code: " + err.response.status + ")";
        }
      } else if (err.message) {
        errorMessage += ": " + err.message;
      }
      
      setError(errorMessage);
      console.error(err);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="text-center py-5">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger alert-dismissible fade show" role="alert">
        Erreur: {error}
        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h2>Demandes de Rendez-vous</h2>
      {requests.length === 0 ? (
        <div className="alert alert-info">Aucune demande de rendez-vous en attente.</div>
      ) : (
        <div className="row">
          {requests.map((request) => (
            <div key={request.id} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    <FaUserMd className="me-2" />
                    {request.patient_nom}
                  </h5>
                  <p className="card-text">
                    <FaCalendarAlt className="me-2" />
                    {formatDate(request.date)}
                  </p>
                  <p className="card-text">
                    <FaClock className="me-2" />
                    {request.heure}
                  </p>
                  {request.description && (
                    <p className="card-text">{request.description}</p>
                  )}
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-success me-2"
                      onClick={() => handleAccept(request.id)}
                    >
                      <FaCheck className="me-1" />
                      Accepter
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(request.id)}
                    >
                      <FaTimes className="me-1" />
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentRequests;