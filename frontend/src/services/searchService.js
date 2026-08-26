import api from "./api";

class SearchService {
  // Perform global search across all entities
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append("q", query);
      
      // Add filters if provided
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/search/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get search suggestions
  async getSuggestions(query) {
    try {
      const params = new URLSearchParams();
      params.append("q", query);
      params.append("suggest", "true");
      
      const response = await api.get(`/search/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new SearchService();