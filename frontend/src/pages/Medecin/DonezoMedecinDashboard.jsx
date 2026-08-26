import axios from "axios";
import React, { useState, useEffect } from "react";
import { 
  FaUserInjured, FaCalendar, FaFileAlt, FaClock, 
  FaChartBar, FaBell, FaChevronRight, FaPlus, FaFilter,
  FaUserMd, FaRobot, FaVideo
} from "react-icons/fa";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { appointmentAPI, userAPI, articleAPI, rendezVousAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../components/DashboardLayout.css";
import DemarrerConsultationButton from "./DemarrerConsultationButton";
import Chatbot from "../../components/Chatbot";
import { Outlet } from "react-router-dom";
import { FaPrescriptionBottleAlt } from "react-icons/fa";


// Colors for charts
const COLORS = ['#0d9488', '#f59e0b', '#ef4444'];
const USER_COLORS = ['#0d9488', '#10b981', '#3b82f6'];

function DonezoMedecinDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    articles: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // today, pending, validated, completed
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);
  
  // New states for the enhanced dashboard
  const [demandes, setDemandes] = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [rdvAujourdhui, setRdvAujourdhui] = useState([]);
  const [statsJour, setStatsJour] = useState({
    total: 0,
    termines: 0,
    restants: 0
  });
  const [statsPatients, setStatsPatients] = useState({
    labels: [],
    data: []
  });
  const [filter, setFilter] = useState('tous');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        try {
          const userResponse = await userAPI.getProfile();
          if (userResponse && userResponse.data) {
            setUser(userResponse.data);
          } else {
            console.warn("User profile response is empty or invalid");
            setUser(null);
          }
        } catch (userError) {
          console.error("Error fetching user profile:", userError);
          // Don't set error here as we want to continue loading other data
        }
        
        // Fetch appointments
        try {
          const appointmentsResponse = await appointmentAPI.mesRendezVousMedecin();
          // Ensure appointmentsData is an array
          const appointmentsData = Array.isArray(appointmentsResponse) 
            ? appointmentsResponse 
            : (Array.isArray(appointmentsResponse?.data) ? appointmentsResponse.data : []);
          setAppointments(appointmentsData);
          
          // Calculate today's appointments
          const today = new Date().toISOString().split('T')[0];
          const todayAppointments = Array.isArray(appointmentsData) 
            ? appointmentsData.filter(app => {
                const appDate = app.date_rdv ? app.date_rdv.split('T')[0] : app.date;
                return appDate === today;
              }).length 
            : 0;
          
          // Update stats with proper validation
          setStats(prev => ({
            ...prev,
            todayAppointments: todayAppointments,
            pendingRequests: Array.isArray(appointmentsData) 
              ? appointmentsData.filter(app => app.statut === 'PENDING').length 
              : 0
          }));
          
          // Fetch patients (this would need a specific endpoint)
          // For now, we'll simulate with appointment data since there might not be a specific endpoint
          const uniquePatients = Array.isArray(appointmentsData) 
            ? [...new Set(appointmentsData.map(app => app.patient_nom || app.patient || 'Patient inconnu'))]
            : [];
          setPatients(uniquePatients.map((name, index) => ({
            id: index + 1,
            name: name,
            lastVisit: "2025-06-10", // This would come from API
            condition: "Hypertension" // This would come from API
          })));
          
          // Fetch articles count
          try {
            const articlesData = await articleAPI.getMesArticles();
            const validatedArticles = Array.isArray(articlesData) 
              ? articlesData.filter(article => article.statut === 'valide').length 
              : 0;
            setStats(prev => ({
              ...prev,
              totalPatients: uniquePatients.length,
              articles: validatedArticles
            }));
          } catch (articlesError) {
            console.error("Error fetching articles:", articlesError);
            setStats(prev => ({
              ...prev,
              totalPatients: uniquePatients.length,
              articles: 0
            }));
          }
        } catch (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError);
          setAppointments([]);
          setStats(prev => ({
            ...prev,
            todayAppointments: 0,
            pendingRequests: 0,
            totalPatients: 0,
            articles: 0
          }));
        }
        
      } catch (err) {
        console.error("General error fetching data:", err);
        setError("Une erreur inattendue s'est produite lors du chargement des données.");
        setStats({
          totalPatients: 0,
          todayAppointments: 0,
          articles: 0,
          pendingRequests: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Charger les demandes de rendez-vous
  const chargerDemandes = async () => {
    try {
      setLoadingDemandes(true);
      // Use the correct API function
      const response = await rendezVousAPI.mesDemandes();
      const demandesPending = Array.isArray(response) 
        ? response 
        : (response.demandes || response.data || []);
      
      // Trier par date création (plus récentes en premier)
      demandesPending.sort((a, b) => 
        new Date(b.date_creation) - new Date(a.date_creation)
      );
      
      // Garder seulement les 3 premières
      setDemandes(demandesPending.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      setDemandes([]);
    } finally {
      setLoadingDemandes(false);
    }
  };


  // Charger les RDV d'aujourd'hui
  const chargerRdvAujourdhui = async () => {
    try {
      const response = await appointmentAPI.mesRendezVousMedecin();
      const tousRdv = Array.isArray(response) ? response : (response.data || []);
      
      // Filtrer pour aujourd'hui uniquement
      const aujourdhui = new Date().toISOString().split('T')[0];
      const rdvJour = tousRdv.filter(rdv => 
        rdv.date === aujourdhui && 
        rdv.statut !== 'CANCELLED'
      );
      
      // Trier par heure
      rdvJour.sort((a, b) => a.heure.localeCompare(b.heure));
      
      // Calculer les stats
      const termines = rdvJour.filter(rdv => rdv.statut === 'TERMINE').length;
      
      setRdvAujourdhui(rdvJour);
      setStatsJour({
        total: rdvJour.length,
        termines: termines,
        restants: rdvJour.length - termines
      });
    } catch (error) {
      console.error('Erreur RDV aujourd\'hui:', error);
    }
  };

  // Charger les stats des 30 derniers jours
  const chargerStats30Jours = async () => {
    try {
      const response = await appointmentAPI.mesRendezVousMedecin();
      const tousRdv = Array.isArray(response) ? response : (response.data || []);
      
      // Créer les 30 derniers jours
      const aujourdhui = new Date();
      const stats30j = {};
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(aujourdhui);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        stats30j[dateStr] = 0;
      }
      
      // Compter les patients uniques par jour (RDV terminés ou confirmés)
      tousRdv
        .filter(rdv => rdv.statut === 'TERMINE' || rdv.statut === 'CONFIRMED')
        .forEach(rdv => {
          if (stats30j.hasOwnProperty(rdv.date)) {
            stats30j[rdv.date]++;
          }
        });
      
      // Préparer pour le graphique
      const labels = Object.keys(stats30j).map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      });
      
      const data = Object.values(stats30j);
      
      setStatsPatients({ labels, data });
      
    } catch (error) {
      console.error('Erreur stats 30j:', error);
    }
  };

  // Charger toutes les données
  useEffect(() => {
    chargerDemandes();
    chargerRdvAujourdhui();
    chargerStats30Jours();
  }, []);

  // Recharger toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      chargerDemandes();
      chargerRdvAujourdhui();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate patient data for charts based on real appointments
  const generatePatientData = () => {
    // Create data for the last 6 months
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      // Count unique patients for this month
      const patientCount = Array.isArray(appointments) 
        ? new Set(
            appointments
              .filter(app => {
                if (!app.date) return false;
                const appDate = new Date(app.date);
                return appDate.getMonth() === index && appDate.getFullYear() === currentYear;
              })
              .map(app => app.patient_nom || app.patient)
          ).size
        : 0;
      
      return {
        month,
        patients: patientCount
      };
    });
  };

  // Appointment statistics based on real data
  const appointmentStats = [
    { name: 'Confirmés', value: Array.isArray(appointments) ? appointments.filter(app => app.statut === 'CONFIRMED').length : 0 },
    { name: 'En attente', value: Array.isArray(appointments) ? appointments.filter(app => app.statut === 'PENDING').length : 0 },
    { name: 'Annulés', value: Array.isArray(appointments) ? appointments.filter(app => app.statut === 'CANCELLED').length : 0 }
  ];

  // Filter appointments based on active tab
  const filteredAppointments = Array.isArray(appointments) ? appointments.filter(app => {
    if (activeTab === 'today') return true;
    if (activeTab === 'pending') return app.statut === 'PENDING';
    if (activeTab === 'validated') return app.statut === 'CONFIRMED';
    if (activeTab === 'completed') return app.statut === 'TERMINE';
    return true;
  }) : [];

  // Stat cards data
  const statCards = [
    { title: "Patients traités", value: stats.totalPatients, icon: <FaUserInjured />, color: "bg-teal-100 text-teal-600" },
    { title: "RDV aujourd'hui", value: stats.todayAppointments, icon: <FaCalendar />, color: "bg-blue-100 text-blue-600" },
    { title: "Articles validés", value: stats.articles, icon: <FaFileAlt />, color: "bg-green-100 text-green-600" },
    { title: "RDV restants", value: Array.isArray(appointments) ? appointments.filter(app => {
        const today = new Date();
        const appDate = new Date(app.date_rdv || app.date);
        return appDate >= today && app.statut !== 'CANCELLED';
      }).length : 0, icon: <FaClock />, color: "bg-purple-100 text-purple-600" }
  ];

  // Quick access buttons for main functionalities
  const quickAccessButtons = [
    { title: "Mes disponibilités", icon: <FaClock />, color: "bg-blue-100 text-blue-600", onClick: () => navigate("/medecin/disponibilites") },
    { title: "Prescription Médicale", icon: <FaPrescriptionBottleAlt />, color: "bg-purple-100 text-purple-600", onClick: () => navigate("/consultationsList") },
    { title: "Mes articles", icon: <FaFileAlt />, color: "bg-purple-100 text-purple-600", onClick: () => navigate("/medecin/articles") },
    { title: "Dossiers patients", icon: <FaUserInjured />, color: "bg-red-100 text-red-600", onClick: () => navigate("/medecin/dossier_patient") }
  ];

  // Handle appointment actions
  const handleValidateAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.confirmer(appointmentId);
      setAppointments(prev => prev.map(app => 
        (app.numero === appointmentId || app.id === appointmentId) ? { ...app, statut: 'CONFIRMED' } : app
      ));
      // Refresh stats
      setStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1
      }));
    } catch (error) {
      console.error("Error validating appointment:", error);
      alert("Erreur lors de la validation du rendez-vous");
    }
  };


  

  const handleRescheduleAppointment = (appointmentId) => {
    // In a real implementation, this would open a modal for rescheduling
    alert("Fonction de reprogrammation à implémenter");
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.annuler(appointmentId);
      setAppointments(prev => prev.map(app => 
        (app.numero === appointmentId || app.id === appointmentId) ? { ...app, statut: 'CANCELLED' } : app
      ));
      // Refresh stats
      setStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1
      }));
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      alert("Erreur lors du rejet du rendez-vous");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="container mx-auto py-6 px-4">
          <div className="alert alert-danger bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur! </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              className="mt-2 btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Tableau de bord médecin</h1>
              <p className="opacity-90">
                Bonjour, {user?.first_name ? `Dr. ${user.first_name} ${user.last_name || ''}` : user?.username ? `Dr. ${user.username}` : 'Médecin'}
                {user?.profile?.specialite && user.profile.specialite !== 'Généraliste' ? ` - ${user.profile.specialite}` : user?.profile?.specialite ? ` - ${user.profile.specialite}` : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-teal-700 transition">
                <FaBell className="text-xl" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="font-semibold">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'Dr'}
                    {user?.last_name?.charAt(0) || user?.first_name?.slice(1, 2) || ''}
                  </span>
                </div>
                <button 
                  onClick={() => { 
                    localStorage.removeItem("access_token"); 
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("username");
                    localStorage.removeItem("first_name");
                    localStorage.removeItem("last_name");
                    localStorage.removeItem("role");
                    localStorage.removeItem("email");
                    navigate("/connecter"); 
                  }}
                  className="btn btn-outline-light"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="stat-card p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Access Section */}
        <div className="dashboard-card p-6 mb-8">
          <h2 className="section-title mb-4">
            <FaRobot className="text-teal-600" />
            Accès rapide aux fonctionnalités
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className="flex flex-col items-center justify-center p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-full ${button.color} mb-2`}>
                  {button.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{button.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Agenda du jour */}
            <div className="card mb-3">
              <div className="card-body">
                <h5>📅 Agenda du jour</h5>
                <div className="row mt-3">
                  <div className="col-4 text-center">
                    <h3 className="text-primary mb-0">{statsJour.total}</h3>
                    <small className="text-muted">Total</small>
                  </div>
                  <div className="col-4 text-center">
                    <h3 className="text-success mb-0">{statsJour.termines}</h3>
                    <small className="text-muted">Terminés</small>
                  </div>
                  <div className="col-4 text-center">
                    <h3 className="text-warning mb-0">{statsJour.restants}</h3>
                    <small className="text-muted">Restants</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres pour les RDV */}
            <div className="d-flex gap-2 mb-3">
              <button 
                className={`btn ${filter === 'tous' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                onClick={() => setFilter('tous')}
              >
                Aujourd'hui ({statsJour.total})
              </button>
              <button 
                className={`btn ${filter === 'en_attente' ? 'btn-warning' : 'btn-outline-warning'} btn-sm`}
                onClick={() => setFilter('en_attente')}
              >
                En attente
              </button>
              <button 
                className={`btn ${filter === 'valides' ? 'btn-success' : 'btn-outline-success'} btn-sm`}
                onClick={() => setFilter('valides')}
              >
                Validés
              </button>
              <button 
                className={`btn ${filter === 'termines' ? 'btn-secondary' : 'btn-outline-secondary'} btn-sm`}
                onClick={() => setFilter('termines')}
              >
                Terminés
              </button>
            </div>

            {/* Liste des RDV d'aujourd'hui */}
            {rdvAujourdhui
  .filter(rdv => {
    if (filter === 'tous') return true;
    if (filter === 'en_attente') return rdv.statut === 'PENDING';
    if (filter === 'valides') return rdv.statut === 'CONFIRMED';
    if (filter === 'termines') return rdv.statut === 'TERMINE';
    return true;
  })
  .map(rdv => (
    <div key={rdv.numero} className="card mb-2">
      <div className="card-body">
        <h6>{rdv.patient_nom}</h6>
        <p className="mb-1 text-muted">🕐 {rdv.heure?.substring(0, 5)}</p>
        <p className="mb-2 small">{rdv.motif_consultation}</p>

        {["CONFIRMED", "Confirmé", "confirmed"].includes(rdv.statut) && (
          <DemarrerConsultationButton rdv={rdv} />
        )}

      </div>
    </div>
))}

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Mes rendez-vous - Bouton simplifié */}
            <div className="card">
              <div className="text-center p-4">
                <button
                  className="btn btn-primary btn-lg px-5 py-3"
                  onClick={() => navigate('/medecin/rendez-vous')}
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <i className="bi bi-calendar-check me-3"></i>
                  Voir les rendez-vous
                </button>
                
                {/* Afficher le nombre de demandes en attente si > 0 */}
                {stats.pendingRequests > 0 && (
                  <div className="mt-3">
                    <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                      {stats.pendingRequests} demande(s) en attente
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Patients des 30 derniers jours */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaChartBar className="text-teal-600" />
                Patients des 30 derniers jours
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statsPatients.labels.map((label, index) => ({ 
                    name: label, 
                    patients: statsPatients.data[index] || 0 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="patients" 
                      stroke="#3b82f6" 
                      name="Patients" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Appointment Stats */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaCalendar className="text-teal-600" />
                Statistiques des rendez-vous
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {appointmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!showChatbot && (
        <button
          className="btn btn-primary chatbot-floating-button"
          onClick={() => user ? navigate("/connecter?redirect=chatbot") : navigate("/chatbot")}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            zIndex: 1000,
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="bi bi-chat-dots" style={{ fontSize: "24px" }}></i>
        </button>
      )}

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

export default DonezoMedecinDashboard;