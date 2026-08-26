import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaUpload, FaDownload } from "react-icons/fa";
import urgenceService from "../../services/urgenceService";

function HealthCentersAdmin() {
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentFacility, setCurrentFacility] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
    site_web: "",
    latitude: "",
    longitude: "",
    type: "hopital",
  });

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    filterFacilities();
  }, [searchTerm, typeFilter, facilities]);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate this since we don't have a specific admin endpoint
      // In a real implementation, you would have a dedicated admin endpoint
      const data = await urgenceService.getHealthFacilities();
      setFacilities(data);
    } catch (err) {
      setError(
        "Erreur lors du chargement des centres de santé: " +
          (err.response?.data?.error || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterFacilities = () => {
    let filtered = facilities;

    if (searchTerm) {
      filtered = filtered.filter(
        (facility) =>
          facility.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.adresse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((facility) => facility.type === typeFilter);
    }

    setFilteredFacilities(filtered);
  };

  const facilityTypes = [
    { value: "hopital", label: "Hôpital" },
    { value: "clinique", label: "Clinique" },
    { value: "pharmacie", label: "Pharmacie" },
    { value: "dentiste", label: "Dentiste" },
  ];

  const getFacilityTypeLabel = (type) => {
    const typeObj = facilityTypes.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real implementation, you would call an API endpoint to save the facility
    alert("Fonctionnalité d'enregistrement à implémenter");
    setShowModal(false);
  };

  const handleEdit = (facility) => {
    setCurrentFacility(facility);
    setFormData({
      nom: facility.nom,
      adresse: facility.adresse,
      telephone: facility.telephone || "",
      email: facility.email || "",
      site_web: facility.site_web || "",
      latitude: facility.latitude,
      longitude: facility.longitude,
      type: facility.type,
    });
    setShowModal(true);
  };

  const handleDelete = (facilityId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer ce centre de santé ?")
    ) {
      // In a real implementation, you would call an API endpoint to delete the facility
      alert("Fonctionnalité de suppression à implémenter");
    }
  };

  const handleAddNew = () => {
    setCurrentFacility(null);
    setFormData({
      nom: "",
      adresse: "",
      telephone: "",
      email: "",
      site_web: "",
      latitude: "",
      longitude: "",
      type: "hopital",
    });
    setShowModal(true);
  };

  const exportToCSV = () => {
    // In a real implementation, you would call an API endpoint to export data
    alert("Fonctionnalité d'export à implémenter");
  };

  const importFromCSV = (e) => {
    // In a real implementation, you would handle file upload and import
    alert("Fonctionnalité d'import à implémenter");
    e.target.value = null; // Reset file input
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestion des Centres de Santé</h2>
            <div>
              <button className="btn btn-success me-2" onClick={handleAddNew}>
                <FaPlus className="me-2" />
                Ajouter un centre
              </button>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary"
                  onClick={exportToCSV}
                >
                  <FaDownload className="me-2" />
                  Exporter
                </button>
                <label className="btn btn-outline-secondary mb-0">
                  <FaUpload className="me-2" />
                  Importer
                  <input
                    type="file"
                    className="d-none"
                    accept=".csv"
                    onChange={importFromCSV}
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher des centres de santé..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Tous les types</option>
                    {facilityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              {filteredFacilities.length === 0 ? (
                <div className="text-center py-5">
                  <h4 className="text-muted">Aucun centre de santé trouvé</h4>
                  <p className="text-muted">
                    {searchTerm || typeFilter !== "all"
                      ? "Aucun centre ne correspond à vos critères de recherche."
                      : "Aucun centre de santé n'a été ajouté pour le moment."}
                  </p>
                  <button className="btn btn-primary" onClick={handleAddNew}>
                    <FaPlus className="me-2" />
                    Ajouter un centre
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Adresse</th>
                        <th>Contact</th>
                        <th>Coordonnées</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFacilities.map((facility) => (
                        <tr key={facility.id}>
                          <td>
                            <strong>{facility.nom}</strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {getFacilityTypeLabel(facility.type)}
                            </span>
                          </td>
                          <td>{facility.adresse}</td>
                          <td>
                            {facility.telephone && (
                              <div>Tél: {facility.telephone}</div>
                            )}
                            {facility.email && (
                              <div>Email: {facility.email}</div>
                            )}
                          </td>
                          <td>
                            <small>
                              Lat: {facility.latitude}
                              <br />
                              Lng: {facility.longitude}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-outline-success btn-sm me-1"
                                onClick={() => handleEdit(facility)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(facility.id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Facility Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentFacility ? "Modifier le centre" : "Ajouter un centre"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nom *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Type *</label>
                        <select
                          className="form-select"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        >
                          {facilityTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Adresse *</label>
                    <textarea
                      className="form-control"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      rows="2"
                      required
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="text"
                          className="form-control"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Site web</label>
                    <input
                      type="url"
                      className="form-control"
                      name="site_web"
                      value={formData.site_web}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Latitude *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Longitude *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {currentFacility ? "Mettre à jour" : "Ajouter"}
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

export default HealthCentersAdmin;
