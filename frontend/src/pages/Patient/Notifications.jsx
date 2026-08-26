import React, { useState, useEffect } from "react";
import { FaBell, FaCheck, FaTrash, FaFilter, FaSearch, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";

function Notifications() {
  const { notifications, markAsRead, clearAll, loading } = useNotifications();
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  useEffect(() => {
    let filtered = notifications;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(notification => notification.type === filterType);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [notifications, searchTerm, filterType]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-success" />;
      case "warning":
        return <FaExclamationCircle className="text-warning" />;
      case "error":
        return <FaExclamationCircle className="text-danger" />;
      case "medication_reminder":
        return <FaBell className="text-info" />;
      case "rendez_vous":
        return <FaBell className="text-primary" />;
      case "message":
        return <FaBell className="text-success" />;
      case "article":
        return <FaBell className="text-warning" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "medication_reminder":
        return "Rappel médicament";
      case "rendez_vous":
        return "Rendez-vous";
      case "message":
        return "Message";
      case "article":
        return "Article";
      default:
        return "Notification";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  // Pagination
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleMarkAllAsRead = () => {
    clearAll();
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  const handleDeleteNotification = (id) => {
    // In a real implementation, you would call a delete API
    console.log("Delete notification:", id);
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
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
              <FaBell className="me-2" />
              Centre de Notifications
            </h2>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button 
                className="btn btn-outline-primary"
                onClick={handleMarkAllAsRead}
              >
                <FaCheck className="me-2" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher dans les notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaFilter />
                    </span>
                    <select
                      className="form-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">Tous les types</option>
                      <option value="medication_reminder">Rappels médicaments</option>
                      <option value="rendez_vous">Rendez-vous</option>
                      <option value="message">Messages</option>
                      <option value="article">Articles</option>
                      <option value="success">Succès</option>
                      <option value="warning">Avertissements</option>
                      <option value="error">Erreurs</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Total</h5>
                      <h2>{notifications.length}</h2>
                    </div>
                    <FaBell size={30} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Non lues</h5>
                      <h2>{notifications.filter(n => !n.is_read).length}</h2>
                    </div>
                    <FaBell size={30} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Lues</h5>
                      <h2>{notifications.filter(n => n.is_read).length}</h2>
                    </div>
                    <FaCheck size={30} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Filtres</h5>
                      <h2>{filteredNotifications.length}</h2>
                    </div>
                    <FaFilter size={30} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <FaBell size={48} className="text-muted mb-3" />
                <h4 className="text-muted">Aucune notification</h4>
                <p className="text-muted">
                  {searchTerm || filterType !== "all" 
                    ? "Aucune notification ne correspond à vos critères de recherche." 
                    : "Vous n'avez aucune notification pour le moment."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="card-body">
                  <div className="list-group">
                    {currentNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`list-group-item ${!notification.is_read ? "bg-light" : ""}`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div>
                              <div className="d-flex align-items-center mb-1">
                                <h5 className="mb-0 me-2">{notification.title}</h5>
                                <span className="badge bg-secondary">
                                  {getNotificationTypeLabel(notification.type)}
                                </span>
                                {!notification.is_read && (
                                  <span className="badge bg-danger ms-2">Non lu</span>
                                )}
                              </div>
                              <p className="mb-2">{notification.message}</p>
                              <div className="d-flex align-items-center">
                                <small className="text-muted me-3">
                                  <FaBell className="me-1" />
                                  {formatTime(notification.created_at)}
                                </small>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex">
                            {!notification.is_read && (
                              <button
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Marquer comme lu"
                              >
                                <FaCheck />
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteNotification(notification.id)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Précédent
                      </button>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <li 
                        key={pageNumber} 
                        className={`page-item ${currentPage === pageNumber ? "active" : ""}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Suivant
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;