import api from "./api";

const adminService = {
  getStatistics: async () => {
    try {
      console.log("Fetching admin statistics...");
      const response = await api.get(`admin/statistics/`);
      console.log("Admin statistics response:", response.data);

      // Validate response data structure
      if (!response.data) {
        console.warn(
          "Admin statistics response is empty, returning default structure"
        );
        return {
          total_users: 0,
          total_rendez_vous: 0,
          pending_articles_count: 0,
          rendez_vous_today: 0,
          users_count: 0,
          appointments_count: 0,
          active_today_count: 0,
          pending_appointments_count: 0,
        };
      }

      return response.data;
    } catch (error) {
      console.error(
        "Error fetching admin statistics:",
        error.response?.data || error.message
      );
      // Return default statistics structure to prevent dashboard from breaking
      return {
        total_users: 0,
        total_rendez_vous: 0,
        pending_articles_count: 0,
        rendez_vous_today: 0,
        users_count: 0,
        appointments_count: 0,
        active_today_count: 0,
        pending_appointments_count: 0,
      };
    }
  },

  getUsers: async () => {
    try {
      console.log("Fetching admin users...");
      const response = await api.get(`admin/users/`);
      console.log("Admin users response:", response.data?.length || 0, "users");

      // Validate response data structure
      if (!response.data) {
        console.warn("Admin users response is empty, returning empty array");
        return [];
      }

      // Ensure we return an array
      return Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
    } catch (error) {
      console.error(
        "Error fetching admin users:",
        error.response?.data || error.message
      );
      // Return empty array to prevent dashboard from breaking
      return [];
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post(`admin/users/create/`, userData);
      return response.data;
    } catch (error) {
      console.error(
        "Error creating user:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`admin/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error(
        `Error updating user ${userId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  toggleUserStatus: async (userId) => {
    try {
      const response = await api.put(
        `admin/users/${userId}/toggle-status/`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error toggling user status ${userId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`admin/users/${userId}/delete/`);
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting user ${userId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Appointment Management
  getAppointments: async () => {
    try {
      const response = await api.get(`admin/appointments/`);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching appointments:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  validateAppointment: async (appointmentId) => {
    try {
      const response = await api.post(
        `admin/appointments/${appointmentId}/validate/`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error validating appointment ${appointmentId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.post(
        `admin/appointments/${appointmentId}/cancel/`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error canceling appointment ${appointmentId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  rescheduleAppointment: async (appointmentId, data) => {
    try {
      const response = await api.post(
        `admin/appointments/${appointmentId}/reschedule/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error rescheduling appointment ${appointmentId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getAppointmentStatistics: async () => {
    try {
      const response = await api.get(`admin/appointments/statistics/`);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching appointment statistics:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export { adminService };
