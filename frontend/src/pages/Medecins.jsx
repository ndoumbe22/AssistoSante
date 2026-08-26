import React, { useState, useEffect } from "react";
import { doctorAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

function Medecins() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    let filtered = doctors;

    // Filter by search term (name or specialty)
    if (searchTerm) {
      filtered = filtered.filter(
        (doctor) =>
          (doctor.user?.first_name &&
            doctor.user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doctor.user?.last_name &&
            doctor.user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doctor.specialite &&
            doctor.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by specialty
    if (specialtyFilter) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.specialite &&
          doctor.specialite.toLowerCase() === specialtyFilter.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  }, [searchTerm, specialtyFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorAPI.getDoctors();

      // Handle different response formats
      let doctorsData = [];
      if (response && response.data) {
        doctorsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        doctorsData = response;
      }

      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      // Set empty arrays to prevent rendering issues
      setDoctors([]);
      setFilteredDoctors([]);
    }
  };

  // Get unique specialties for filter dropdown
  const getSpecialties = () => {
    const specialties = [...new Set(doctors.map((doc) => doc.specialite))];
    return specialties.filter((spec) => spec);
  };

  return (
    <div className="container mt-5">
      {/* Navigation buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Liste des Médecins</h2>
        <div>
          <button 
            className="btn btn-outline-secondary me-2" 
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left me-1"></i> Retour
          </button>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => navigate("/")}
          >
            <i className="bi bi-house me-1"></i> Accueil
          </button>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher un médecin (nom ou spécialité)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-filter"></i>
            </span>
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
      </div>

      {/* Doctors list */}
      <div className="row">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <div className="col-lg-4 col-md-6 col-sm-12 mb-4" key={doctor.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    Dr. {doctor.user?.first_name || ''} {doctor.user?.last_name || ''}
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
            <div className="alert alert-info text-center">
              <i className="bi bi-info-circle me-2"></i>
              {searchTerm || specialtyFilter
                ? "Aucun médecin ne correspond à vos critères de recherche."
                : "Aucun médecin trouvé dans la base de données."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Medecins;