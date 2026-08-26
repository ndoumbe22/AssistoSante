class PushNotificationService {
  constructor() {
    this.isSupported = "serviceWorker" in navigator && "PushManager" in window;
  }

  // Request permission for push notifications
  async requestPermission() {
    if (!this.isSupported) {
      console.warn("Push notifications are not supported in this browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  // Check if push notifications are enabled
  isPushEnabled() {
    return Notification.permission === "granted";
  }

  // Show a notification with specific options based on type
  showNotification(title, options = {}) {
    if (!this.isPushEnabled()) {
      console.warn("Push notifications are not enabled");
      return;
    }

    // Default options
    const defaultOptions = {
      body: "",
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      dir: "auto",
      lang: "fr-FR",
      tag: "assitosante-notification",
      renotify: true,
      requireInteraction: true,
      ...options,
    };

    // Add sound for certain notification types
    if (options.data && options.data.type === "medication_reminder") {
      // Try to play sound
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch(e => console.log("Audio play failed:", e));
      } catch (e) {
        console.log("Sound playback failed:", e);
      }
    }

    // Show the notification
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      // Fallback to standard Notification API
      new Notification(title, defaultOptions);
    }
  }

  // Handle incoming push messages
  handlePushMessage(payload) {
    try {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;

      const title = data.title || "Notification AssitoSanté";
      const options = {
        body: data.body || "",
        icon: data.icon || "/images/logo.png",
        badge: data.badge || "/images/logo.png",
        data: data.data || {},
        tag: data.tag || "assitosante-notification",
      };

      this.showNotification(title, options);
    } catch (error) {
      console.error("Error handling push message:", error);
    }
  }

  // Show medication reminder notification
  showMedicationReminder(medicament, dosage) {
    const title = "💊 Rappel de médicament";
    const options = {
      body: `C'est l'heure de prendre ${medicament} (${dosage})`,
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      data: { 
        type: "medication_reminder",
        url: "/patient/medication-reminders"
      },
      tag: "medication-reminder",
      renotify: true,
      requireInteraction: true,
    };

    this.showNotification(title, options);
  }

  // Show appointment notification
  showAppointmentNotification(type, details) {
    let title, body;
    
    switch (type) {
      case "confirmed":
        title = "✅ Rendez-vous confirmé";
        body = `Votre rendez-vous avec ${details.doctor} le ${details.date} à ${details.time} a été confirmé.`;
        break;
      case "cancelled":
        title = "❌ Rendez-vous annulé";
        body = `Votre rendez-vous avec ${details.doctor} le ${details.date} à ${details.time} a été annulé.`;
        break;
      case "reminder":
        title = "📅 Rappel de rendez-vous";
        body = `Votre rendez-vous avec ${details.doctor} est prévu pour aujourd'hui à ${details.time}.`;
        break;
      default:
        title = "📅 Notification de rendez-vous";
        body = "Vous avez une mise à jour concernant votre rendez-vous.";
    }

    const options = {
      body,
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      data: { 
        type: "rendez_vous",
        url: "/patient/rendez-vous"
      },
      tag: "appointment-notification",
      renotify: true,
      requireInteraction: true,
    };

    this.showNotification(title, options);
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY
        ),
      });

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    if (!this.isSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  // Utility function to convert base64 to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushNotificationService();