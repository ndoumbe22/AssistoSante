import React, { useState, useEffect } from 'react';
import { FaBell, FaBellSlash, FaCheckCircle, FaTimesCircle, FaBan } from 'react-icons/fa';
import api from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      const notificationsData = response.data;
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.lu).length);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/mark-as-read/`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-as-read/');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'article_valide':
        return <FaCheckCircle className="text-success" />;
      case 'article_refuse':
        return <FaTimesCircle className="text-danger" />;
      case 'article_desactive':
        return <FaBan className="text-warning" />;
      default:
        return <FaBell />;
    }
  };

  // Get badge class based on notification type
  const getBadgeClass = (type) => {
    switch (type) {
      case 'article_valide':
        return 'bg-success';
      case 'article_refuse':
        return 'bg-danger';
      case 'article_desactive':
        return 'bg-warning text-dark';
      default:
        return 'bg-primary';
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="position-relative">
      <button 
        className="btn btn-link text-decoration-none position-relative p-0"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label="Notifications"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount}
            <span className="visually-hidden">notifications non lues</span>
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="position-absolute end-0 mt-2" style={{ width: '350px', zIndex: 1000 }}>
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Notifications</h6>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-sm btn-light"
                  onClick={markAllAsRead}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            
            <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="text-center p-3">
                  <FaBellSlash className="text-muted mb-2" size={24} />
                  <p className="mb-0 text-muted">Aucune notification</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`list-group-item ${!notification.lu ? 'bg-light' : ''}`}
                    >
                      <div className="d-flex">
                        <div className="me-3 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{notification.titre}</h6>
                            {!notification.lu && (
                              <button 
                                className="btn btn-sm btn-outline-primary py-0 px-3"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                          <p className="mb-1">{notification.message}</p>
                          <small className="text-muted">
                            <span className={`badge ${getBadgeClass(notification.type)} me-2`}>
                              {notification.article_titre}
                            </span>
                            {new Date(notification.date_creation).toLocaleDateString('fr-FR')}
                          </small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {showNotifications && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          onClick={() => setShowNotifications(false)}
          style={{ zIndex: 999 }}
        />
      )}
    </div>
  );
};

export default NotificationBell;