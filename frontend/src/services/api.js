import axios from "axios";

// Add a global request interceptor to include token if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "Global interceptor - Token ajouté au header:",
        token.substring(0, 20) + "..."
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create axios instance with default config
const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Increased timeout to 15 seconds
});

// Add a request interceptor to include token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "API instance interceptor - Token ajouté au header:",
        token.substring(0, 20) + "..."
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject(
        new Error(
          "Erreur de réseau. Veuillez vérifier votre connexion internet."
        )
      );
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.error("Timeout error:", error.message);
      return Promise.reject(
        new Error("La requête a expiré. Veuillez réessayer.")
      );
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      // Don't redirect to login for public endpoints
      const publicEndpoints = [
        "patients/",
        "medecins/",
        "cliniques/",
        "pharmacies/",
        "articles/", // Add articles endpoint to public endpoints
        "auth/login/", // Add login endpoint to public endpoints to avoid interference
      ];

      const requestUrl = error.config?.url || "";
      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        requestUrl.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        // Clear local storage and redirect to login for protected endpoints
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("username");
        localStorage.removeItem("first_name");
        localStorage.removeItem("last_name");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        window.location.href = "/connecter";

        return Promise.reject(
          new Error("Votre session a expiré. Veuillez vous reconnecter.")
        );
      } else {
        // For login endpoint, let the specific error message pass through
        if (requestUrl.includes("auth/login/")) {
          return Promise.reject(new Error("Identifiants incorrects"));
        }
        // For other public endpoints, use the original error
        return Promise.reject(error);
      }
    }

    // Handle forbidden errors
    if (error.response.status === 403) {
      return Promise.reject(
        new Error(
          "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource."
        )
      );
    }

    // Handle not found errors
    if (error.response.status === 404) {
      // More detailed 404 error message
      const requestUrl = error.config?.url || "";
      console.error("404 Error for URL:", requestUrl);
      return Promise.reject(
        new Error(
          `La ressource demandée n'a pas été trouvée. URL: ${requestUrl}`
        )
      );
    }

    // Handle server errors
    if (error.response.status >= 500) {
      return Promise.reject(
        new Error(
          "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
        )
      );
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post("auth/login/", data),
  register: (data) => api.post("auth/register/", data),
  refreshToken: (data) => api.post("token/refresh/", data),
};

// ════════════════════════════════════════════════════════════
// 📅 RENDEZ-VOUS API - STANDARDISÉ
// ════════════════════════════════════════════════════════════

export const rendezVousAPI = {
  /**
   * Créer un rendez-vous (Patient)
   * @param {Object} data - Appointment data
   */
  creer: async (data) => {
    console.log("📤 Création RDV:", data);
    try {
      const response = await api.post("/rendezvous/", data);
      console.log("✅ RDV créé:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur création RDV:", error.response?.data);

      // Extraire message d'erreur
      const errorData = error.response?.data;
      let errorMsg = "Erreur lors de la création du rendez-vous";

      if (typeof errorData === "string") {
        errorMsg = errorData;
      } else if (errorData?.error) {
        errorMsg = errorData.error;
      } else if (errorData?.date_rdv) {
        errorMsg = Array.isArray(errorData.date_rdv)
          ? errorData.date_rdv[0]
          : errorData.date_rdv;
      }

      throw new Error(errorMsg);
    }
  },

  /**
   * Liste de tous les RDV du patient connecté
   */
  mesRendezVous: async () => {
    try {
      const response = await api.get("/rendezvous/mes-demandes/");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur récupération RDV:", error);
      throw error;
    }
  },

  /**
   * RDV à venir (patient)
   */
  aVenir: async () => {
    try {
      const response = await api.get("/rendezvous/upcoming/");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur RDV à venir:", error);
      throw error;
    }
  },

  /**
   * Historique des RDV passés (patient)
   */
  historique: async () => {
    try {
      const response = await api.get("/rendezvous/history/");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur historique:", error);
      throw error;
    }
  },

  /**
   * Créneaux disponibles pour un médecin à une date
   * @param {number} medecinId - ID du médecin (user_id)
   * @param {string} date - Format "YYYY-MM-DD"
   */
  creneauxDisponibles: async (medecinId, date) => {
    try {
      console.log("🔍 Récupération créneaux:", { medecinId, date });

      const response = await api.get("/rendezvous/creneaux_disponibles/", {
        params: {
          medecin_id: medecinId,
          date: date,
        },
      });

      console.log("✅ Créneaux reçus:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur créneaux:", error.response?.data);
      throw error;
    }
  },

  // ════════════════════════════════════════════════════════════
  // 👨‍⚕️ ACTIONS MÉDECIN
  // ════════════════════════════════════════════════════════════

  /**
   * Liste des demandes de RDV en attente (médecin)
   */
  mesDemandes: async () => {
    try {
      const response = await api.get("/rendezvous/mes-demandes/");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur demandes:", error);
      console.error("❌ Détails erreur:", error.response?.data);
      // Throw a more detailed error
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Erreur inconnue";
      throw new Error(
        `Erreur lors de la récupération des demandes: ${errorMsg}`
      );
    }
  },

  /**
   * Tous les rendez-vous du médecin connecté (historique complet)
   */
  mesRendezVousMedecin: async () => {
    try {
      console.log("📋 Récupération RDV médecin...");
      const response = await api.get("/rendezvous/mes-rendez-vous-medecin/");
      console.log("✅ RDV médecin récupérés:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur mesRendezVousMedecin:", error);
      console.error("❌ Détails erreur:", error.response?.data);
      // Throw a more detailed error
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Erreur inconnue";
      throw new Error(
        `Erreur lors de la récupération des rendez-vous: ${errorMsg}`
      );
    }
  },

  /**
   * Confirmer un RDV (médecin uniquement)
   * @param {number} rdvId - ID du rendez-vous
   */
  confirmer: async (rdvId) => {
    try {
      console.log("✅ Confirmation RDV:", rdvId);
      const response = await api.patch(`/rendezvous/${rdvId}/confirmer/`);
      console.log("✅ RDV confirmé:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur confirmation:", error.response?.data);
      // Provide a more detailed error message
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 500) {
        throw new Error(
          "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
        );
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.error || "Données invalides fournies."
        );
      } else if (error.response?.status === 403) {
        throw new Error("Vous n'êtes pas autorisé à confirmer ce rendez-vous.");
      } else {
        throw new Error(
          "Erreur inconnue lors de la confirmation du rendez-vous."
        );
      }
    }
  },

  /**
   * Annuler un RDV (patient ou médecin)
   * @param {number} rdvId - ID du rendez-vous
   */
  annuler: async (rdvId) => {
    try {
      console.log("❌ Annulation RDV:", rdvId);
      const response = await api.patch(`/rendezvous/${rdvId}/annuler/`);
      console.log("✅ RDV annulé:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur annulation:", error.response?.data);
      throw error;
    }
  },

  /**
   * Reprogrammer un RDV (médecin uniquement)
   * @param {number} rdvId - ID du rendez-vous
   * @param {Object} data - Nouvelles données de date/heure
   */
  doctorRescheduleAppointment: async (rdvId, data) => {
    try {
      console.log("📅 Reprogrammation RDV:", rdvId, data);
      const response = await api.post(
        `/appointments/${rdvId}/doctor-reschedule/`,
        data
      );
      console.log("✅ RDV reprogrammé:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur reprogrammation:", error.response?.data);
      // Provide a more detailed error message
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 500) {
        throw new Error(
          "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
        );
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.error || "Données invalides fournies."
        );
      } else if (error.response?.status === 403) {
        throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
      } else {
        throw new Error("Erreur inconnue lors de la reprogrammation.");
      }
    }
  },
};

// ════════════════════════════════════════════════════════════
// 🔄 ALIAS COMPATIBILITÉ (pour ancien code)
// ════════════════════════════════════════════════════════════

// Garde ces alias temporairement pour compatibilité
export const appointmentAPI = {
  createAppointment: rendezVousAPI.creer,
  getAppointments: rendezVousAPI.mesRendezVous,
  getAvailableSlots: rendezVousAPI.creneauxDisponibles,
  mesRendezVousMedecin: rendezVousAPI.mesRendezVousMedecin,
};

// Message APIs
export const messageAPI = {
  getConversations: () => api.get("messages/conversations/"),
  getMessages: (conversationId) =>
    api.get(`messages/conversations/${conversationId}/messages/`),
  createConversation: (data) =>
    api.post("messages/conversations/create/", data),
  sendMessage: (data) => api.post("messages/send/", data),
  markMessageAsRead: (messageId) => api.put(`messages/${messageId}/mark-read/`),
  getUnreadCount: () => api.get("messages/unread-count/"),
};

// Hospital APIs
export const hospitalAPI = {
  getHospitals: () => api.get("hopitaux/"),
  getHospital: (id) => api.get(`hopitaux/${id}/`),
};

// Clinic APIs
export const clinicAPI = {
  getClinics: () => api.get("cliniques/"),
  getClinic: (id) => api.get(`cliniques/${id}/`),
};

// Pharmacy APIs
export const pharmacyAPI = {
  getPharmacies: () => api.get("pharmacies/"),
  getPharmacy: (id) => api.get(`pharmacies/${id}/`),
};

// Dentist APIs
export const dentistAPI = {
  getDentists: () => api.get("dentistes/"),
  getDentist: (id) => api.get(`dentistes/${id}/`),
};

// Article APIs
export const articleAPI = {
  getArticles: () => api.get("articles/"),
  getArticle: (id) => api.get(`articles/${id}/`),
  // Médecin - Mes articles
  getMesArticles: async (filters = {}) => {
    try {
      const response = await api.get("/articles/mes_articles/", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des articles:", error);
      throw error;
    }
  },

  // Médecin - Créer un article
  createArticle: async (articleData) => {
    const response = await api.post("/articles/", articleData);
    return response.data;
  },

  // Médecin - Modifier un article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/articles/${id}/`, articleData);
    return response.data;
  },

  // Médecin - Supprimer un article
  deleteArticle: async (id) => {
    const response = await api.delete(`/articles/${id}/`);
    return response.data;
  },

  // Médecin - Soumettre pour validation
  soumettreArticle: async (id) => {
    const response = await api.post(`/articles/${id}/soumettre/`);
    return response.data;
  },

  // Public - Liste des articles publics
  getArticlesPublics: async (page = 1, categorie = null) => {
    let url = `/articles/?page=${page}`;
    if (categorie) url += `&categorie=${categorie}`;
    const response = await api.get(url);
    return response.data;
  },

  // Admin - Statistiques
  getStatistiques: async () => {
    const response = await api.get("/articles/statistiques/");
    return response.data;
  },

  // Admin - Liste admin
  getArticlesAdmin: async (statut = null) => {
    let url = "/articles/liste_admin/";
    if (statut) url += `?statut=${statut}`;
    const response = await api.get(url);
    return response.data;
  },

  // Admin - Valider
  validerArticle: async (id, commentaire = "") => {
    const response = await api.post(`/articles/${id}/valider/`, {
      commentaire,
    });
    return response.data;
  },

  // Admin - Désactiver
  desactiverArticle: async (id, commentaire) => {
    const response = await api.post(`/articles/${id}/desactiver/`, {
      commentaire,
    });
    return response.data;
  },

  // Admin - Réactiver
  reactiverArticle: async (id) => {
    const response = await api.post(`/articles/${id}/reactiver/`);
    return response.data;
  },

  // Admin - Refuser/Supprimer
  refuserArticle: async (id, commentaire) => {
    const response = await api.post(`/articles/${id}/refuser/`, {
      commentaire,
    });
    return response.data;
  },
};

// Medical Document APIs
export const medicalDocumentAPI = {
  getDocuments: () => api.get("medical-documents/"),

  createDocument: (formData) =>
    api.post("medical-documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteDocument: (id) => api.delete(`medical-documents/${id}/`),
};


// Admin APIs
export const adminAPI = {
  getStatistics: () => api.get("admin/statistics/"),
  getUsers: () => api.get("admin/users/"),
  createUser: (data) => api.post("admin/users/create/", data),
  updateUser: (id, data) => api.put(`admin/users/${id}/`, data),
  toggleUserStatus: (id) => api.put(`admin/users/${id}/toggle-status/`, {}),
  deleteUser: (id) => api.delete(`admin/users/${id}/delete/`),
};

// Consultation APIs
export const consultationAPI = {
  getConsultations: () => api.get("consultations/"),
  getConsultation: (id) => api.get(`consultations/${id}/`),
  createConsultation: (data) => api.post("consultations/", data),
  updateConsultation: (id, data) => api.put(`consultations/${id}/`, data),
  deleteConsultation: (id) => api.delete(`consultations/${id}/`),
  startConsultation: (id) => api.post(`consultations/${id}/start/`),
  endConsultation: (id) => api.post(`consultations/${id}/end/`),
};

// Consultation Message APIs
export const consultationMessageAPI = {
  getMessages: (consultationId) =>
    api.get(`consultation-messages/?consultation=${consultationId}`),
  sendMessage: (data) => api.post("consultation-messages/", data),
};

// Teleconsultation APIs
export const teleconsultationAPI = {
  getTeleconsultations: () => api.get("teleconsultations/"),
  getTeleconsultation: (id) => api.get(`teleconsultations/${id}/`),
  getByConsultation: (consultationId) =>
    api.get(`teleconsultations/?consultation=${consultationId}`),
  create: (data) => api.post("teleconsultations/", data),
  update: (id, data) => api.put(`teleconsultations/${id}/`, data),
  delete: (id) => api.delete(`teleconsultations/${id}/`),
  generateToken: (id) => api.post(`teleconsultations/${id}/generate_token/`),
  endTeleconsultation: (id) => api.post(`teleconsultations/${id}/end/`),
};

// Garde UNIQUEMENT les fonctions de disponibilité médecin (pas les créneaux)
export const disponibiliteMedecinAPI = {
  // Fonctions de gestion des disponibilités (horaires de travail du médecin)
  getMesDisponibilites: async () => {
    try {
      const response = await api.get("/medecins/mes-disponibilites/");
      return response.data;
    } catch (error) {
      console.error("Erreur getMesDisponibilites:", error);
      throw error;
    }
  },

  createDisponibilite: async (data) => {
  try {
    const response = await api.post("/disponibilites-medecin/", data); // <-- juste /medecins/
    return response.data;
  } catch (error) {
    console.error("Erreur createDisponibilite:", error);
    throw error;
  }
},

  updateDisponibilite: async (id, data) => {
    try {
      const response = await api.put(
        `/medecins/mes-disponibilites/${id}/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Erreur updateDisponibilite:", error);
      throw error;
    }
  },

  deleteDisponibilite: async (id) => {
    try {
      const response = await api.delete(`/medecins/mes-disponibilites/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Erreur deleteDisponibilite:", error);
      throw error;
    }
  },

  getMesIndisponibilites: async () => {
    try {
      const response = await api.get("/medecins/mes-indisponibilites/");
      return response.data;
    } catch (error) {
      console.error("Erreur getMesIndisponibilites:", error);
      throw error;
    }
  },

  /**
   * Prochains créneaux disponibles pour un médecin
   * @param {number} medecinId - ID du médecin
   * @param {number} limit - Nombre de créneaux à retourner (défaut: 5)
   */
  getProchainsCreneaux: async (medecinId, limit = 5) => {
    try {
      console.log("🔍 Récupération prochains créneaux:", { medecinId, limit });

      const response = await api.get(
        `/medecins/${medecinId}/prochains-creneaux/`,
        {
          params: { limit },
        }
      );

      console.log("✅ Prochains créneaux reçus:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur prochains créneaux:", error);
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  },

  // Alias pour créneaux disponibles (utilise rendezVousAPI)
  getCreneauxDisponibles: rendezVousAPI.creneauxDisponibles,
};

export const indisponibiliteMedecinAPI = {
  // Créer une indisponibilité
  createIndisponibilite: async (data) => {
    console.log("Data indisponibilite envoyée:", data);

    try {
      const response = await api.post(
        "indisponibilites-medecin/ajouter_indisponibilite/",
        data
      );
      console.log("Indisponibilité créée:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout de l'indisponibilité:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Récupérer toutes les indisponibilités du médecin connecté
  getMesIndisponibilites: async () => {
    try {
      const response = await api.get("medecins/mes-indisponibilites/");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération indisponibilités:", error.response?.data || error.message);
      throw error;
    }
  },
};


// User APIs
export const userAPI = {
  getProfile: async () => {
    try {
      console.log("Fetching user profile...");
      const response = await api.get("users/profile/");
      console.log("User profile response:", response.data);

      // Validate response data structure
      if (!response.data) {
        console.warn(
          "User profile response is empty, returning default structure"
        );
        return {
          data: {
            username: localStorage.getItem("username") || "admin",
            first_name: localStorage.getItem("first_name") || "Administrateur",
            last_name: localStorage.getItem("last_name") || "",
            email: localStorage.getItem("email") || "admin@example.com",
          },
        };
      }

      return response;
    } catch (error) {
      console.error(
        "Error fetching user profile:",
        error.response?.data || error.message
      );
      // Return a default user structure to prevent dashboard from breaking
      return {
        data: {
          username: localStorage.getItem("username") || "admin",
          first_name: localStorage.getItem("first_name") || "Administrateur",
          last_name: localStorage.getItem("last_name") || "",
          email: localStorage.getItem("email") || "admin@example.com",
        },
      };
    }
  },
  updateProfile: (data) => api.put("users/profile/", data),
};

// Patient APIs
export const patientAPI = {
  getAppointments: rendezVousAPI.aVenir,
  getAppointmentHistory: rendezVousAPI.historique,
  getMedications: (patientId) => api.get(`medications/${patientId}/`),
  cancelAppointment: (id) => api.post(`rendezvous/${id}/cancel/`),
  rescheduleAppointment: (id, data) => api.post(`rendezvous/${id}/reschedule/`),
  proposeReschedule: (id, data) =>
    api.post(`rendezvous/${id}/propose-reschedule/`),
  validateAppointment: (id, data) => api.post(`rendezvous/${id}/validate/`),
  getPatients: () => api.get("patients/"),
  getPatient: (id) => api.get(`patients/${id}/`),
  updatePatient: (id, data) => api.put(`patients/${id}/`, data),
};

// Doctor APIs
export const doctorAPI = {
  getDoctors: () => api.get("medecins/"),
  getDoctor: (id) => api.get(`medecins/${id}/`),
};

// Specialty APIs
export const specialtyAPI = {
  getSpecialties: () => api.get("pathologies/"),
  getSpecialty: (id) => api.get(`pathologies/${id}/`),
};

// Export the base api instance for custom requests
export default api;




