import React, { useState, useEffect } from "react";
import { doctorAPI } from "../services/api";

function MedecinGeneraliste() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter(
      (doctor) =>
        doctor.user.first_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        doctor.user.last_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (doctor.specialite &&
          doctor.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getDoctors();

      // Ensure we're working with an array
      let doctorsData = [];
      if (response && response.data) {
        doctorsData = Array.isArray(response.data) ? response.data : [];
      }

      // Filter for general practitioners only
      const generalists = doctorsData.filter(
        (doctor) =>
          !doctor.specialite ||
          doctor.specialite.toLowerCase() === "generaliste" ||
          doctor.specialite.toLowerCase() === "médecin généraliste"
      );
      setDoctors(generalists);
      setFilteredDoctors(generalists);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Médecins Généralistes</h2>

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher un médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <div className="col-lg-4 col-md-6 mb-4" key={doctor.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    Dr. {doctor.user.first_name} {doctor.user.last_name}
                  </h5>
                  {doctor.specialite && (
                    <p className="card-text">
                      <strong>Spécialité:</strong> {doctor.specialite}
                    </p>
                  )}
                  <p className="card-text">
                    <strong>Disponibilité:</strong>{" "}
                    {doctor.disponibilite ? (
                      <span className="text-success">Disponible</span>
                    ) : (
                      <span className="text-danger">Indisponible</span>
                    )}
                  </p>
                  <button className="btn btn-primary">
                    Prendre Rendez-vous
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center">Aucun médecin généraliste trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedecinGeneraliste;
