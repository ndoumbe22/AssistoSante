import React from "react";
import { FaBell, FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";
import { Link } from "react-router-dom";

function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);

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

  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to the notification URL if it exists
    if (notification.url) {
      window.location.hash = notification.url;
    }
    
    // Close the dropdown
    setIsOpen(false);
  };

  return (
    <div className="position-relative">
      <button
        className="btn btn-light rounded-circle position-relative"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: "40px", height: "40px" }}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.6rem" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
          style={{ 
            width: "350px", 
            maxHeight: "500px", 
            zIndex: 1000,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={clearAll}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div 
            className="overflow-auto" 
            style={{ maxHeight: "350px" }}
          >
            {notifications.length === 0 ? (
              <div className="text-center p-3 text-muted">
                Aucune notification
              </div>
            ) : (
              <>
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 border-bottom ${!notification.is_read ? "bg-light" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-start">
                        <div className="me-2 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <p className="mb-1 fw-medium">
                            {notification.title}
                          </p>
                          <p className="mb-1 text-muted" style={{ fontSize: "0.85rem" }}>
                            {notification.message}
                          </p>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-secondary me-2" style={{ fontSize: "0.7rem" }}>
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Marquer comme lu"
                        >
                          <FaCheckCircle size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 text-center border-top">
            <Link 
              to="/patient/notifications" 
              className="btn btn-sm btn-outline-primary w-100"
              onClick={() => setIsOpen(false)}
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;