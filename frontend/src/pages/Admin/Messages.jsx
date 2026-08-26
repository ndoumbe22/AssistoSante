import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaComments, FaSearch, FaTrash, FaReply, FaEye } from "react-icons/fa";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les messages depuis l'API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockMessages = [
          {
            id: 1,
            nom: "Diop",
            prenom: "Awa",
            email: "awa.diop@email.com",
            sujet: "Question sur mon rendez-vous",
            message: "Bonjour, j'aimerais savoir si mon rendez-vous du 20 octobre est toujours confirmé. Merci.",
            date: "2023-10-18T14:30:00",
            lu: false,
            repondu: false
          },
          {
            id: 2,
            nom: "Fall",
            prenom: "Mamadou",
            email: "mamadou.fall@email.com",
            sujet: "Problème de connexion",
            message: "Je n'arrive plus à me connecter à mon compte. Pouvez-vous m'aider ?",
            date: "2023-10-18T10:15:00",
            lu: true,
            repondu: true
          },
          {
            id: 3,
            nom: "Ndiaye",
            prenom: "Fatou",
            email: "fatou.ndiaye@email.com",
            sujet: "Demande d'information",
            message: "Pouvez-vous m'envoyer les horaires d'ouverture de la clinique ?",
            date: "2023-10-17T16:45:00",
            lu: true,
            repondu: false
          },
          {
            id: 4,
            nom: "Sow",
            prenom: "Cheikh",
            email: "cheikh.sow@email.com",
            sujet: "Remarque sur l'application",
            message: "L'application est très pratique, mais il serait utile d'ajouter une fonction de rappel pour les rendez-vous.",
            date: "2023-10-17T11:20:00",
            lu: false,
            repondu: false
          }
        ];
        
        setMessages(mockMessages);
        setFilteredMessages(mockMessages);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des messages");
        setLoading(false);
        console.error("Erreur lors du chargement des messages :", err);
      }
    };

    fetchMessages();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = messages.filter(
      message =>
        `${message.prenom} ${message.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sujet.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMessages(filtered);
  }, [searchTerm, messages]);

  const handleDeleteMessage = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/admin/messages/${id}/delete/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setMessages(prev => prev.filter(message => message.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      setError("Erreur lors de la suppression du message");
      console.error("Erreur lors de la suppression du message :", err);
    }
  };

  const handleReplyMessage = async (e) => {
    e.preventDefault();
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.post(`/api/admin/messages/${selectedMessage.id}/reply/`, { reply: replyMessage }, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setMessages(prev => 
        prev.map(message => 
          message.id === selectedMessage.id ? { ...message, repondu: true } : message
        )
      );
      
      setReplyMessage("");
      setShowReplyModal(false);
    } catch (err) {
      setError("Erreur lors de l'envoi de la réponse");
      console.error("Erreur lors de l'envoi de la réponse :", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/admin/messages/${id}/read/`, {}, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setMessages(prev => 
        prev.map(message => 
          message.id === id ? { ...message, lu: true } : message
        )
      );
      
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => ({ ...prev, lu: true }));
      }
    } catch (err) {
      console.error("Erreur lors du marquage comme lu :", err);
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
            <h5>Gestion des Messages</h5>
            <ul className="list-group">
              <li className="list-group-item active">Tous les messages</li>
              <li className="list-group-item">Messages non lus</li>
              <li className="list-group-item">Messages répondus</li>
              <li className="list-group-item">Messages non répondus</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Total:</span>
              <span className="fw-bold">{messages.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Non lus:</span>
              <span className="fw-bold text-danger">
                {messages.filter(m => !m.lu).length}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Répondus:</span>
              <span className="fw-bold text-success">
                {messages.filter(m => m.repondu).length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Système de Messagerie</h2>
            <div style={{ position: "relative", width: "200px" }}>
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
          </div>

          <div className="row">
            {/* Liste des messages */}
            <div className="col-md-5">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Messages</h5>
                </div>
                <div className="card-body p-0">
                  {filteredMessages.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-muted">Aucun message trouvé</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`list-group-item ${selectedMessage && selectedMessage.id === message.id ? "active" : ""} ${!message.lu ? "fw-bold" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.lu) markAsRead(message.id);
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  {message.prenom} {message.nom}
                                </div>
                                {!message.lu && (
                                  <span className="badge bg-success rounded-pill">●</span>
                                )}
                              </div>
                              <div className="small text-muted">{message.sujet}</div>
                            </div>
                            <div className="text-muted small">
                              {formatDate(message.date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Contenu du message */}
            <div className="col-md-7">
              {selectedMessage ? (
                <div className="card shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{selectedMessage.sujet}</h5>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => {
                          setShowReplyModal(true);
                          setReplyMessage(`Bonjour ${selectedMessage.prenom} ${selectedMessage.nom},\n\n`);
                        }}
                      >
                        <FaReply className="me-1" /> Répondre
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <strong>{selectedMessage.prenom} {selectedMessage.nom}</strong>
                        <div className="small text-muted">{selectedMessage.email}</div>
                      </div>
                      <div className="text-muted small">
                        {formatDate(selectedMessage.date)}
                      </div>
                    </div>
                    <div className="border-top pt-3">
                      {selectedMessage.message}
                    </div>
                    {selectedMessage.repondu && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <strong>Réponse envoyée:</strong>
                        <p className="mb-0">Merci pour votre message. Nous avons bien pris en compte votre demande.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex align-items-center justify-content-center">
                    <div className="text-center">
                      <div className="mb-3">
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }} className="mx-auto">
                          <FaComments size={40} color="#2E7D32" />
                        </div>
                      </div>
                      <h5>Sélectionnez un message</h5>
                      <p className="text-muted">Choisissez un message dans la liste pour le lire</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de réponse */}
      {showReplyModal && selectedMessage && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Répondre à {selectedMessage.prenom} {selectedMessage.nom}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowReplyModal(false)}
                ></button>
              </div>
              <form onSubmit={handleReplyMessage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">À</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedMessage.email}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sujet</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`Re: ${selectedMessage.sujet}`}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows="8"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowReplyModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success">
                    <FaReply className="me-2" /> Envoyer la réponse
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

export default Messages;