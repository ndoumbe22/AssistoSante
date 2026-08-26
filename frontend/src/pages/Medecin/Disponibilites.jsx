import React, { useState, useEffect } from "react";
import { disponibiliteMedecinAPI, indisponibiliteMedecinAPI } from "../../services/api";
import { FaClock, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function Disponibilites() {
  const [disponibilites, setDisponibilites] = useState([]);
  const [indisponibilites, setIndisponibilites] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddIndisponibiliteModal, setShowAddIndisponibiliteModal] = useState(false);
  const [currentDisponibilite, setCurrentDisponibilite] = useState(null);
  
  const [newDisponibilite, setNewDisponibilite] = useState({
    jour: "",
    heure_debut: "",
    heure_fin: "",
    duree_consultation: 30,
    pause_dejeuner_debut: "",
    pause_dejeuner_fin: "",
    nb_max_consultations: 10,
    actif: true 
  });
  const [newIndisponibilite, setNewIndisponibilite] = useState({
    date_debut: "",
    date_fin: "",
    raison: "",
    toute_la_journee: true,
    heure_debut: "",
    heure_fin: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les disponibilités depuis l'API
  useEffect(() => {
    const fetchDisponibilites = async () => {
      try {
        setLoading(true);
        const [dispoResponse, indispoResponse] = await Promise.all([
          disponibiliteMedecinAPI.getMesDisponibilites(),
          indisponibiliteMedecinAPI.getMesIndisponibilites()
        ]);
        
        // ✅ Fallback sur tableau vide si data est undefined
        setDisponibilites(Array.isArray(dispoResponse.data)? dispoResponse.data: Array.isArray(dispoResponse.data?.results)? dispoResponse.data.results: []);
        setIndisponibilites(Array.isArray(indispoResponse.data)? indispoResponse.data: Array.isArray(indispoResponse.data?.results)? indispoResponse.data.results: []);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des disponibilités");
        setLoading(false);
        console.error("Erreur lors du chargement des disponibilités :", err);
        // ✅ Important: initialiser même en cas d'erreur
        setDisponibilites([]);
        setIndisponibilites([]);
      }
    };

    fetchDisponibilites();
  }, []);

  const handleAddDisponibilite = async (e) => {
  e.preventDefault();

  // Validation
  if (!newDisponibilite.jour) {
    return setError("Veuillez sélectionner un jour");
  }
  if (!newDisponibilite.heure_debut || !newDisponibilite.heure_fin) {
    return setError("Veuillez renseigner l'heure de début et de fin");
  }
  if (newDisponibilite.heure_debut >= newDisponibilite.heure_fin) {
    return setError("L'heure de début doit être avant l'heure de fin");
  }

  try {
    const response = await disponibiliteMedecinAPI.createDisponibilite(newDisponibilite); // <-- corrigé
    setDisponibilites(prev => [...prev, response.data]);
    
    // reset
    setNewDisponibilite({
      jour: "",
      heure_debut: "",
      heure_fin: "",
      duree_consultation: 30,
      
      nb_max_consultations: 10,
      actif: true
    });
    
    setShowAddModal(false);
    setError(null);

  } catch (err) {
    console.error("Erreur backend complète :", err.response);
    setError(
      err.response?.data?.non_field_errors?.[0] || 
      "Erreur lors de l'ajout de la disponibilité"
    );
  }
};



  const handleUpdateDisponibilite = async (e) => {
    e.preventDefault();
    try {
      const response = await disponibiliteMedecinAPI.updateDisponibilite(currentDisponibilite.id, currentDisponibilite);
      setDisponibilites(prev => 
        prev.map(disp => 
          disp.id === currentDisponibilite.id ? response.data : disp
        )
      );
      setShowEditModal(false);
      setCurrentDisponibilite(null);
    } catch (err) {
      setError("Erreur lors de la mise à jour de la disponibilité: " + (err.response?.data?.detail || err.message));
      console.error("Erreur lors de la mise à jour de la disponibilité :", err);
    }
  };

  const handleDeleteDisponibilite = async (id) => {
    try {
      await disponibiliteMedecinAPI.deleteDisponibilite(id);
      setDisponibilites(prev => prev.filter(disp => disp.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de la disponibilité: " + (err.response?.data?.detail || err.message));
      console.error("Erreur lors de la suppression de la disponibilité :", err);
    }
  };

 const handleAddIndisponibilite = async (e) => {
  e.preventDefault();

  // Validation simple avant envoi
  if (!newIndisponibilite.date_debut || !newIndisponibilite.date_fin) {
    return setError("Veuillez renseigner les dates de début et de fin.");
  }

  if (!newIndisponibilite.toute_la_journee) {
    if (!newIndisponibilite.heure_debut || !newIndisponibilite.heure_fin) {
      return setError("Veuillez renseigner les heures de début et de fin pour l'indisponibilité partielle.");
    }
  }

  try {
    // Appel API
    const response = await indisponibiliteMedecinAPI.createIndisponibilite(newIndisponibilite);

    // ✅ Fallback si response ou response.data est undefined
    const responseData = response?.data || {};

    // Mise à jour du state
    setIndisponibilites(prev => [...prev, responseData]);

    // Reset du formulaire
    setNewIndisponibilite({
      date_debut: "",
      date_fin: "",
      raison: "",
      toute_la_journee: true,
      heure_debut: "",
      heure_fin: ""
    });

    setShowAddIndisponibiliteModal(false);
    setError(null);

  } catch (err) {
    // Gestion complète des erreurs
    console.error("Erreur lors de l'ajout de l'indisponibilité :", err);

    const backendMessage =
      err?.response?.data?.detail ||
      err?.response?.data?.non_field_errors?.[0] ||
      err?.message ||
      "Une erreur serveur est survenue. Veuillez réessayer.";

    setError("Erreur lors de l'ajout de l'indisponibilité: " + backendMessage);
  }
};


  const handleDeleteIndisponibilite = async (id) => {
    try {
      await indisponibiliteMedecinAPI.deleteIndisponibilite(id);
      setIndisponibilites(prev => prev.filter(indispo => indispo.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression de l'indisponibilité: " + (err.response?.data?.detail || err.message));
      console.error("Erreur lors de la suppression de l'indisponibilité :", err);
    }
  };

  const openEditModal = (disponibilite) => {
    setCurrentDisponibilite(disponibilite);
    setShowEditModal(true);
  };

  const joursSemaine = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
    { value: 'dimanche', label: 'Dimanche' }
  ];

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar - Calendrier */}
        <div className="col-md-4">
          <div className="card shadow-sm p-3 mb-4">
            <h5>Calendrier</h5>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="border-0"
            />
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Actions</h5>
            <button 
              className="btn btn-success w-100 mb-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="me-2" /> Ajouter une disponibilité
            </button>
            <button 
              className="btn btn-warning w-100 mb-2"
              onClick={() => setShowAddIndisponibiliteModal(true)}
            >
              <FaClock className="me-2" /> Ajouter une indisponibilité
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Disponibilités</h2>
            <div>
              <button 
                className="btn btn-success me-2"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" /> Ajouter Disponibilité
              </button>
              <button 
                className="btn btn-warning"
                onClick={() => setShowAddIndisponibiliteModal(true)}
              >
                <FaClock className="me-2" /> Ajouter Indisponibilité
              </button>
            </div>
          </div>

          {/* Disponibilités */}
          <h4 className="mb-3">Disponibilités</h4>
          {!disponibilites || disponibilites.length === 0 ? (
            <div className="card shadow-sm p-4 mb-4">
              <p className="text-muted">Aucune disponibilité définie</p>
            </div>
          ) : (
            <div className="row mb-4">
              {disponibilites?.length > 0 ? (
  disponibilites.map((disponibilite) => disponibilite ? (
    <div key={disponibilite.id || Math.random()} className="col-md-6 mb-3">
      <div className="card shadow-sm p-3">
        <h6 className="mb-1">
          {disponibilite.jour 
            ? (joursSemaine.find(j => j.value === disponibilite.jour)?.label || disponibilite.jour)
            : "Jour non défini"}
        </h6>
        <p className="mb-1">
          <FaClock className="me-2" /> 
          {disponibilite.heure_debut || "--:--"} - {disponibilite.heure_fin || "--:--"}
        </p>
        <p className="mb-1 text-muted">
          Durée consultation: {disponibilite.duree_consultation || 0} min
        </p>
        {disponibilite.pause_dejeuner_debut && disponibilite.pause_dejeuner_fin && (
          <p className="mb-1 text-muted">
            Pause déjeuner: {disponibilite.pause_dejeuner_debut} - {disponibilite.pause_dejeuner_fin}
          </p>
        )}
        <p className="mb-0">
          <span className={`badge ${disponibilite.actif ? 'bg-success' : 'bg-secondary'}`}>
            {disponibilite.actif ? 'Actif' : 'Inactif'}
          </span>
        </p>
      </div>
    </div>
  ) : null)
) : (
  <div className="card shadow-sm p-4 mb-4">
    <p className="text-muted">Aucune disponibilité définie</p>
  </div>
)}

            </div>
          )}

          {/* Indisponibilités */}
          <h4 className="mb-3">Indisponibilités</h4>
          {!indisponibilites || indisponibilites.length === 0 ? (
            <div className="card shadow-sm p-4">
              <p className="text-muted">Aucune indisponibilité définie</p>
            </div>
          ) : (
            <div className="row">
              {indisponibilites.filter(Boolean).map((indisponibilite) => (
  <div key={indisponibilite.id || Math.random()} className="col-md-6 mb-3">
    <div className="card shadow-sm p-3">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h6 className="mb-1">Indisponible</h6>
          <p className="mb-1">
            Du {indisponibilite.date_debut || "--"} au {indisponibilite.date_fin || "--"}
          </p>
          {indisponibilite.raison && (
            <p className="mb-1 text-muted">{indisponibilite.raison}</p>
          )}
          {!indisponibilite.toute_la_journee && (
            <p className="mb-1 text-muted">
              De {indisponibilite.heure_debut || "--"} à {indisponibilite.heure_fin || "--"}
            </p>
          )}
        </div>
        <button 
          className="btn btn-sm btn-outline-danger"
          onClick={() => handleDeleteIndisponibilite(indisponibilite.id)}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  </div>
))}

            </div>
          )}
        </div>
      </div>
      
      {/* Modal d'ajout de disponibilité */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ajouter une disponibilité</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddDisponibilite}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Jour</label>
                    <select
                      className="form-select"
                      value={newDisponibilite.jour}
                      onChange={(e) => setNewDisponibilite(prev => ({ ...prev, jour: e.target.value }))}
                      required
                    >
                      <option value="">Sélectionner un jour</option>
                      {joursSemaine.map(jour => (
                        <option key={jour.value} value={jour.value}>{jour.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Heure de début</label>
                        <input
                          type="time"
                          className="form-control"
                          value={newDisponibilite.heure_debut}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, heure_debut: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Heure de fin</label>
                        <input
                          type="time"
                          className="form-control"
                          value={newDisponibilite.heure_fin}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, heure_fin: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Durée de consultation (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newDisponibilite.duree_consultation}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, duree_consultation: parseInt(e.target.value) }))}
                          min="10"
                          max="120"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nombre max de consultations</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newDisponibilite.nb_max_consultations}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, nb_max_consultations: parseInt(e.target.value) }))}
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Début pause déjeuner (optionnel)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={newDisponibilite.pause_dejeuner_debut}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, pause_dejeuner_debut: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fin pause déjeuner (optionnel)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={newDisponibilite.pause_dejeuner_fin}
                          onChange={(e) => setNewDisponibilite(prev => ({ ...prev, pause_dejeuner_fin: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="actif"
                      checked={newDisponibilite.actif}
                      onChange={(e) => setNewDisponibilite(prev => ({ ...prev, actif: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="actif">Disponibilité active</label>
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
      
      {/* Modal d'édition de disponibilité */}
      {showEditModal && currentDisponibilite && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier une disponibilité</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentDisponibilite(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateDisponibilite}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Jour</label>
                    <select
                      className="form-select"
                      value={currentDisponibilite.jour}
                      onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, jour: e.target.value }))}
                      required
                    >
                      <option value="">Sélectionner un jour</option>
                      {joursSemaine.map(jour => (
                        <option key={jour.value} value={jour.value}>{jour.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Heure de début</label>
                        <input
                          type="time"
                          className="form-control"
                          value={currentDisponibilite.heure_debut}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, heure_debut: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Heure de fin</label>
                        <input
                          type="time"
                          className="form-control"
                          value={currentDisponibilite.heure_fin}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, heure_fin: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Durée de consultation (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={currentDisponibilite.duree_consultation}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, duree_consultation: parseInt(e.target.value) }))}
                          min="10"
                          max="120"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nombre max de consultations</label>
                        <input
                          type="number"
                          className="form-control"
                          value={currentDisponibilite.nb_max_consultations}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, nb_max_consultations: parseInt(e.target.value) }))}
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Début pause déjeuner (optionnel)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={currentDisponibilite.pause_dejeuner_debut || ""}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, pause_dejeuner_debut: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fin pause déjeuner (optionnel)</label>
                        <input
                          type="time"
                          className="form-control"
                          value={currentDisponibilite.pause_dejeuner_fin || ""}
                          onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, pause_dejeuner_fin: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="actifEdit"
                      checked={currentDisponibilite.actif}
                      onChange={(e) => setCurrentDisponibilite(prev => ({ ...prev, actif: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="actifEdit">Disponibilité active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentDisponibilite(null);
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
      
      {/* Modal d'ajout d'indisponibilité */}
      {showAddIndisponibiliteModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ajouter une indisponibilité</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddIndisponibiliteModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddIndisponibilite}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date de début</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newIndisponibilite.date_debut}
                          onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, date_debut: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date de fin</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newIndisponibilite.date_fin}
                          onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, date_fin: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Raison (optionnel)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newIndisponibilite.raison}
                      onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, raison: e.target.value }))}
                      placeholder="Congés, formation, etc."
                    />
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="touteLaJournee"
                      checked={newIndisponibilite.toute_la_journee}
                      onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, toute_la_journee: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="touteLaJournee">Toute la journée</label>
                  </div>
                  
                  {!newIndisponibilite.toute_la_journee && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Heure de début</label>
                          <input
                            type="time"
                            className="form-control"
                            value={newIndisponibilite.heure_debut}
                            onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, heure_debut: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Heure de fin</label>
                          <input
                            type="time"
                            className="form-control"
                            value={newIndisponibilite.heure_fin}
                            onChange={(e) => setNewIndisponibilite(prev => ({ ...prev, heure_fin: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddIndisponibiliteModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-warning">
                    Ajouter
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

export default Disponibilites;