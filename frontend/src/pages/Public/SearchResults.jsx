import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaUserMd, FaUser, FaFileAlt, FaCalendarCheck, FaFilter } from "react-icons/fa";

function SearchResults() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState({
    doctors: [],
    patients: [],
    articles: [],
    appointments: []
  });
  const [loading, setLoading] = useState(true);

  // Extract search term from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    setLoading(true);
    
    // In a real implementation, this would call an API
    try {
      // Try to fetch real search results from the API
      // This would require implementing a search endpoint in the backend
      const response = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const apiResults = await response.json();
        setResults(apiResults);
      } else {
        // Fallback to mock data if API fails
        const mockResults = {
          doctors: [
            { 
              id: 1, 
              name: "Dr. Martin Diop", 
              specialty: "Cardiologue", 
              rating: 4.5,
              address: "Clinique Saint-Louis, Dakar",
              phone: "+221 33 123 45 67"
            },
            { 
              id: 2, 
              name: "Dr. Fatou Ndiaye", 
              specialty: "Dermatologue", 
              rating: 4.8,
              address: "Centre Médical du Soleil, Dakar",
              phone: "+221 33 234 56 78"
            },
            { 
              id: 3, 
              name: "Dr. Mamadou Fall", 
              specialty: "Pédiatre", 
              rating: 4.9,
              address: "Hôpital Aristide Le Dantec, Dakar",
              phone: "+221 33 345 67 89"
            }
          ],
          patients: [
            { id: 1, name: "Aminata Fall", age: 35, lastVisit: "2023-10-15" },
            { id: 2, name: "Mamadou Sow", age: 42, lastVisit: "2023-10-10" },
            { id: 3, name: "Fatou Ndiaye", age: 28, lastVisit: "2023-10-05" }
          ],
          articles: [
            { 
              id: 1, 
              title: "Prévention des maladies cardiovasculaires", 
              excerpt: "Découvrez les meilleurs moyens de prévenir les maladies cardiovasculaires grâce à une alimentation équilibrée et une activité physique régulière.",
              author: "Dr. Martin Diop",
              date: "2023-10-01",
              views: 1250
            },
            { 
              id: 2, 
              title: "Nutrition et santé", 
              excerpt: "Comment une alimentation équilibrée peut améliorer votre santé et prévenir de nombreuses maladies chroniques.",
              author: "Dr. Fatou Ndiaye",
              date: "2023-09-25",
              views: 980
            },
            { 
              id: 3, 
              title: "Soins pédiatriques essentiels", 
              excerpt: "Guide complet pour les soins de santé des enfants de 0 à 12 ans, incluant les vaccinations et les visites de routine.",
              author: "Dr. Mamadou Fall",
              date: "2023-09-20",
              views: 1520
            }
          ],
          appointments: [
            { 
              id: 1, 
              patient: "Aminata Fall", 
              doctor: "Dr. Martin Diop", 
              specialty: "Cardiologue",
              date: "2023-10-20", 
              time: "10:30",
              status: "confirmé"
            },
            { 
              id: 2, 
              patient: "Mamadou Sow", 
              doctor: "Dr. Fatou Ndiaye", 
              specialty: "Dermatologue",
              date: "2023-10-21", 
              time: "14:00",
              status: "en attente"
            }
          ]
        };
        
        setResults(mockResults);
      }
    } catch (error) {
      console.error("Search error:", error);
      
      // Final fallback to mock data
      const mockResults = {
        doctors: [
          { 
            id: 1, 
            name: "Dr. Martin Diop", 
            specialty: "Cardiologue", 
            rating: 4.5,
            address: "Clinique Saint-Louis, Dakar",
            phone: "+221 33 123 45 67"
          },
          { 
            id: 2, 
            name: "Dr. Fatou Ndiaye", 
            specialty: "Dermatologue", 
            rating: 4.8,
            address: "Centre Médical du Soleil, Dakar",
            phone: "+221 33 234 56 78"
          },
          { 
            id: 3, 
            name: "Dr. Mamadou Fall", 
            specialty: "Pédiatre", 
            rating: 4.9,
            address: "Hôpital Aristide Le Dantec, Dakar",
            phone: "+221 33 345 67 89"
          }
        ],
        patients: [
          { id: 1, name: "Aminata Fall", age: 35, lastVisit: "2023-10-15" },
          { id: 2, name: "Mamadou Sow", age: 42, lastVisit: "2023-10-10" },
          { id: 3, name: "Fatou Ndiaye", age: 28, lastVisit: "2023-10-05" }
        ],
        articles: [
          { 
            id: 1, 
            title: "Prévention des maladies cardiovasculaires", 
            excerpt: "Découvrez les meilleurs moyens de prévenir les maladies cardiovasculaires grâce à une alimentation équilibrée et une activité physique régulière.",
            author: "Dr. Martin Diop",
            date: "2023-10-01",
            views: 1250
          },
          { 
            id: 2, 
            title: "Nutrition et santé", 
            excerpt: "Comment une alimentation équilibrée peut améliorer votre santé et prévenir de nombreuses maladies chroniques.",
            author: "Dr. Fatou Ndiaye",
            date: "2023-09-25",
            views: 980
          },
          { 
            id: 3, 
            title: "Soins pédiatriques essentiels", 
            excerpt: "Guide complet pour les soins de santé des enfants de 0 à 12 ans, incluant les vaccinations et les visites de routine.",
            author: "Dr. Mamadou Fall",
            date: "2023-09-20",
            views: 1520
          }
        ],
        appointments: [
          { 
            id: 1, 
            patient: "Aminata Fall", 
            doctor: "Dr. Martin Diop", 
            specialty: "Cardiologue",
            date: "2023-10-20", 
            time: "10:30",
            status: "confirmé"
          },
          { 
            id: 2, 
            patient: "Mamadou Sow", 
            doctor: "Dr. Fatou Ndiaye", 
            specialty: "Dermatologue",
            date: "2023-10-21", 
            time: "14:00",
            status: "en attente"
          }
        ]
      };
      
      setResults(mockResults);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = {
    doctors: activeTab === "all" || activeTab === "doctors" ? results.doctors : [],
    patients: activeTab === "all" || activeTab === "patients" ? results.patients : [],
    articles: activeTab === "all" || activeTab === "articles" ? results.articles : [],
    appointments: activeTab === "all" || activeTab === "appointments" ? results.appointments : []
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmé":
        return <span className="badge bg-success">Confirmé</span>;
      case "en attente":
        return <span className="badge bg-warning">En attente</span>;
      case "annulé":
        return <span className="badge bg-danger">Annulé</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">
            <FaFilter className="me-2" />
            Résultats de recherche pour "{searchTerm}"
          </h1>
          
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Tous ({results.doctors.length + results.patients.length + results.articles.length + results.appointments.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "doctors" ? "active" : ""}`}
                onClick={() => setActiveTab("doctors")}
              >
                <FaUserMd className="me-2" />
                Médecins ({results.doctors.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "articles" ? "active" : ""}`}
                onClick={() => setActiveTab("articles")}
              >
                <FaFileAlt className="me-2" />
                Articles ({results.articles.length})
              </button>
            </li>
            {results.patients.length > 0 && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "patients" ? "active" : ""}`}
                  onClick={() => setActiveTab("patients")}
                >
                  <FaUser className="me-2" />
                  Patients ({results.patients.length})
                </button>
              </li>
            )}
            {results.appointments.length > 0 && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
                  onClick={() => setActiveTab("appointments")}
                >
                  <FaCalendarCheck className="me-2" />
                  Rendez-vous ({results.appointments.length})
                </button>
              </li>
            )}
          </ul>
          
          {/* Results */}
          <div className="row">
            {/* Doctors */}
            {filteredResults.doctors.length > 0 && (
              <div className="col-12 mb-4">
                <h3>
                  <FaUserMd className="me-2" />
                  Médecins
                </h3>
                <div className="row">
                  {filteredResults.doctors.map(doctor => (
                    <div key={doctor.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{doctor.name}</h5>
                          <p className="card-text">
                            <strong>Spécialité:</strong> {doctor.specialty}
                          </p>
                          <p className="card-text">
                            <strong>Adresse:</strong> {doctor.address}
                          </p>
                          <p className="card-text">
                            <strong>Téléphone:</strong> {doctor.phone}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="badge bg-primary">
                                ★ {doctor.rating}
                              </span>
                            </div>
                            <button className="btn btn-outline-primary btn-sm">
                              Voir le profil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Articles */}
            {filteredResults.articles.length > 0 && (
              <div className="col-12 mb-4">
                <h3>
                  <FaFileAlt className="me-2" />
                  Articles
                </h3>
                <div className="row">
                  {filteredResults.articles.map(article => (
                    <div key={article.id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{article.title}</h5>
                          <p className="card-text text-muted">
                            {article.excerpt}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              Par {article.author}
                            </small>
                            <small className="text-muted">
                              {article.views} vues
                            </small>
                          </div>
                        </div>
                        <div className="card-footer">
                          <button className="btn btn-outline-primary w-100">
                            Lire l'article
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Patients */}
            {filteredResults.patients.length > 0 && (
              <div className="col-12 mb-4">
                <h3>
                  <FaUser className="me-2" />
                  Patients
                </h3>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Âge</th>
                        <th>Dernière visite</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.patients.map(patient => (
                        <tr key={patient.id}>
                          <td>{patient.name}</td>
                          <td>{patient.age} ans</td>
                          <td>{patient.lastVisit}</td>
                          <td>
                            <button className="btn btn-outline-primary btn-sm">
                              Voir le dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Appointments */}
            {filteredResults.appointments.length > 0 && (
              <div className="col-12 mb-4">
                <h3>
                  <FaCalendarCheck className="me-2" />
                  Rendez-vous
                </h3>
                <div className="table-responsive">
                  <table className="table table-striped">
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
                      {filteredResults.appointments.map(appointment => (
                        <tr key={appointment.id}>
                          <td>{appointment.patient}</td>
                          <td>{appointment.doctor} ({appointment.specialty})</td>
                          <td>{appointment.date}</td>
                          <td>{appointment.time}</td>
                          <td>{getStatusBadge(appointment.status)}</td>
                          <td>
                            <button className="btn btn-outline-primary btn-sm">
                              Voir les détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* No results */}
            {filteredResults.doctors.length === 0 && 
             filteredResults.articles.length === 0 && 
             filteredResults.patients.length === 0 && 
             filteredResults.appointments.length === 0 && (
              <div className="col-12 text-center py-5">
                <h4 className="text-muted">
                  Aucun résultat trouvé pour "{searchTerm}"
                </h4>
                <p className="text-muted">
                  Essayez avec des termes de recherche différents.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResults;