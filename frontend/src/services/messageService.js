import { messageAPI } from "./api";

class MessageService {
  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await messageAPI.getConversations();
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
      throw error;
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId) {
    try {
      const response = await messageAPI.getMessages(conversationId);
      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(conversationData) {
    try {
      const response = await messageAPI.createConversation(conversationData);
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error.response?.data || error.message);
      throw error;
    }
  }

  // Send a new message
  async sendMessage(messageData) {
    try {
      const response = await messageAPI.sendMessage(messageData);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      throw error;
    }
  }

  // Mark a message as read
  async markMessageAsRead(messageId) {
    try {
      const response = await messageAPI.markMessageAsRead(messageId);
      return response.data;
    } catch (error) {
      console.error("Error marking message as read:", error.response?.data || error.message);
      throw error;
    }
  }

  // Get unread messages count
  async getUnreadCount() {
    try {
      const response = await messageAPI.getUnreadCount();
      return response.data;
    } catch (error) {
      console.error("Error fetching unread count:", error.response?.data || error.message);
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageService();