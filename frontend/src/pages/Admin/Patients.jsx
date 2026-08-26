import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUser, FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les patients depuis l'API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockPatients = [
          {
            id: 1,
            nom: "Diop",
            prenom: "Awa",
            email: "awa.diop@email.com",
            telephone: "+221 77 987 65 43",
            adresse: "Dakar, Sénégal",
            dateInscription: "2023-01-15"
          },
          {
            id: 2,
            nom: "Fall",
            prenom: "Mamadou",
            email: "mamadou.fall@email.com",
            telephone: "+221 77 123 45 67",
            adresse: "Thiès, Sénégal",
            dateInscription: "2022-03-22"
          },
          {
            id: 3,
            nom: "Ndiaye",
            prenom: "Fatou",
            email: "fatou.ndiaye@email.com",
            telephone: "+221 77 456 78 90",
            adresse: "Saint-Louis, Sénégal",
            dateInscription: "2023-05-10"
          },
          {
            id: 4,
            nom: "Sow",
            prenom: "Cheikh",
            email: "cheikh.sow@email.com",
            telephone: "+221 77 234 56 78",
            adresse: "Kaolack, Sénégal",
            dateInscription: "2021-11-05"
          }
        ];
        
        setPatients(mockPatients);
        setFilteredPatients(mockPatients);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des patients");
        setLoading(false);
        console.error("Erreur lors du chargement des patients :", err);
      }
    };

    fetchPatients();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = patients.filter(
      patient =>
        `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // const response = await axios.post('/api/admin/patients/create/', newPatient, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      // Simulation d'un nouveau patient
      const newPatientWithId = {
        id: patients.length + 1,
        ...newPatient,
        dateInscription: new Date().toISOString().split('T')[0]
      };
      
      setPatients(prev => [...prev, newPatientWithId]);
      setNewPatient({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: ""
      });
      setShowAddModal(false);
    } catch (err) {
      setError("Erreur lors de l'ajout du patient");
      console.error("Erreur lors de l'ajout du patient :", err);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/admin/patients/${currentPatient.id}/update/`, currentPatient, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setPatients(prev => 
        prev.map(patient => 
          patient.id === currentPatient.id ? currentPatient : patient
        )
      );
      setShowEditModal(false);
      setCurrentPatient(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour du patient");
      console.error("Erreur lors de la mise à jour du patient :", err);
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/admin/patients/${id}/delete/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression du patient");
      console.error("Erreur lors de la suppression du patient :", err);
    }
  };

  const openEditModal = (patient) => {
    setCurrentPatient(patient);
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
            <h5>Gestion des Patients</h5>
            <ul className="list-group">
              <li className="list-group-item active">Tous les patients</li>
              <li className="list-group-item">Patients actifs</li>
              <li className="list-group-item">Patients inactifs</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between">
              <span>Total:</span>
              <span className="fw-bold">{patients.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Patients</h2>
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
                <FaPlus className="me-2" /> Ajouter un patient
              </button>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucun patient trouvé</h4>
              <p>Aucun patient ne correspond à votre recherche.</p>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter un patient
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Adresse</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#ffecec", display: "flex", alignItems: "center", justifyContent: "center" }} className="me-2">
                            <FaUser size={15} color="#FF6B6B" />
                          </div>
                          <div>
                            <div>{patient.prenom} {patient.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td>{patient.email}</td>
                      <td>{patient.telephone}</td>
                      <td>{patient.adresse}</td>
                      <td>{patient.dateInscription}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => openEditModal(patient)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeletePatient(patient.id)}
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
                <h5 className="modal-title">Ajouter un patient</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddPatient}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPatient.nom}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPatient.prenom}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={newPatient.telephone}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Adresse</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newPatient.adresse}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, adresse: e.target.value }))}
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
      {showEditModal && currentPatient && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier un patient</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentPatient(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdatePatient}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentPatient.nom}
                      onChange={(e) => setCurrentPatient(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentPatient.prenom}
                      onChange={(e) => setCurrentPatient(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={currentPatient.email}
                      onChange={(e) => setCurrentPatient(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={currentPatient.telephone}
                      onChange={(e) => setCurrentPatient(prev => ({ ...prev, telephone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Adresse</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={currentPatient.adresse}
                      onChange={(e) => setCurrentPatient(prev => ({ ...prev, adresse: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentPatient(null);
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

export default Patients;