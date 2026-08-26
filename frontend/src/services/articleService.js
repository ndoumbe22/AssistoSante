import axios from "axios";
import api from "./api";

// Create a separate axios instance for public endpoints without authentication
const publicApi = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Remove the authentication interceptor for public API
publicApi.interceptors.request.use(
  (config) => {
    // Don't add authorization header for public endpoints
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
publicApi.interceptors.response.use(
  (response) => {
    console.log("Public API Response:", response);
    return response;
  },
  (error) => {
    console.error("Public API Error:", error.response || error);
    return Promise.reject(error);
  }
);

const articleService = {
  // Public articles with pagination support
  getPublicArticles: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.categorie) params.append("categorie", filters.categorie);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page);
      if (filters.page_size) params.append("page_size", filters.page_size);

      // Use public API endpoint for articles
      console.log("Fetching public articles with params:", params.toString());
      const response = await publicApi.get(`articles/?${params.toString()}`);
      console.log("Public articles response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching public articles:", error);
      throw error;
    }
  },

  getPublicArticle: async (slug) => {
    try {
      // Use public API endpoint for article detail
      console.log("Fetching article with slug:", slug);
      const response = await publicApi.get(`articles/${slug}/`);
      console.log("Article response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching article:", error);
      throw error;
    }
  },

  // Doctor articles
  getMesArticles: async (filters = {}) => {
    try {
      // Build query parameters
      let url = "/medecin/articles/";
      const params = new URLSearchParams();

      // Add status filter if provided and not 'all'
      if (filters.statut && filters.statut !== "all") {
        // Map frontend status names to backend status values
        const statusMapping = {
          Brouillons: "brouillon",
          "En attente": "en_attente",
          Validés: "valide",
          Refusés: "refuse",
          Désactivés: "desactive",
        };

        const backendStatus = statusMapping[filters.statut] || filters.statut;
        params.append("statut", backendStatus);
      }

      // Add search filter if provided
      if (filters.search) {
        params.append("search", filters.search);
      }

      // Append query parameters to URL if any
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching doctor articles:", error);
      throw error;
    }
  },

  getMyArticleDetail: async (id) => {
    const response = await api.get(`articles/${id}/`);
    return response.data;
  },

  createArticle: async (articleData) => {
    try {
      const response = await api.post("/articles/", articleData);
      return response.data;
    } catch (error) {
      console.error("Erreur création article:", error);
      throw error;
    }
  },

  updateArticle: async (id, articleData) => {
    // Send as JSON data, not FormData
    const response = await api.put(`articles/${id}/`, articleData);
    return response.data;
  },

  deleteArticle: async (id) => {
    await api.delete(`articles/${id}/`);
  },

  soumettreValidation: async (id) => {
    const response = await api.post(`articles/${id}/soumettre/`, {});
    return response.data;
  },

  soumettreArticle: async (id) => {
    const response = await api.post(`articles/${id}/soumettre/`, {});
    return response.data;
  },

  // Admin articles
  getAdminArticles: async (status = null) => {
    let url = `/articles/liste_admin/`;
    if (status) {
      url += `?statut=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getAdminArticle: async (id) => {
    const response = await api.get(`articles/${id}/`);
    return response.data;
  },

  validateArticle: async (id) => {
    const response = await api.post(`articles/${id}/valider/`);
    return response.data;
  },

  rejectArticle: async (id, data = {}) => {
    const response = await api.post(`articles/${id}/refuser/`, data);
    return response.data;
  },

  deactivateArticle: async (id, commentaire) => {
    const response = await api.post(`articles/${id}/desactiver/`, {
      commentaire,
    });
    return response.data;
  },

  reactivateArticle: async (id) => {
    const response = await api.post(`articles/${id}/reactiver/`);
    return response.data;
  },

  deleteAdminArticle: async (id) => {
    const response = await api.delete(`articles/${id}/supprimer/`);
    return response.data;
  },

  getArticleStatistics: async () => {
    const response = await api.get(`articles/statistiques/`);
    return response.data;
  },

  // Public articles with pagination
  getArticlesPublics: async (page = 1, categorie = null) => {
    let url = `/articles/?page=${page}`;
    if (categorie) url += `&categorie=${categorie}`;
    const response = await publicApi.get(url);
    return response.data;
  },

  // Admin - Récupérer tous les articles
  getArticlesAdmin: async (statut = null) => {
    let url = "/articles/liste_admin/";
    if (statut) url += `?statut=${statut}`;
    const response = await api.get(url);
    return response.data;
  },

  // Admin - Statistiques
  getStatistiquesArticles: async () => {
    const response = await api.get("/articles/statistiques/");
    return response.data;
  },

  // Admin - Valider un article
  validerArticle: async (id, commentaire = "") => {
    const response = await api.post(`/articles/${id}/valider/`, {
      commentaire,
    });
    return response.data;
  },

  // Admin - Refuser/Supprimer un article
  refuserArticle: async (id, commentaire) => {
    const response = await api.post(`/articles/${id}/refuser/`, {
      commentaire,
    });
    return response.data;
  },

  // Admin - Désactiver un article
  desactiverArticle: async (id, commentaire) => {
    const response = await api.post(`/articles/${id}/desactiver/`, {
      commentaire,
    });
    return response.data;
  },

  // Admin - Réactiver un article
  reactiverArticle: async (id) => {
    const response = await api.post(`/articles/${id}/reactiver/`);
    return response.data;
  },
};

export default articleService;
