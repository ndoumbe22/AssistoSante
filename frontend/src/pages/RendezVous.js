import React, { useState } from "react";

function RendezVous() {
  const [appointmentData, setAppointmentData] = useState({
    patient: "",
    medecin: "",
    date: "",
    heure: "",
    description: "",
  });

  const handleChange = (e) => {
    setAppointmentData({
      ...appointmentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send data to the Django API
    alert("Rendez-vous pris avec succès!");
    // Reset form
    setAppointmentData({
      patient: "",
      medecin: "",
      date: "",
      heure: "",
      description: "",
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Prendre un Rendez-vous</h2>

      <div className="row">
        <div className="col-lg-6 mx-auto">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="patient" className="form-label">
                    Patient
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="patient"
                    name="patient"
                    value={appointmentData.patient}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="medecin" className="form-label">
                    Médecin
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="medecin"
                    name="medecin"
                    value={appointmentData.medecin}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="date" className="form-label">
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    name="date"
                    value={appointmentData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="heure" className="form-label">
                    Heure
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="heure"
                    name="heure"
                    value={appointmentData.heure}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={appointmentData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Prendre Rendez-vous
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RendezVous;
