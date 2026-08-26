import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUserMd, FaSearch, FaPlus, FaEdit, FaTrash, FaEye, FaStethoscope } from "react-icons/fa";

function Medecins() {
  const [medecins, setMedecins] = useState([]);
  const [filteredMedecins, setFilteredMedecins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMedecin, setCurrentMedecin] = useState(null);
  const [newMedecin, setNewMedecin] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "",
    numeroOrdre: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les médecins depuis l'API
  useEffect(() => {
    const fetchMedecins = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockMedecins = [
          {
            id: 1,
            nom: "Dia",
            prenom: "Ibrahim",
            email: "ibrahim.dia@hopital.sn",
            telephone: "+221 77 123 45 67",
            specialite: "Chirurgien Général",
            numeroOrdre: "CMO-2023-001",
            dateInscription: "2022-03-22"
          },
          {
            id: 2,
            nom: "Fall",
            prenom: "Mamadou",
            email: "mamadou.fall@hopital.sn",
            telephone: "+221 77 345 67 89",
            specialite: "Cardiologue",
            numeroOrdre: "CMO-2022-015",
            dateInscription: "2022-07-18"
          },
          {
            id: 3,
            nom: "Ndiaye",
            prenom: "Aminata",
            email: "aminata.ndiaye@hopital.sn",
            telephone: "+221 77 567 89 01",
            specialite: "Pédiatre",
            numeroOrdre: "CMO-2021-022",
            dateInscription: "2021-11-05"
          },
          {
            id: 4,
            nom: "Diop",
            prenom: "Ousmane",
            email: "ousmane.diop@hopital.sn",
            telephone: "+221 77 789 01 23",
            specialite: "Dermatologue",
            numeroOrdre: "CMO-2023-008",
            dateInscription: "2023-01-15"
          }
        ];
        
        setMedecins(mockMedecins);
        setFilteredMedecins(mockMedecins);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des médecins");
        setLoading(false);
        console.error("Erreur lors du chargement des médecins :", err);
      }
    };

    fetchMedecins();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = medecins.filter(
      medecin =>
        `${medecin.prenom} ${medecin.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medecin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medecin.specialite.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedecins(filtered);
  }, [searchTerm, medecins]);

  const handleAddMedecin = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // const response = await axios.post('/api/admin/medecins/create/', newMedecin, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      // Simulation d'un nouveau médecin
      const newMedecinWithId = {
        id: medecins.length + 1,
        ...newMedecin,
        dateInscription: new Date().toISOString().split('T')[0]
      };
      
      setMedecins(prev => [...prev, newMedecinWithId]);
      setNewMedecin({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        specialite: "",
        numeroOrdre: ""
      });
      setShowAddModal(false);
    } catch (err) {
      setError("Erreur lors de l'ajout du médecin");
      console.error("Erreur lors de l'ajout du médecin :", err);
    }
  };

  const handleUpdateMedecin = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/admin/medecins/${currentMedecin.id}/update/`, currentMedecin, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setMedecins(prev => 
        prev.map(medecin => 
          medecin.id === currentMedecin.id ? currentMedecin : medecin
        )
      );
      setShowEditModal(false);
      setCurrentMedecin(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour du médecin");
      console.error("Erreur lors de la mise à jour du médecin :", err);
    }
  };

  const handleDeleteMedecin = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/admin/medecins/${id}/delete/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setMedecins(prev => prev.filter(medecin => medecin.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du médecin");
      console.error("Erreur lors de la suppression du médecin :", err);
    }
  };

  const openEditModal = (medecin) => {
    setCurrentMedecin(medecin);
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
            <h5>Gestion des Médecins</h5>
            <ul className="list-group">
              <li className="list-group-item active">Tous les médecins</li>
              <li className="list-group-item">Spécialistes</li>
              <li className="list-group-item">Généralistes</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between">
              <span>Total:</span>
              <span className="fw-bold">{medecins.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Médecins</h2>
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
                <FaPlus className="me-2" /> Ajouter un médecin
              </button>
            </div>
          </div>

          {filteredMedecins.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucun médecin trouvé</h4>
              <p>Aucun médecin ne correspond à votre recherche.</p>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter un médecin
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Médecin</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Spécialité</th>
                    <th>Numéro d'Ordre</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedecins.map((medecin) => (
                    <tr key={medecin.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }} className="me-2">
                            <FaUserMd size={15} color="#2E7D32" />
                          </div>
                          <div>
                            <div>Dr. {medecin.prenom} {medecin.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td>{medecin.email}</td>
                      <td>{medecin.telephone}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaStethoscope className="me-1" />
                          {medecin.specialite}
                        </div>
                      </td>
                      <td>{medecin.numeroOrdre}</td>
                      <td>{medecin.dateInscription}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => openEditModal(medecin)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteMedecin(medecin.id)}
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
                <h5 className="modal-title">Ajouter un médecin</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddMedecin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMedecin.nom}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMedecin.prenom}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newMedecin.email}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={newMedecin.telephone}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Spécialité</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMedecin.specialite}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, specialite: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Numéro d'Ordre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMedecin.numeroOrdre}
                      onChange={(e) => setNewMedecin(prev => ({ ...prev, numeroOrdre: e.target.value }))}
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
      {showEditModal && currentMedecin && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier un médecin</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentMedecin(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateMedecin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentMedecin.nom}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentMedecin.prenom}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={currentMedecin.email}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={currentMedecin.telephone}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Spécialité</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentMedecin.specialite}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, specialite: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Numéro d'Ordre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentMedecin.numeroOrdre}
                      onChange={(e) => setCurrentMedecin(prev => ({ ...prev, numeroOrdre: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentMedecin(null);
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

export default Medecins;