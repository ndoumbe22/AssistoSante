import React from "react";
import { FaCalendarCheck, FaClock, FaTimesCircle, FaList, FaStar } from "react-icons/fa";
import RatingComponent from "./RatingComponent";

const RecentAppointmentsWidget = ({ appointments, onRateDoctor }) => {
  // Get all appointments and sort by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    // Convert date strings to Date objects for comparison
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // If dates are equal, sort by time
    if (dateA.getTime() === dateB.getTime()) {
      return a.heure.localeCompare(b.heure);
    }
    
    return dateB - dateA;
  });

  // Get the 3 most recent appointments
  const recentAppointments = sortedAppointments.slice(0, 3);

  // Function to get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "CONFIRMED":
        return { icon: <FaCalendarCheck />, className: "bg-success", text: "Confirmé" };
      case "PENDING":
        return { icon: <FaClock />, className: "bg-warning", text: "En attente" };
      case "CANCELLED":
        return { icon: <FaTimesCircle />, className: "bg-danger", text: "Annulé" };
      default:
        return { icon: <FaList />, className: "bg-secondary", text: status };
    }
  };

  if (recentAppointments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted mb-0">Aucun rendez-vous trouvé</p>
      </div>
    );
  }

  return (
    <div>
      {recentAppointments.map((app, index) => {
        const statusInfo = getStatusInfo(app.statut);
        
        return (
          <div key={app.id || index} className="mb-3 p-3 border rounded">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center">
                  <strong>{app.medecin_nom}</strong>
                  {app.rating && (
                    <span className="ms-2">
                      <RatingComponent 
                        initialRating={app.rating}
                        readonly={true}
                        size="sm"
                      />
                    </span>
                  )}
                </div>
                <div className="text-muted small">{app.specialite}</div>
                <div>{app.date} à {app.heure}</div>
              </div>
              <span className={`badge ${statusInfo.className}`}>
                {statusInfo.icon}
                <span className="ms-1">{statusInfo.text}</span>
              </span>
            </div>
            {!app.rating && app.statut === "CONFIRMED" && (
              <button 
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => onRateDoctor && onRateDoctor(app)}
              >
                <FaStar className="me-1" /> Noter
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecentAppointmentsWidget;