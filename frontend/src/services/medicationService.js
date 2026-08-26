import api from "./api";

class MedicationService {
  // Get all medication reminders for the patient
  async getReminders() {
    try {
      const response = await api.get("/medication-reminders/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create a new medication reminder
  async createReminder(reminderData) {
    try {
      const response = await api.post("/medication-reminders/", reminderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get a specific medication reminder
  async getReminder(id) {
    try {
      const response = await api.get(`/medication-reminders/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update a medication reminder
  async updateReminder(id, reminderData) {
    try {
      const response = await api.put(
        `/medication-reminders/${id}/`,
        reminderData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete a medication reminder
  async deleteReminder(id) {
    try {
      const response = await api.delete(`/medication-reminders/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get medication history
  async getHistory() {
    try {
      const response = await api.get("/medication-history/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Mark a medication as taken
  async markTaken(id, notes = "") {
    try {
      const response = await api.post(`/medication-history/${id}/mark-taken/`, {
        notes,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new MedicationService();
