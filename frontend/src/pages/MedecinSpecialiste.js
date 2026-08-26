import React, { useState, useEffect } from "react";
import { doctorAPI } from "../services/api";

function MedecinSpecialiste() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.user.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doctor.user.last_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doctor.specialite.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.specialite.toLowerCase() === specialtyFilter.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  }, [searchTerm, specialtyFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getDoctors();

      // Ensure we're working with an array
      let doctorsData = [];
      if (response && response.data) {
        doctorsData = Array.isArray(response.data) ? response.data : [];
      }

      // Filter for specialists only
      const specialists = doctorsData.filter(
        (doctor) =>
          doctor.specialite && doctor.specialite.toLowerCase() !== "generaliste"
      );
      setDoctors(specialists);
      setFilteredDoctors(specialists);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Get unique specialties for filter dropdown
  const getSpecialties = () => {
    const specialties = [...new Set(doctors.map((doc) => doc.specialite))];
    return specialties.filter(
      (spec) => spec && spec.toLowerCase() !== "generaliste"
    );
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Médecins Spécialistes</h2>

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
        <div className="col-md-6">
          <select
            className="form-control"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Toutes les spécialités</option>
            {getSpecialties().map((specialty, index) => (
              <option key={index} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
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
                  <p className="card-text">
                    <strong>Spécialité:</strong> {doctor.specialite}
                  </p>
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
            <p className="text-center">Aucun médecin spécialiste trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedecinSpecialiste;
