import webSocketService from "./webSocketService";
import pushNotificationService from "./pushNotificationService";

class AppointmentReminderService {
  constructor() {
    this.reminders = [];
    this.checkInterval = null;
  }

  // Initialize the service
  init() {
    // Listen for appointment updates via WebSocket
    webSocketService.onAppointmentUpdate((appointment) => {
      this.handleAppointmentUpdate(appointment);
    });

    // Start periodic checking for reminders
    this.startPeriodicCheck();
  }

  // Handle appointment updates from WebSocket
  handleAppointmentUpdate(appointment) {
    // If it's a confirmed appointment, add it to reminders
    if (appointment.statut === "CONFIRMED") {
      this.addAppointmentReminder(appointment);
    } else {
      // If it's not confirmed, remove it from reminders
      this.removeReminder(appointment.id);
    }
  }

  // Add an appointment to the reminder system
  addAppointmentReminder(appointment) {
    // Remove any existing reminder for this appointment
    this.removeReminder(appointment.id);
    
    // Only add reminders for confirmed appointments
    if (appointment.statut !== "CONFIRMED") {
      return;
    }

    // Calculate reminder times
    const appointmentDate = new Date(appointment.date + 'T' + appointment.heure);
    const oneDayBefore = new Date(appointmentDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    const oneHourBefore = new Date(appointmentDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    // Add reminders to the list
    this.reminders.push({
      id: appointment.id,
      appointment: appointment,
      reminders: [
        {
          time: oneDayBefore,
          type: "one_day_before",
          triggered: false
        },
        {
          time: oneHourBefore,
          type: "one_hour_before",
          triggered: false
        }
      ]
    });
  }

  // Start periodic checking for reminders
  startPeriodicCheck() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000); // 1 minute
  }

  // Check if any reminders should be triggered
  checkReminders() {
    const now = new Date();
    
    this.reminders.forEach(reminder => {
      reminder.reminders.forEach(r => {
        if (!r.triggered && now >= r.time) {
          this.triggerReminder(reminder.appointment, r.type);
          r.triggered = true;
        }
      });
    });
  }

  // Trigger a reminder notification
  triggerReminder(appointment, reminderType) {
    let title, message;
    
    switch (reminderType) {
      case "one_day_before":
        title = "Rappel de rendez-vous";
        message = `Votre rendez-vous avec le Dr. ${appointment.medecin_nom} est prévu demain à ${appointment.heure}`;
        break;
      case "one_hour_before":
        title = "Rappel de rendez-vous imminent";
        message = `Votre rendez-vous avec le Dr. ${appointment.medecin_nom} est prévu dans une heure à ${appointment.heure}`;
        break;
      default:
        return;
    }

    // Create notification object
    const notification = {
      id: Date.now(),
      title: title,
      message: message,
      type: "appointment_reminder",
      is_read: false,
      created_at: new Date().toISOString(),
      data: {
        appointment_id: appointment.id,
        appointment_date: appointment.date,
        appointment_time: appointment.heure
      }
    };

    // Dispatch custom event for notification
    window.dispatchEvent(new CustomEvent('appointmentReminder', {
      detail: notification
    }));

    // Show push notification
    pushNotificationService.showNotification(title, {
      body: message,
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      data: { 
        url: "/patient/rendez-vous",
        appointment_id: appointment.id
      },
      tag: `appointment-${appointment.id}`,
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
  }

  // Remove a reminder (when appointment is cancelled or completed)
  removeReminder(appointmentId) {
    this.reminders = this.reminders.filter(r => r.id !== appointmentId);
  }

  // Clear all reminders
  clearReminders() {
    this.reminders = [];
  }

  // Stop periodic checking
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Export singleton instance
export default new AppointmentReminderService();