import React, { createContext, useState, useContext, useEffect } from "react";
import notificationService from "../services/notificationService";
import webSocketService from "../services/webSocketService";
import pushNotificationService from "../services/pushNotificationService";
import appointmentReminderService from "../services/appointmentReminderService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications when component mounts
  useEffect(() => {
    loadNotifications();
    // connectWebSocket();
    initAppointmentReminders();

    // Cleanup on unmount
    return () => {
      // webSocketService.disconnect();
      appointmentReminderService.stopPeriodicCheck();
    };
  }, []);

  const initAppointmentReminders = () => {
    appointmentReminderService.init();

    // Listen for appointment reminders
    window.addEventListener("appointmentReminder", (event) => {
      addNotification(event.detail);
    });
  };

  const connectWebSocket = () => {
    // WebSocket désactivé temporairement
    return;

    /*
    // In a real implementation, you would use the actual user ID
    const userId = localStorage.getItem("user_id") || "1";
    const wsUrl = `ws://localhost:8000/ws/notifications/${userId}/`;

    webSocketService.connect(wsUrl);

    // Listen for new notifications
    webSocketService.onNotification((notification) => {
      addNotification(notification);

      // Show push notification
      pushNotificationService.showNotification(
        notification.title || "Nouvelle notification",
        {
          body: notification.message || "Vous avez une nouvelle notification",
          icon: "/images/logo.png",
          badge: "/images/logo.png",
          data: { url: notification.url },
        }
      );
    });

    // Listen for medication reminders
    webSocketService.onMedicationReminder((reminder) => {
      const notification = {
        id: Date.now(),
        title: "Rappel de médicament",
        message: `C'est l'heure de prendre ${reminder.medicament} (${reminder.dosage})`,
        type: "medication_reminder",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      addNotification(notification);

      // Show push notification with sound
      pushNotificationService.showNotification("💊 Rappel de médicament", {
        body: `C'est l'heure de prendre ${reminder.medicament} (${reminder.dosage})`,
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        data: { url: "/patient/medication-reminders" },
        tag: "medication-reminder",
        renotify: true,
        requireInteraction: true,
      });

      // Play sound
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch((e) => console.log("Audio play failed:", e));
      } catch (e) {
        console.log("Sound playback failed:", e);
      }
    });
    */
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  };

  const clearAll = async () => {
    try {
      // In a real implementation, you might want to delete all notifications
      // For now, we'll just mark all as read
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur lors du nettoyage des notifications:", error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    clearAll,
    refreshNotifications: loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
