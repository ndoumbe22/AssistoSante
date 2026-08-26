import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBell, FaTrash, FaCheck, FaSearch } from "react-icons/fa";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les notifications depuis l'API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Dans une vraie application, ces données viendraient de l'API
        // Pour l'instant, utilisons des données statiques
        const mockNotifications = [
          {
            id: 1,
            titre: "Nouveau rendez-vous",
            contenu: "Awa Diop a pris un rendez-vous avec vous pour le 20 octobre 2023 à 10h00.",
            date: "2023-10-18T14:30:00",
            lu: false,
            type: "rendezvous"
          },
          {
            id: 2,
            titre: "Résultats d'analyse disponibles",
            contenu: "Les résultats d'analyse de Mamadou Fall sont maintenant disponibles dans son dossier.",
            date: "2023-10-18T10:15:00",
            lu: true,
            type: "analyse"
          },
          {
            id: 3,
            titre: "Rappel de rendez-vous",
            contenu: "Vous avez un rendez-vous avec Fatou Ndiaye aujourd'hui à 09h00.",
            date: "2023-10-18T08:00:00",
            lu: true,
            type: "rappel"
          },
          {
            id: 4,
            titre: "Nouveau message",
            contenu: "Vous avez reçu un message de Cheikh Sow concernant son traitement.",
            date: "2023-10-17T16:45:00",
            lu: false,
            type: "message"
          },
          {
            id: 5,
            titre: "Mise à jour du dossier",
            contenu: "Le dossier de Awa Diop a été mis à jour avec de nouvelles informations.",
            date: "2023-10-17T11:20:00",
            lu: true,
            type: "dossier"
          },
          {
            id: 6,
            titre: "Congé approuvé",
            contenu: "Votre demande de congé du 25 au 27 octobre a été approuvée.",
            date: "2023-10-16T09:30:00",
            lu: true,
            type: "conge"
          }
        ];
        
        setNotifications(mockNotifications);
        setFilteredNotifications(mockNotifications);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des notifications");
        setLoading(false);
        console.error("Erreur lors du chargement des notifications :", err);
      }
    };

    fetchNotifications();
  }, []);

  // Filtrer selon recherche
  useEffect(() => {
    const filtered = notifications.filter(
      notification =>
        notification.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.contenu.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotifications(filtered);
  }, [searchTerm, notifications]);

  const markAsRead = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put(`/api/notifications/${id}/read/`, {}, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, lu: true } : notif
        )
      );
    } catch (error) {
      console.error("Erreur lors du marquage comme lu :", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.put('/api/notifications/read-all/', {}, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, lu: true }))
      );
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues :", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete(`/api/notifications/${id}/`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification :", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      // Dans une vraie application, cela enverrait une requête à l'API
      // await axios.delete('/api/notifications/all/', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      // });
      
      setNotifications([]);
    } catch (error) {
      console.error("Erreur lors de la suppression de toutes les notifications :", error);
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "rendezvous":
        return <FaBell className="me-2" />;
      case "analyse":
        return <FaBell className="me-2" />;
      case "rappel":
        return <FaBell className="me-2" />;
      case "message":
        return <FaBell className="me-2" />;
      case "dossier":
        return <FaBell className="me-2" />;
      case "conge":
        return <FaBell className="me-2" />;
      default:
        return <FaBell className="me-2" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "rendezvous":
        return "border-left-success";
      case "analyse":
        return "border-left-info";
      case "rappel":
        return "border-left-warning";
      case "message":
        return "border-left-primary";
      case "dossier":
        return "border-left-secondary";
      case "conge":
        return "border-left-success";
      default:
        return "border-left-secondary";
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
            <h5>Notifications</h5>
            <ul className="list-group">
              <li className="list-group-item active">Toutes les notifications</li>
              <li className="list-group-item">Non lues</li>
              <li className="list-group-item">Rendez-vous</li>
              <li className="list-group-item">Messages</li>
            </ul>
          </div>
          
          <div className="card shadow-sm p-3">
            <h5>Statistiques</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Total:</span>
              <span className="fw-bold">{notifications.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Non lues:</span>
              <span className="fw-bold text-danger">
                {notifications.filter(n => !n.lu).length}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Lues:</span>
              <span className="fw-bold text-success">
                {notifications.filter(n => n.lu).length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Centre de Notifications</h2>
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
                className="btn btn-outline-success me-2"
                onClick={markAllAsRead}
                disabled={notifications.filter(n => !n.lu).length === 0}
              >
                <FaCheck className="me-2" /> Tout marquer comme lu
              </button>
              <button 
                className="btn btn-outline-danger"
                onClick={deleteAllNotifications}
                disabled={notifications.length === 0}
              >
                <FaTrash className="me-2" /> Tout supprimer
              </button>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="card shadow-sm p-5 text-center">
              <h4>Aucune notification</h4>
              <p>Vous n'avez aucune notification pour le moment.</p>
            </div>
          ) : (
            <div className="row">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="col-md-12 mb-3">
                  <div className={`card shadow-sm p-3 ${!notification.lu ? 'border-start border-4 border-success' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          {getNotificationIcon(notification.type)}
                          <h6 className="mb-0">{notification.titre}</h6>
                          {!notification.lu && (
                            <span className="badge bg-success ms-2">Nouveau</span>
                          )}
                        </div>
                        <p className="mb-2">{notification.contenu}</p>
                        <small className="text-muted">{formatDate(notification.date)}</small>
                      </div>
                      <div>
                        {!notification.lu && (
                          <button 
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;