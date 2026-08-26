import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaPaperPlane, FaTrash, FaReply, FaSearch, FaFilter } from "react-icons/fa";
import messageService from "../../services/messageService";

function BoiteMessages() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [newMessage, setNewMessage] = useState({ to: "", subject: "", content: "" });
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Get real messages from the API
        const response = await messageService.getMessages();
        setMessages(response.data);
        setFilteredMessages(response.data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des messages: " + (err.response?.data?.error || err.message));
        setLoading(false);
        console.error("Erreur lors du chargement des messages :", err);
      }
    };

    fetchMessages();
  }, [isAuthenticated, user]);

  // Filtrer les messages selon la recherche et le filtre
  useEffect(() => {
    let result = messages;
    
    // Filtrer selon la recherche
    if (searchTerm) {
      result = result.filter(message => 
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.from.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer selon le type
    if (filter !== "all") {
      result = result.filter(message => message.folder === filter);
    }
    
    setFilteredMessages(result);
  }, [searchTerm, filter, messages]);

  const handleDeleteMessage = async (id) => {
    try {
      await messageService.deleteMessage(id);
      setMessages(prev => prev.filter(msg => msg.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      setError("Erreur lors de la suppression du message: " + (err.response?.data?.error || err.message));
      console.error("Erreur lors de la suppression du message :", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      // Send message through the API
      const messageData = {
        to: newMessage.to,
        subject: newMessage.subject,
        content: newMessage.content
      };
      
      const response = await messageService.sendMessage(messageData);
      
      // Add the sent message to the list
      setMessages(prev => [...prev, response.data]);
      setNewMessage({ to: "", subject: "", content: "" });
      setShowCompose(false);
    } catch (err) {
      setError("Erreur lors de l'envoi du message: " + (err.response?.data?.error || err.message));
      console.error("Erreur lors de l'envoi du message :", err);
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

  const markAsRead = async (id) => {
    try {
      await messageService.markAsRead(id);
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, read: true } : msg
      ));
      
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => ({ ...prev, read: true }));
      }
    } catch (err) {
      console.error("Erreur lors du marquage comme lu :", err);
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
          <div className="card shadow-sm">
            <div className="card-body">
              <button 
                className="btn btn-success w-100 mb-4"
                onClick={() => setShowCompose(true)}
              >
                <FaPaperPlane className="me-2" /> Nouveau message
              </button>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Boîte de réception</h5>
                  <span className="badge bg-success">
                    {messages.filter(m => m.folder === "inbox" && !m.read).length}
                  </span>
                </div>
                
                <ul className="list-group">
                  <li 
                    className={`list-group-item ${filter === "all" ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setFilter("all")}
                  >
                    Tous les messages
                  </li>
                  <li 
                    className={`list-group-item ${filter === "inbox" ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setFilter("inbox")}
                  >
                    Boîte de réception
                  </li>
                  <li 
                    className={`list-group-item ${filter === "sent" ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setFilter("sent")}
                  >
                    Messages envoyés
                  </li>
                </ul>
              </div>
              
              <div>
                <h5>Filtres</h5>
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
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
          </div>
        </div>
        
        {/* Liste des messages */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Messages</h5>
                <button className="btn btn-sm btn-outline-secondary">
                  <FaFilter />
                </button>
              </div>
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
                      className={`list-group-item ${selectedMessage && selectedMessage.id === message.id ? "active" : ""} ${!message.read ? "fw-bold" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.read) markAsRead(message.id);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              {message.folder === "inbox" ? message.from : `À: ${message.to}`}
                            </div>
                            {!message.read && (
                              <span className="badge bg-success rounded-pill">●</span>
                            )}
                          </div>
                          <div className="small text-muted">{message.subject}</div>
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
        <div className="col-md-5">
          {selectedMessage ? (
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedMessage.subject}</h5>
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-2">
                    <FaReply />
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
                    <strong>
                      {selectedMessage.folder === "inbox" ? selectedMessage.from : `À: ${selectedMessage.to}`}
                    </strong>
                    <div className="small text-muted">
                      {formatDate(selectedMessage.date)}
                    </div>
                  </div>
                </div>
                <div className="border-top pt-3">
                  {selectedMessage.content}
                </div>
                <div className="mt-4">
                  <button className="btn btn-success">
                    <FaReply className="me-2" /> Répondre
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <div className="mb-3">
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }} className="mx-auto">
                      <FaPaperPlane size={40} color="#2E7D32" />
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
      
      {/* Modal de composition */}
      {showCompose && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nouveau message</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCompose(false)}
                ></button>
              </div>
              <form onSubmit={handleSendMessage}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">À</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMessage.to}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sujet</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows="8"
                      value={newMessage.content}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCompose(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success">
                    <FaPaperPlane className="me-2" /> Envoyer
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

export default BoiteMessages;