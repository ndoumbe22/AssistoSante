import api from "./api";

class NotificationService {
  // Get all notifications for the user
  async getNotifications() {
    try {
      // const response = await api.get("/notifications/");
      // return response.data;

      // Retourner un tableau vide temporairement
      return [];
    } catch (error) {
      throw error;
    }
  }

  // Mark a notification as read
  async markAsRead(id) {
    try {
      // const response = await api.post(`/notifications/${id}/mark-read/`);
      // return response.data;

      // Retourner un objet vide temporairement
      return {};
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      // const response = await api.post("/notifications/mark-all-read/");
      // return response.data;

      // Retourner un objet vide temporairement
      return {};
    } catch (error) {
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(id) {
    try {
      // const response = await api.delete(`/notifications/${id}/`);
      // return response.data;

      // Retourner un objet vide temporairement
      return {};
    } catch (error) {
      throw error;
    }
  }

  // Send a notification (admin only)
  async sendNotification(notificationData) {
    try {
      // const response = await api.post(
      //   "/admin/notifications/",
      //   notificationData
      // );
      // return response.data;

      // Retourner un objet vide temporairement
      return {};
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationService();
