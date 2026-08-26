import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStethoscope, FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";

function MedecinsSpecialite() {
  const [specialites, setSpecialites] = useState([]);
  const [filteredSpecialites, setFilteredSpecialites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSpecialite, setCurrentSpecialite] = useState(null);
  const [newSpecialite, setNewSpecialite] = useState({
    nom: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les spécialités depuis l'API
  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockSpecialites = [
          {
            id: 1,
            nom: "Médecine Générale",
            description: "Soins de santé primaires et continuité des soins",
            medecins: 8,
            dateCreation: "2020-01-01"
          },
          {
            id: 2,
            nom: "Cardiologie",
            description: "Diagnostic et traitement des maladies cardiovasculaires",
            medecins: 5,
            dateCreation: "2020-01-01"
          },
          {
            id: 3,
            nom: "Dermatologie",
            description: "Diagnostic et traitement des maladies de la peau",
            medecins: 3,
            dateCreation: "2020-01-01"
          },
          {
            id: 4,
            nom: "Pédiatrie",
            description: "Soins de santé pour les enfants",
            medecins: 4,
            dateCreation: "2020-01-01"
          },
          {
            id: 5,
            nom: "Gynécologie",
            description: "Soins de santé reproductive féminine",
            medecins: 3,
            dateCreation: "2020-01-01"
          },
          {
            id: 6,
            nom: "Orthopédie",
            description: "Diagnostic et traitement des troubles musculo-squelettiques",
            medecins: 4,
            dateCreation: "2020-01-01"
          }
        ];
        
        setSpecialites(mockSpecialites);
        setFilteredSpecialites(mockSpecialites);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des spécialités");
        setLoading(false);
        console.error("Erreur lors du chargement des spécialités :", err);
      }
    };

    fetchSpecialites();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = specialites.filter(
      specialite =>
        specialite.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialite.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpecialites(filtered);
  }, [searchTerm, specialites]);

  const handleAddSpecialite = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // const response = await axios.post('/api/admin/specialites/create/', newSpecialite, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      // Simulation d'une nouvelle spécialité
      const newSpecialiteWithId = {
        id: specialites.length + 1,
        ...newSpecialite,
        medecins: 0,
        dateCreation: new Date().toISOString().split('T')[0]
      };
      
      setSpecialites(prev => [...prev, newSpecialiteWithId]);
      setNewSpecialite({
        nom: "",
        description: ""
      });
      setShowAddModal(false);
    } catch (err) {
      setError("Erreur lors de l'ajout de la spécialité");
      console.error("Erreur lors de l'ajout de la spécialité :", err);
    }
  };

  const handleUpdateSpecialite = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/admin/specialites/${currentSpecialite.id}/update/`, currentSpecialite, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setSpecialites(prev => 
        prev.map(specialite => 
          specialite.id === currentSpecialite.id ? currentSpecialite : specialite
        )
      );
      setShowEditModal(false);
      setCurrentSpecialite(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour de la spécialité");
      console.error("Erreur lors de la mise à jour de la spécialité :", err);
    }
  };

  const handleDeleteSpecialite = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/admin/specialites/${id}/delete/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setSpecialites(prev => prev.filter(specialite => specialite.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la spécialité");
      console.error("Erreur lors de la suppression de la spécialité :", err);
    }
  };

  const openEditModal = (specialite) => {
    setCurrentSpecialite(specialite);
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card shadow-sm p-3 mb-4">
            <h5>Gestion des Spécialités</h5>
            <ul className="list-group">
              <li className="list-group-item active">Toutes les spécialités</li>
              <li className="list-group-item">Médecine générale</li>
              <li className="list-group-item">Spécialités chirurgicales</li>
              <li className="list-group-item">Spécialités médicales</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between">
              <span>Total:</span>
              <span className="fw-bold">{specialites.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Spécialités Médicales</h2>
            <div className="d-flex">
              <div style={{ position: "relative", width: "200px", marginRight: "10px" }}>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
                <FaSearch
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    color: "#888",
                  }}
                />
              </div>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter une spécialité
              </button>
            </div>
          </div>

          {filteredSpecialites.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucune spécialité trouvée</h4>
              <p>Aucune spécialité ne correspond à votre recherche.</p>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter une spécialité
              </button>
            </div>
          ) : (
            <div className="row">
              {filteredSpecialites.map((specialite) => (
                <div key={specialite.id} className="col-md-6 mb-4">
                  <div className="card shadow-sm p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <FaStethoscope className="me-2 text-success" size={20} />
                          <h5 className="mb-0">{specialite.nom}</h5>
                        </div>
                        <p className="text-muted">{specialite.description}</p>
                      </div>
                      <div>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => openEditModal(specialite)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSpecialite(specialite.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted">Médecins</small>
                        <p className="mb-0">{specialite.medecins}</p>
                      </div>
                      <div>
                        <small className="text-muted">Date de création</small>
                        <p className="mb-0">{specialite.dateCreation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ajouter une spécialité</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddSpecialite}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom de la spécialité</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSpecialite.nom}
                      onChange={(e) => setNewSpecialite(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newSpecialite.description}
                      onChange={(e) => setNewSpecialite(prev => ({ ...prev, description: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success">
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'édition */}
      {showEditModal && currentSpecialite && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier une spécialité</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentSpecialite(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateSpecialite}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom de la spécialité</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSpecialite.nom}
                      onChange={(e) => setCurrentSpecialite(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={currentSpecialite.description}
                      onChange={(e) => setCurrentSpecialite(prev => ({ ...prev, description: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentSpecialite(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success">
                    Mettre à jour
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

export default MedecinsSpecialite;