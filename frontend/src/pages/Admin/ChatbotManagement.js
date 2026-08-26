import React, { useState, useEffect } from "react";
import { FaRobot, FaPlus, FaEdit, FaTrash, FaChartBar } from "react-icons/fa";
import chatbotService from "../../services/chatbotService";

function ChatbotManagement() {
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [filteredKnowledgeBase, setFilteredKnowledgeBase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statistics, setStatistics] = useState(null);

  const [formData, setFormData] = useState({
    keyword: "",
    response: "",
    category: "general",
  });

  useEffect(() => {
    loadKnowledgeBase();
    loadStatistics();
  }, []);

  useEffect(() => {
    filterKnowledgeBase();
  }, [searchTerm, knowledgeBase]);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const data = await chatbotService.getKnowledgeBase();
      setKnowledgeBase(data);
    } catch (err) {
      setError(
        "Erreur lors du chargement de la base de connaissances: " +
          (err.response?.data?.error || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await chatbotService.getStatistics();
      setStatistics(data);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  };

  const filterKnowledgeBase = () => {
    let filtered = knowledgeBase;

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredKnowledgeBase(filtered);
  };

  const categories = [
    { value: "general", label: "Général" },
    { value: "symptoms", label: "Symptômes" },
    { value: "services", label: "Services" },
    { value: "emergency", label: "Urgences" },
    { value: "medication", label: "Médicaments" },
  ];

  const getCategoryLabel = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentEntry) {
        // Update existing entry
        await chatbotService.updateKnowledgeBaseEntry(currentEntry.id, formData);
        loadKnowledgeBase();
        setShowEditModal(false);
      } else {
        // Add new entry
        await chatbotService.addKnowledgeBaseEntry(formData);
        loadKnowledgeBase();
        setShowAddModal(false);
      }

      setFormData({ keyword: "", response: "", category: "general" });
      setCurrentEntry(null);
      alert(currentEntry ? "Entrée mise à jour" : "Entrée ajoutée");
    } catch (err) {
      alert(
        "Erreur lors de l'enregistrement: " +
          (err.response?.data?.error || err.message)
      );
      console.error(err);
    }
  };

  const handleEdit = (entry) => {
    setCurrentEntry(entry);
    setFormData({
      keyword: entry.keyword,
      response: entry.response,
      category: entry.category,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (entryId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      try {
        await chatbotService.deleteKnowledgeBaseEntry(entryId);
        loadKnowledgeBase();
        alert("Entrée supprimée");
      } catch (err) {
        alert(
          "Erreur lors de la suppression: " +
            (err.response?.data?.error || err.message)
        );
        console.error(err);
      }
    }
  };

  const handleAddNew = () => {
    setCurrentEntry(null);
    setFormData({ keyword: "", response: "", category: "general" });
    setShowAddModal(true);
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
            <h2>
              <FaRobot className="me-2" />
              Gestion du Chatbot Médical
            </h2>
            <button className="btn btn-primary" onClick={handleAddNew}>
              <FaPlus className="me-2" />
              Ajouter une réponse
            </button>
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

          {/* Statistics */}
          {statistics && (
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5 className="card-title">Conversations</h5>
                    <h2>{statistics.total_conversations}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5 className="card-title">Utilisateurs</h5>
                    <h2>{statistics.total_users}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white">
                  <div className="card-body">
                    <h5 className="card-title">Temps réponse</h5>
                    <h2>{statistics.avg_response_time}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-dark">
                  <div className="card-body">
                    <h5 className="card-title">Questions fréquentes</h5>
                    <h2>{statistics.top_questions.length}</h2>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Questions */}
          {statistics && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>
                  <FaChartBar className="me-2" />
                  Questions les plus fréquentes
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Nombre de fois</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.top_questions.map((question, index) => (
                        <tr key={index}>
                          <td>{question.question}</td>
                          <td>{question.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Base Management */}
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5>Base de connaissances</h5>
                <div className="input-group" style={{ width: "300px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="card-body">
              {filteredKnowledgeBase.length === 0 ? (
                <div className="text-center py-5">
                  <h4 className="text-muted">
                    <FaRobot className="me-2" />
                    Aucune entrée dans la base de connaissances
                  </h4>
                  <p className="text-muted">
                    {searchTerm
                      ? "Aucune entrée ne correspond à votre recherche."
                      : "Commencez par ajouter des réponses à la base de connaissances."}
                  </p>
                  <button className="btn btn-primary" onClick={handleAddNew}>
                    <FaPlus className="me-2" />
                    Ajouter votre première réponse
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Mot-clé</th>
                        <th>Catégorie</th>
                        <th>Réponse</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKnowledgeBase.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <strong>{entry.keyword}</strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {getCategoryLabel(entry.category)}
                            </span>
                          </td>
                          <td>
                            <div
                              className="text-truncate"
                              style={{ maxWidth: "300px" }}
                              title={entry.response}
                            >
                              {entry.response}
                            </div>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-outline-success btn-sm me-1"
                                onClick={() => handleEdit(entry)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(entry.id)}
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentEntry ? "Modifier la réponse" : "Ajouter une réponse"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Mot-clé *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="keyword"
                      value={formData.keyword}
                      onChange={handleInputChange}
                      placeholder="Entrez un mot-clé ou une phrase"
                      required
                    />
                    <div className="form-text">
                      Le mot-clé déclenchera cette réponse (ex: "fièvre",
                      "rendez-vous")
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Catégorie</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Réponse *</label>
                    <textarea
                      className="form-control"
                      name="response"
                      value={formData.response}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Entrez la réponse du chatbot"
                      required
                    ></textarea>
                    <div className="form-text">
                      La réponse que le chatbot donnera lorsque le mot-clé est
                      détecté
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {currentEntry ? "Mettre à jour" : "Ajouter"}
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

export default ChatbotManagement;
