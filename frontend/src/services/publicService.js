import api from "./api";

const publicService = {
  getStatistics: async () => {
    try {
      console.log("Fetching public statistics...");
      const response = await api.get("statistics/public/");
      console.log("Public statistics response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching public statistics:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default publicService;
