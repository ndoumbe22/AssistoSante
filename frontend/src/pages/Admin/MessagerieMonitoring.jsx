import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaSearch, FaFilter, FaUser, FaUserMd, FaExclamationTriangle } from "react-icons/fa";
import messageService from "../../services/messageService";

function MessagerieMonitoring() {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, urgent, unresolved

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Filter conversations
  useEffect(() => {
    let result = conversations;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(conv => 
        conv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filter === "urgent") {
      result = result.filter(conv => conv.is_urgent);
    } else if (filter === "unresolved") {
      result = result.filter(conv => conv.is_unresolved);
    }
    
    setFilteredConversations(result);
  }, [searchTerm, filter, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call an admin endpoint
      // For now, let's try to fetch real data and fallback to mock data if needed
      try {
        // This would need a specific admin endpoint for monitoring conversations
        // For demonstration, we'll still use mock data but with a real API structure
        const mockData = [
          {
            id: 1,
            patient_name: "Aminata Fall",
            doctor_name: "Dr. Martin Diop",
            last_message: "Bonjour docteur, j'ai des douleurs thoraciques depuis hier soir.",
            last_message_time: "2023-10-15T14:30:00",
            is_urgent: true,
            is_unresolved: false,
            unread_count: 0
          },
          {
            id: 2,
            patient_name: "Mamadou Sow",
            doctor_name: "Dr. Fatou Ndiaye",
            last_message: "Merci pour votre réponse. Je vais suivre vos conseils.",
            last_message_time: "2023-10-14T11:15:00",
            is_urgent: false,
            is_unresolved: false,
            unread_count: 0
          },
          {
            id: 3,
            patient_name: "Fatou Ndiaye",
            doctor_name: "Dr. Mamadou Fall",
            last_message: "Urgent: Le patient a des symptômes graves et n'a pas de réponse.",
            last_message_time: "2023-10-13T09:45:00",
            is_urgent: true,
            is_unresolved: true,
            unread_count: 2
          }
        ];
        setConversations(mockData);
      } catch (apiError) {
        console.error("API Error:", apiError);
        // Fallback to mock data
        const mockData = [
          {
            id: 1,
            patient_name: "Aminata Fall",
            doctor_name: "Dr. Martin Diop",
            last_message: "Bonjour docteur, j'ai des douleurs thoraciques depuis hier soir.",
            last_message_time: "2023-10-15T14:30:00",
            is_urgent: true,
            is_unresolved: false,
            unread_count: 0
          },
          {
            id: 2,
            patient_name: "Mamadou Sow",
            doctor_name: "Dr. Fatou Ndiaye",
            last_message: "Merci pour votre réponse. Je vais suivre vos conseils.",
            last_message_time: "2023-10-14T11:15:00",
            is_urgent: false,
            is_unresolved: false,
            unread_count: 0
          },
          {
            id: 3,
            patient_name: "Fatou Ndiaye",
            doctor_name: "Dr. Mamadou Fall",
            last_message: "Urgent: Le patient a des symptômes graves et n'a pas de réponse.",
            last_message_time: "2023-10-13T09:45:00",
            is_urgent: true,
            is_unresolved: true,
            unread_count: 2
          }
        ];
        setConversations(mockData);
      }
    } catch (err) {
      setError("Erreur lors du chargement des conversations");
      console.error(err);
      
      // Final fallback to mock data
      const mockData = [
        {
          id: 1,
          patient_name: "Aminata Fall",
          doctor_name: "Dr. Martin Diop",
          last_message: "Bonjour docteur, j'ai des douleurs thoraciques depuis hier soir.",
          last_message_time: "2023-10-15T14:30:00",
          is_urgent: true,
          is_unresolved: false,
          unread_count: 0
        },
        {
          id: 2,
          patient_name: "Mamadou Sow",
          doctor_name: "Dr. Fatou Ndiaye",
          last_message: "Merci pour votre réponse. Je vais suivre vos conseils.",
          last_message_time: "2023-10-14T11:15:00",
          is_urgent: false,
          is_unresolved: false,
          unread_count: 0
        },
        {
          id: 3,
          patient_name: "Fatou Ndiaye",
          doctor_name: "Dr. Mamadou Fall",
          last_message: "Urgent: Le patient a des symptômes graves et n'a pas de réponse.",
          last_message_time: "2023-10-13T09:45:00",
          is_urgent: true,
          is_unresolved: true,
          unread_count: 2
        }
      ];
      setConversations(mockData);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResolve = (conversationId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, is_unresolved: false } : conv
    ));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
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
              <FaPaperPlane className="me-2" />
              Surveillance de la Messagerie
            </h2>
          </div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          )}
          
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher des conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="form-check me-4">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="filter"
                        id="filterAll"
                        checked={filter === "all"}
                        onChange={() => setFilter("all")}
                      />
                      <label className="form-check-label" htmlFor="filterAll">
                        Toutes
                      </label>
                    </div>
                    <div className="form-check me-4">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="filter"
                        id="filterUrgent"
                        checked={filter === "urgent"}
                        onChange={() => setFilter("urgent")}
                      />
                      <label className="form-check-label" htmlFor="filterUrgent">
                        Urgentes
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="filter"
                        id="filterUnresolved"
                        checked={filter === "unresolved"}
                        onChange={() => setFilter("unresolved")}
                      />
                      <label className="form-check-label" htmlFor="filterUnresolved">
                        Non résolues
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conversations table */}
          <div className="card">
            <div className="card-body">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-5">
                  <h4 className="text-muted">
                    <FaPaperPlane className="me-2" />
                    Aucune conversation trouvée
                  </h4>
                  <p className="text-muted">
                    Aucune conversation ne correspond à vos critères de recherche.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Médecin</th>
                        <th>Dernier message</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConversations.map(conversation => (
                        <tr key={conversation.id}>
                          <td>
                            <FaUser className="me-2" />
                            {conversation.patient_name}
                          </td>
                          <td>
                            <FaUserMd className="me-2" />
                            {conversation.doctor_name}
                          </td>
                          <td className="text-truncate" style={{ maxWidth: "200px" }}>
                            {conversation.last_message}
                          </td>
                          <td>
                            {formatDate(conversation.last_message_time)}
                          </td>
                          <td>
                            {conversation.is_urgent && (
                              <span className="badge bg-warning me-1">
                                <FaExclamationTriangle className="me-1" />
                                Urgent
                              </span>
                            )}
                            {conversation.is_unresolved && (
                              <span className="badge bg-danger">
                                Non résolu
                              </span>
                            )}
                            {!conversation.is_urgent && !conversation.is_unresolved && (
                              <span className="badge bg-success">
                                Résolu
                              </span>
                            )}
                          </td>
                          <td>
                            {conversation.is_unresolved && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleResolve(conversation.id)}
                              >
                                Marquer résolu
                              </button>
                            )}
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
    </div>
  );
}

export default MessagerieMonitoring;