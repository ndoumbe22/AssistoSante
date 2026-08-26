import api from "./api";

const urgenceService = {
  // Patient urgences
  getPatientUrgences: async () => {
    const response = await api.get(`patient/urgences/`);
    return response.data;
  },

  createUrgence: async (urgenceData) => {
    const response = await api.post(`patient/urgences/`, urgenceData);
    return response.data;
  },

  // Medecin urgences
  getMedecinUrgences: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.statut) params.append("statut", filters.statut);

    const response = await api.get(`medecin/urgences/?${params.toString()}`);
    return response.data;
  },

  takeChargeUrgence: async (urgenceId) => {
    const response = await api.post(
      `medecin/urgences/${urgenceId}/prendre-en-charge/`,
      {}
    );
    return response.data;
  },

  resolveUrgence: async (urgenceId, data) => {
    const response = await api.put(
      `medecin/urgences/${urgenceId}/resoudre/`,
      data
    );
    return response.data;
  },

  // Notifications
  getMedecinNotifications: async () => {
    const response = await api.get(`medecin/notifications-urgences/`);
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.post(
      `medecin/notifications-urgences/${notificationId}/lue/`,
      {}
    );
    return response.data;
  },

  // Health facilities
  getHealthFacilities: async () => {
    const response = await api.get(`health-facilities/`);
    return response.data;
  },

  getNearbyHealthFacilities: async (lat, lng, radius = 10) => {
    const response = await api.get(
      `health-facilities/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data;
  },
};

export default urgenceService;
