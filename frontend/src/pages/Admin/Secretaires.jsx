import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserNurse, FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";

function Secretaires() {
  const [secretaires, setSecretaires] = useState([]);
  const [filteredSecretaires, setFilteredSecretaires] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSecretaire, setCurrentSecretaire] = useState(null);
  const [newSecretaire, setNewSecretaire] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les secrétaires depuis l'API
  useEffect(() => {
    const fetchSecretaires = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockSecretaires = [
          {
            id: 1,
            nom: "Diouf",
            prenom: "Aminata",
            email: "aminata.diouf@hopital.sn",
            telephone: "+221 77 111 22 33",
            medecin: "Dr. Ibrahim Dia",
            dateInscription: "2022-03-22"
          },
          {
            id: 2,
            nom: "Sow",
            prenom: "Fatou",
            email: "fatou.sow@hopital.sn",
            telephone: "+221 77 444 55 66",
            medecin: "Dr. Mamadou Fall",
            dateInscription: "2022-07-18"
          },
          {
            id: 3,
            nom: "Ndiaye",
            prenom: "Cheikh",
            email: "cheikh.ndiaye@hopital.sn",
            telephone: "+221 77 777 88 99",
            medecin: "Dr. Aminata Ndiaye",
            dateInscription: "2021-11-05"
          }
        ];
        
        setSecretaires(mockSecretaires);
        setFilteredSecretaires(mockSecretaires);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des secrétaires");
        setLoading(false);
        console.error("Erreur lors du chargement des secrétaires :", err);
      }
    };

    fetchSecretaires();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = secretaires.filter(
      secretaire =>
        `${secretaire.prenom} ${secretaire.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secretaire.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        secretaire.medecin.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSecretaires(filtered);
  }, [searchTerm, secretaires]);

  const handleAddSecretaire = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // const response = await axios.post('/api/admin/secretaires/create/', newSecretaire, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      // Simulation d'un nouveau secrétaire
      const newSecretaireWithId = {
        id: secretaires.length + 1,
        ...newSecretaire,
        dateInscription: new Date().toISOString().split('T')[0]
      };
      
      setSecretaires(prev => [...prev, newSecretaireWithId]);
      setNewSecretaire({
        nom: "",
        prenom: "",
        email: "",
        telephone: ""
      });
      setShowAddModal(false);
    } catch (err) {
      setError("Erreur lors de l'ajout du secrétaire");
      console.error("Erreur lors de l'ajout du secrétaire :", err);
    }
  };

  const handleUpdateSecretaire = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/admin/secretaires/${currentSecretaire.id}/update/`, currentSecretaire, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setSecretaires(prev => 
        prev.map(secretaire => 
          secretaire.id === currentSecretaire.id ? currentSecretaire : secretaire
        )
      );
      setShowEditModal(false);
      setCurrentSecretaire(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour du secrétaire");
      console.error("Erreur lors de la mise à jour du secrétaire :", err);
    }
  };

  const handleDeleteSecretaire = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/admin/secretaires/${id}/delete/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setSecretaires(prev => prev.filter(secretaire => secretaire.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du secrétaire");
      console.error("Erreur lors de la suppression du secrétaire :", err);
    }
  };

  const openEditModal = (secretaire) => {
    setCurrentSecretaire(secretaire);
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
            <h5>Gestion des Secrétaires</h5>
            <ul className="list-group">
              <li className="list-group-item active">Tous les secrétaires</li>
              <li className="list-group-item">Secrétaires médicaux</li>
              <li className="list-group-item">Secrétaires administratifs</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between">
              <span>Total:</span>
              <span className="fw-bold">{secretaires.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Secrétaires</h2>
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
                <FaPlus className="me-2" /> Ajouter un secrétaire
              </button>
            </div>
          </div>

          {filteredSecretaires.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucun secrétaire trouvé</h4>
              <p>Aucun secrétaire ne correspond à votre recherche.</p>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter un secrétaire
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Secrétaire</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Médecin</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSecretaires.map((secretaire) => (
                    <tr key={secretaire.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#e9f5fb", display: "flex", alignItems: "center", justifyContent: "center" }} className="me-2">
                            <FaUserNurse size={15} color="#45B7D1" />
                          </div>
                          <div>
                            <div>{secretaire.prenom} {secretaire.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td>{secretaire.email}</td>
                      <td>{secretaire.telephone}</td>
                      <td>{secretaire.medecin}</td>
                      <td>{secretaire.dateInscription}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => openEditModal(secretaire)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSecretaire(secretaire.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <h5 className="modal-title">Ajouter un secrétaire</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddSecretaire}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSecretaire.nom}
                      onChange={(e) => setNewSecretaire(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSecretaire.prenom}
                      onChange={(e) => setNewSecretaire(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newSecretaire.email}
                      onChange={(e) => setNewSecretaire(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={newSecretaire.telephone}
                      onChange={(e) => setNewSecretaire(prev => ({ ...prev, telephone: e.target.value }))}
                    />
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
      {showEditModal && currentSecretaire && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier un secrétaire</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentSecretaire(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateSecretaire}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSecretaire.nom}
                      onChange={(e) => setCurrentSecretaire(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSecretaire.prenom}
                      onChange={(e) => setCurrentSecretaire(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={currentSecretaire.email}
                      onChange={(e) => setCurrentSecretaire(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={currentSecretaire.telephone}
                      onChange={(e) => setCurrentSecretaire(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentSecretaire(null);
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

export default Secretaires;