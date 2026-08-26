import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { FaCalendarCheck, FaClock, FaTimesCircle, FaList } from "react-icons/fa";
import { patientAPI } from "../services/api";
import "react-calendar/dist/Calendar.css";
import "../styles/PatientCalendar.css";

const PatientCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, confirmed, pending, cancelled
  const [view, setView] = useState("month"); // month, week, day

  // Load appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Fetch both upcoming and history appointments
        const [upcomingResponse, historyResponse] = await Promise.all([
          patientAPI.getAppointments(),
          patientAPI.getAppointmentHistory()
        ]);
        
        const allAppointments = [
          ...(upcomingResponse.data || []), 
          ...(historyResponse.data || [])
        ];
        
        setAppointments(allAppointments);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des rendez-vous :", err);
        setError("Erreur lors du chargement des rendez-vous");
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(app => {
    if (filter === "all") return true;
    return app.statut && app.statut.toLowerCase() === filter;
  });

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    // Normalize the date to YYYY-MM-DD format for comparison
    const dateString = date.toISOString().split('T')[0];
    
    return filteredAppointments.filter(app => {
      // Handle different date formats that might come from the API
      if (typeof app.date === 'string') {
        if (app.date.includes('/')) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const parts = app.date.split('/');
          const normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          return normalizedDate === dateString;
        } else if (app.date.includes('-')) {
          // Already in YYYY-MM-DD format
          return app.date === dateString;
        } else {
          // Try to parse as date string
          try {
            const appDate = new Date(app.date);
            const appDateString = appDate.toISOString().split('T')[0];
            return appDateString === dateString;
          } catch (e) {
            return false;
          }
        }
      } else if (app.date instanceof Date) {
        const appDateString = app.date.toISOString().split('T')[0];
        return appDateString === dateString;
      }
      return false;
    });
  };

  // Get tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateAppointments = getAppointmentsForDate(date);
      if (dateAppointments.length > 0) {
        return (
          <div className="appointment-indicators">
            {dateAppointments.slice(0, 3).map((app, index) => (
              <div 
                key={index} 
                className={`indicator indicator-${app.statut.toLowerCase()}`}
                title={`${app.medecin_nom} - ${app.heure}`}
              />
            ))}
            {dateAppointments.length > 3 && (
              <div className="more-indicator">+{dateAppointments.length - 3}</div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Get tile class name for styling
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateAppointments = getAppointmentsForDate(date);
      if (dateAppointments.length > 0) {
        // Check if any appointment is confirmed
        const hasConfirmed = dateAppointments.some(app => app.statut === "CONFIRMED");
        const hasPending = dateAppointments.some(app => app.statut === "PENDING");
        const hasCancelled = dateAppointments.some(app => app.statut === "CANCELLED");
        
        if (hasConfirmed) return "has-confirmed-appointments";
        if (hasPending) return "has-pending-appointments";
        if (hasCancelled) return "has-cancelled-appointments";
      }
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateInput) => {
    let date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      if (dateInput.includes('/')) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const parts = dateInput.split('/');
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        // Assume it's in a format that Date can parse
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="calendar-loading">Chargement du calendrier...</div>;
  }

  if (error) {
    return <div className="calendar-error">Erreur: {error}</div>;
  }

  // Get appointments for currently selected date
  const selectedDateAppointments = getAppointmentsForDate(date);

  return (
    <div className="patient-calendar-container">
      <div className="calendar-header">
        <h3>
          <FaCalendarCheck className="me-2" />
          Calendrier des Rendez-vous
        </h3>
        
        <div className="calendar-controls">
          <div className="filter-buttons">
            <button 
              className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setFilter("all")}
            >
              <FaList className="me-1" /> Tous
            </button>
            <button 
              className={`btn btn-sm ${filter === "confirmed" ? "btn-success" : "btn-outline-secondary"}`}
              onClick={() => setFilter("confirmed")}
            >
              <FaCalendarCheck className="me-1" /> Confirmés
            </button>
            <button 
              className={`btn btn-sm ${filter === "pending" ? "btn-warning" : "btn-outline-secondary"}`}
              onClick={() => setFilter("pending")}
            >
              <FaClock className="me-1" /> En attente
            </button>
            <button 
              className={`btn btn-sm ${filter === "cancelled" ? "btn-danger" : "btn-outline-secondary"}`}
              onClick={() => setFilter("cancelled")}
            >
              <FaTimesCircle className="me-1" /> Annulés
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        <div className="calendar-section">
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="fr-FR"
            className="custom-calendar"
          />
        </div>

        <div className="appointments-section">
          <h5>
            Rendez-vous du {formatDate(date)}
            {selectedDateAppointments.length > 0 && (
              <span className="badge bg-primary ms-2">
                {selectedDateAppointments.length}
              </span>
            )}
          </h5>

          {selectedDateAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>Aucun rendez-vous pour cette date.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {selectedDateAppointments.map((app, index) => (
                <div key={index} className="appointment-card">
                  <div className="appointment-time">
                    <strong>{app.heure}</strong>
                  </div>
                  <div className="appointment-details">
                    <div className="doctor-info">
                      <h6>{app.medecin_nom}</h6>
                      <p className="text-muted">{app.specialite}</p>
                    </div>
                    <div className="appointment-status">
                      <span className={`badge ${
                        app.statut === "CONFIRMED" ? "bg-success" :
                        app.statut === "PENDING" ? "bg-warning" :
                        app.statut === "CANCELLED" ? "bg-danger" :
                        "bg-secondary"
                      }`}>
                        {app.statut === "CONFIRMED" ? "Confirmé" :
                         app.statut === "PENDING" ? "En attente" :
                         app.statut === "CANCELLED" ? "Annulé" :
                         app.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCalendar;