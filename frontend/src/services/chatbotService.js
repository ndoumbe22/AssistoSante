import api from "./api";

class ChatbotService {
  // Send a message to the chatbot
  async sendMessage(message) {
    try {
      const response = await api.post("/chatbot/", { message });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get chatbot conversation history
  async getHistory() {
    try {
      const response = await api.get("/chatbot/history/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Admin functions for knowledge base management
  async getKnowledgeBase() {
    try {
      // This would be implemented in the backend
      const response = await api.get("/admin/chatbot/knowledge-base/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async addKnowledgeBaseEntry(entry) {
    try {
      const response = await api.post("/admin/chatbot/knowledge-base/", entry);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateKnowledgeBaseEntry(id, entry) {
    try {
      const response = await api.put(
        `/admin/chatbot/knowledge-base/${id}/`,
        entry
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteKnowledgeBaseEntry(id) {
    try {
      await api.delete(`/admin/chatbot/knowledge-base/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get chatbot statistics
  async getStatistics() {
    try {
      const response = await api.get("/admin/chatbot/statistics/");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ChatbotService();
