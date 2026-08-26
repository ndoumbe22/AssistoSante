import React, { useState, useEffect } from "react";
import { FaUser, FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { adminService } from "../../services/adminService";

function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "patient"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Fetch real users from the API
        const usersData = await adminService.getUsers();
        
        // Transform the data to match our existing structure
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          nom: user.last_name || "",
          prenom: user.first_name || "",
          email: user.email || "",
          telephone: "", // We don't have phone in our data model
          role: user.role || "patient",
          dateInscription: new Date(user.date_joined).toISOString().split('T')[0]
        }));
        
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des utilisateurs");
        setLoading(false);
        console.error("Erreur lors du chargement des utilisateurs :", err);
      }
    };

    fetchUsers();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = users.filter(
      user =>
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Send request to API to create user
      const userData = {
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.prenom,
        last_name: newUser.nom,
        password: newUser.password,
        role: newUser.role,
        is_active: true
      };
      
      await adminService.createUser(userData);
      
      // Refresh the user list
      const usersData = await adminService.getUsers();
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        nom: user.last_name || "",
        prenom: user.first_name || "",
        email: user.email || "",
        telephone: "",
        role: user.role || "patient",
        is_active: user.is_active,
        dateInscription: new Date(user.date_joined).toISOString().split('T')[0]
      }));
      
      setUsers(transformedUsers);
      setFilteredUsers(transformedUsers);
      
      // Reset form and close modal
      setNewUser({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        username: "",
        password: "",
        role: "patient"
      });
      setShowAddModal(false);
    } catch (err) {
      setError("Erreur lors de l'ajout de l'utilisateur: " + (err.response?.data?.error || err.message));
      console.error("Erreur lors de l'ajout de l'utilisateur :", err);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Send request to API to update user
      const userData = {
        first_name: currentUser.prenom,
        last_name: currentUser.nom,
        email: currentUser.email,
        username: currentUser.username,
        role: currentUser.role,
        is_active: currentUser.is_active
      };
      
      await adminService.updateUser(currentUser.id, userData);
      
      // Refresh the user list
      const usersData = await adminService.getUsers();
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        nom: user.last_name || "",
        prenom: user.first_name || "",
        email: user.email || "",
        telephone: "",
        role: user.role || "patient",
        is_active: user.is_active,
        dateInscription: new Date(user.date_joined).toISOString().split('T')[0]
      }));
      
      setUsers(transformedUsers);
      setFilteredUsers(transformedUsers);
      
      // Close modal
      setShowEditModal(false);
      setCurrentUser(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour de l'utilisateur: " + (err.response?.data?.error || err.message));
      console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        // Send request to API to delete user
        await adminService.deleteUser(id);
        
        // Refresh the user list
        const usersData = await adminService.getUsers();
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          nom: user.last_name || "",
          prenom: user.first_name || "",
          email: user.email || "",
          telephone: "",
          role: user.role || "patient",
          is_active: user.is_active,
          dateInscription: new Date(user.date_joined).toISOString().split('T')[0]
        }));
        
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
      } catch (err) {
        setError("Erreur lors de la suppression de l'utilisateur: " + (err.response?.data?.error || err.message));
        console.error("Erreur lors de la suppression de l'utilisateur :", err);
      }
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      await adminService.toggleUserStatus(userId);
      // Refresh the user list
      const usersData = await adminService.getUsers();
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        nom: user.last_name || "",
        prenom: user.first_name || "",
        email: user.email || "",
        telephone: "",
        role: user.role || "patient",
        dateInscription: new Date(user.date_joined).toISOString().split('T')[0]
      }));
      
      setUsers(transformedUsers);
      setFilteredUsers(transformedUsers);
    } catch (err) {
      setError("Erreur lors de la modification du statut de l'utilisateur");
      console.error("Erreur lors de la modification du statut de l'utilisateur :", err);
    }
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setShowEditModal(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="badge bg-danger">Administrateur</span>;
      case "medecin":
        return <span className="badge bg-success">Médecin</span>;
      case "patient":
        return <span className="badge bg-primary">Patient</span>;
      default:
        return <span className="badge bg-secondary">{role}</span>;
    }
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
            <h5>Gestion des Utilisateurs</h5>
            <ul className="list-group">
              <li className="list-group-item active">Tous les utilisateurs</li>
              <li className="list-group-item">Administrateurs</li>
              <li className="list-group-item">Médecins</li>
              <li className="list-group-item">Patients</li>
          </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Total:</span>
              <span className="fw-bold">{users.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Administrateurs:</span>
              <span className="fw-bold text-danger">
                {users.filter(u => u.role === "admin").length}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Médecins:</span>
              <span className="fw-bold text-success">
                {users.filter(u => u.role === "medecin").length}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Patients:</span>
              <span className="fw-bold text-primary">
                {users.filter(u => u.role === "patient").length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Utilisateurs</h2>
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
                <FaPlus className="me-2" /> Ajouter un utilisateur
              </button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucun utilisateur trouvé</h4>
              <p>Aucun utilisateur ne correspond à votre recherche.</p>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter un utilisateur
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Date d'inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.prenom} {user.nom}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        {user.is_active ? (
                          <span className="badge bg-success">Actif</span>
                        ) : (
                          <span className="badge bg-danger">Inactif</span>
                        )}
                      </td>
                      <td>{user.dateInscription}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <FaEye />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => openEditModal(user)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} me-1`}
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          title={user.is_active ? 'Désactiver' : 'Activer'}
                          disabled={user.role === "admin"} // Prevent toggling admin status
                        >
                          {user.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.role === "admin"} // Prevent deleting admin
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
                <h5 className="modal-title">Ajouter un utilisateur</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom d'utilisateur *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Mot de passe *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.nom}
                      onChange={(e) => setNewUser(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.prenom}
                      onChange={(e) => setNewUser(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Rôle</label>
                    <select
                      className="form-select"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="patient">Patient</option>
                      <option value="medecin">Médecin</option>
                      <option value="admin">Administrateur</option>
                    </select>
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
      {showEditModal && currentUser && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier un utilisateur</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentUser(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom d'utilisateur</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentUser.username}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentUser.nom}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentUser.prenom}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Rôle</label>
                    <select
                      className="form-select"
                      value={currentUser.role}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, role: e.target.value }))}
                      disabled={currentUser.role === "admin"} // Prevent changing admin role
                    >
                      <option value="patient">Patient</option>
                      <option value="medecin">Médecin</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isActive"
                      checked={currentUser.is_active}
                      onChange={(e) => setCurrentUser(prev => ({ ...prev, is_active: e.target.checked }))}
                      disabled={currentUser.role === "admin"} // Prevent disabling admin
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      Compte actif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentUser(null);
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

export default Utilisateurs;