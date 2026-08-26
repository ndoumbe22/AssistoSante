import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserMd, FaUser, FaFileAlt, FaCalendarCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import searchService from "../services/searchService";

function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState({
    doctors: [],
    patients: [],
    articles: [],
    appointments: []
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Perform search with debounce
  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults({ doctors: [], patients: [], articles: [], appointments: [] });
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      const results = await searchService.search(searchTerm);
      setResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to empty results on error
      setResults({ doctors: [], patients: [], articles: [], appointments: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (type, id) => {
    switch (type) {
      case "doctors":
        navigate(`/medecin/${id}`);
        break;
      case "patients":
        navigate(`/patient/${id}`);
        break;
      case "articles":
        navigate(`/articles/${id}`);
        break;
      case "appointments":
        navigate(`/rendez-vous/${id}`);
        break;
      default:
        break;
    }
    setShowResults(false);
    setSearchTerm("");
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResults({ doctors: [], patients: [], articles: [], appointments: [] });
    setShowResults(false);
  };

  return (
    <div className="position-relative" ref={searchRef}>
      <form onSubmit={handleSearch} className="d-flex">
        <div className="input-group">
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher des médecins, patients, articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 3 && setShowResults(true)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={clearSearch}
            >
              <FaTimes />
            </button>
          )}
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
        </div>
      </form>

      {showResults && (
        <div 
          className="position-absolute bg-white border rounded shadow mt-1 w-100" 
          style={{ zIndex: 1000, maxHeight: "400px", overflowY: "auto" }}
        >
          {loading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Doctors */}
              {results.doctors.length > 0 && (
                <div className="border-bottom">
                  <div className="px-3 py-2 bg-light">
                    <strong>
                      <FaUserMd className="me-2" />
                      Médecins
                    </strong>
                  </div>
                  {results.doctors.map(doctor => (
                    <div 
                      key={doctor.id}
                      className="px-3 py-2 border-bottom hover-bg-light cursor-pointer"
                      onClick={() => handleResultClick("doctors", doctor.id)}
                    >
                      <div className="fw-bold">{doctor.name}</div>
                      <div className="small text-muted">{doctor.specialty}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Patients (only for admin/doctor) */}
              {results.patients.length > 0 && (
                <div className="border-bottom">
                  <div className="px-3 py-2 bg-light">
                    <strong>
                      <FaUser className="me-2" />
                      Patients
                    </strong>
                  </div>
                  {results.patients.map(patient => (
                    <div 
                      key={patient.id}
                      className="px-3 py-2 border-bottom hover-bg-light cursor-pointer"
                      onClick={() => handleResultClick("patients", patient.id)}
                    >
                      <div className="fw-bold">{patient.name}</div>
                      <div className="small text-muted">{patient.age} ans</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <div className="border-bottom">
                  <div className="px-3 py-2 bg-light">
                    <strong>
                      <FaFileAlt className="me-2" />
                      Articles
                    </strong>
                  </div>
                  {results.articles.map(article => (
                    <div 
                      key={article.id}
                      className="px-3 py-2 border-bottom hover-bg-light cursor-pointer"
                      onClick={() => handleResultClick("articles", article.id)}
                    >
                      <div className="fw-bold">{article.title}</div>
                      <div className="small text-muted text-truncate">{article.excerpt}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Appointments */}
              {results.appointments.length > 0 && (
                <div className="border-bottom">
                  <div className="px-3 py-2 bg-light">
                    <strong>
                      <FaCalendarCheck className="me-2" />
                      Rendez-vous
                    </strong>
                  </div>
                  {results.appointments.map(appointment => (
                    <div 
                      key={appointment.id}
                      className="px-3 py-2 border-bottom hover-bg-light cursor-pointer"
                      onClick={() => handleResultClick("appointments", appointment.id)}
                    >
                      <div className="fw-bold">
                        {appointment.patient} - {appointment.doctor}
                      </div>
                      <div className="small text-muted">
                        {appointment.date} à {appointment.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {results.doctors.length === 0 && 
               results.patients.length === 0 && 
               results.articles.length === 0 && 
               results.appointments.length === 0 && (
                <div className="p-3 text-center text-muted">
                  Aucun résultat trouvé
                </div>
              )}

              {/* Show all results link */}
              {(results.doctors.length > 0 || 
                results.patients.length > 0 || 
                results.articles.length > 0 || 
                results.appointments.length > 0) && (
                <div className="px-3 py-2 text-center border-top">
                  <button 
                    className="btn btn-link btn-sm"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                      setShowResults(false);
                    }}
                  >
                    Voir tous les résultats
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;