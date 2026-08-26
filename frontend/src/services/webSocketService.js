class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = {};
  }

  connect(url) {
    // WebSocket désactivé temporairement
    return;

    /*
    if (this.socket && this.isConnected) {
      console.log("WebSocket already connected");
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = (event) => {
        console.log("WebSocket connected to:", url);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit("connected", event);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          this.emit("message", data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket closed:", event);
        this.isConnected = false;
        this.emit("disconnected", event);

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(
              `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            this.connect(url);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emit("error", error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.emit("error", error);
    }
    */
  }

  disconnect() {
    // WebSocket désactivé temporairement
    return;

    /*
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
    */
  }

  send(data) {
    // WebSocket désactivé temporairement
    return;

    /*
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
      }
    } else {
      console.warn("WebSocket not connected. Cannot send message.");
    }
    */
  }

  // Event listener methods
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  // Specific methods for notification events
  onNotification(callback) {
    this.on("message", (data) => {
      if (data.type === "notification") {
        callback(data.payload);
      }
    });
  }

  onMedicationReminder(callback) {
    this.on("message", (data) => {
      if (data.type === "medication_reminder") {
        callback(data.payload);
      }
    });
  }

  onAppointmentUpdate(callback) {
    this.on("message", (data) => {
      if (data.type === "appointment_update") {
        callback(data.payload);
      }
    });
  }

  // Specific method for message events
  onMessage(callback) {
    this.on("message", (data) => {
      // Handle both direct message format and wrapped format
      if (data.type === "message") {
        callback(data.payload);
      } else if (data.content && data.timestamp) {
        // Direct message format
        callback(data);
      }
    });
  }
}

// Export singleton instance
export default new WebSocketService();
