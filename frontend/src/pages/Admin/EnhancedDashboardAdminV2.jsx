import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaCalendarCheck, FaUserMd, FaFileMedical, FaEnvelope, 
  FaCog, FaSignOutAlt, FaUser, FaSearch, FaBell, 
  FaPills, FaRobot, FaChartLine, FaQrcode, FaStar,
  FaChevronLeft, FaChevronRight, FaStethoscope, FaHospital,
  FaPrescriptionBottle, FaHeartbeat, FaNotesMedical, FaUsers,
  FaClipboardList, FaComments, FaBookMedical, FaBuilding, FaUserShield,
  FaUserNurse, FaUserInjured, FaUserFriends
} from "react-icons/fa";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { adminAPI } from "../../services/api";
import { adminService } from "../../services/adminService";
import EnhancedChatbot from "../../components/EnhancedChatbot";
import NotificationCenter from "../../components/NotificationCenter";
import { useAuth } from "../../context/AuthContext";

function EnhancedDashboardAdminV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState("light");
  const [fullName, setFullName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState("overview");

  // 🔔 Notifications
  const [notifications, setNotifications] = useState([
    "Nouveau médecin en attente d'approbation.",
    "Rapport mensuel disponible.",
    "Maintenance prévue ce week-end.",
  ]);

  // Quick actions carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const quickActions = [
    { 
      title: "Utilisateurs", 
      icon: <FaUsers size={24} />, 
      color: "primary",
      path: "/admin/utilisateurs"
    },
    { 
      title: "Médecins", 
      icon: <FaUserMd size={24} />, 
      color: "success",
      path: "/admin/medecins"
    },
    { 
      title: "Patients", 
      icon: <FaUserInjured size={24} />, 
      color: "info",
      path: "/admin/patients"
    },
    { 
      title: "Secrétaires", 
      icon: <FaUserNurse size={24} />, 
      color: "warning",
      path: "/admin/secretaires"
    },
    { 
      title: "Articles", 
      icon: <FaBookMedical size={24} />, 
      color: "secondary",
      path: "/admin/articles"
    },
    { 
      title: "Établissements", 
      icon: <FaBuilding size={24} />, 
      color: "danger",
      path: "/admin/etablissements"
    }
  ];

  // Health tips for admins
  const healthTips = [
    "Assurez-vous que toutes les données des utilisateurs sont sécurisées.",
    "Vérifiez régulièrement les journaux d'audit pour détecter les anomalies.",
    "Mettez à jour les politiques de confidentialité conformément aux réglementations.",
    "Formez régulièrement le personnel aux meilleures pratiques de sécurité.",
    "Effectuez des sauvegardes régulières des données critiques."
  ];

  // Charger les données de l'administrateur depuis l'API
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Get admin data from auth context
        if (user) {
          setAdminData({
            id: 1,
            user: {
              first_name: user.firstName || user.first_name || "",
              last_name: user.lastName || user.last_name || "",
              email: user.email || ""
            }
          });
          setFullName(`${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim() || user.username || "Administrateur Principal");
        } else {
          // Fallback if no user in context
          const firstName = localStorage.getItem("first_name") || "Administrateur";
          const lastName = localStorage.getItem("last_name") || "Principal";
          const email = localStorage.getItem("email") || "admin@assitosante.com";
          
          setAdminData({
            id: 1,
            user: {
              first_name: firstName,
              last_name: lastName,
              email: email
            }
          });
          setFullName(`${firstName} ${lastName}`.trim() || "Administrateur Principal");
        }
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des données de l'administrateur");
        setLoading(false);
        console.error("Erreur lors du chargement des données de l'administrateur :", err);
      }
    };

    fetchAdminData();
  }, [user]);

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real statistics from the API
        const statsResponse = await adminAPI.getStatistics();
        setStats({
          total_users: statsResponse.total_users || 0,
          total_doctors: statsResponse.total_medecins || 0,
          total_patients: statsResponse.total_patients || 0,
          total_secretaries: 0, // This would need a specific API endpoint
          total_appointments: statsResponse.total_rendez_vous || 0,
          total_articles: 0, // This would need a specific API endpoint
          total_hospitals: 0, // This would need a specific API endpoint
          total_clinics: 0, // This would need a specific API endpoint
          appointments_this_month: statsResponse.rendez_vous_month || 0,
          new_users_this_week: statsResponse.new_users_week || 0
        });
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques :", err);
        // Fallback to mock data if API fails
        setStats({
          total_users: 1247,
          total_doctors: 89,
          total_patients: 956,
          total_secretaries: 23,
          total_appointments: 342,
          total_articles: 56,
          total_hospitals: 12,
          total_clinics: 24,
          appointments_this_month: 127,
          new_users_this_week: 34
        });
      }
    };

    fetchStats();
  }, []);

  // Charger le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, []);

  // Appliquer le thème
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Auto-slide quick actions carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.ceil(quickActions.length / 4));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [quickActions.length]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/connecter");
  };

  // Sample data for charts
  const userGrowthData = [
    { mois: "Jan", utilisateurs: 85 },
    { mois: "Fév", utilisateurs: 120 },
    { mois: "Mar", utilisateurs: 156 },
    { mois: "Avr", utilisateurs: 189 },
    { mois: "Mai", utilisateurs: 234 },
    { mois: "Juin", utilisateurs: 287 }
  ];

  const appointmentTrendsData = [
    { jour: "Lun", rendez_vous: 24 },
    { jour: "Mar", rendez_vous: 32 },
    { jour: "Mer", rendez_vous: 28 },
    { jour: "Jeu", rendez_vous: 35 },
    { jour: "Ven", rendez_vous: 42 },
    { jour: "Sam", rendez_vous: 18 },
    { jour: "Dim", rendez_vous: 12 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % Math.ceil(quickActions.length / 4));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + Math.ceil(quickActions.length / 4)) % Math.ceil(quickActions.length / 4));
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <p>Erreur: {error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* ===== Sidebar ===== */}
      <aside 
        style={{ 
          width: "250px", 
          padding: "20px", 
          backgroundColor: "#0d9488",
          color: "white"
        }}
      >
        <div className="d-flex align-items-center mb-4">
          <div className="d-flex align-items-center">
            <FaUserShield size={30} className="me-2" />
            <h4>AssitoSanté</h4>
          </div>
        </div>

        <ul className="nav flex-column">
          <li className="nav-item mb-3">
            <Link to="/admin/dashboard" className="nav-link text-white active">
              <FaChartLine className="me-2" /> Tableau de bord
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/utilisateurs" className="nav-link text-white">
              <FaUsers className="me-2" /> Utilisateurs
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/medecins" className="nav-link text-white">
              <FaUserMd className="me-2" /> Médecins
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/patients" className="nav-link text-white">
              <FaUserInjured className="me-2" /> Patients
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/secretaires" className="nav-link text-white">
              <FaUserNurse className="me-2" /> Secrétaires
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/articles" className="nav-link text-white">
              <FaBookMedical className="me-2" /> Articles
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/etablissements" className="nav-link text-white">
              <FaBuilding className="me-2" /> Établissements
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link to="/admin/profile" className="nav-link text-white">
              <FaUser className="me-2" /> Profil
            </Link>
          </li>
        </ul>
        <hr style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

        <div className="mt-auto pt-4">
          <button className="nav-link text-white btn btn-link" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== Contenu principal ===== */}
      <main className="flex-grow-1 p-4">
        {/* ===== Topbar ===== */}
        <div
          className="d-flex justify-content-between align-items-center mb-4 topbar"
          style={{ padding: "10px 20px", borderRadius: "10px", backgroundColor: "#f5f6fa" }}
        >
          {/* Barre de recherche */}
          <div style={{ position: "relative", width: "250px" }}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: "20px",
                border: "1px solid #ddd",
                padding: "6px 12px 6px 35px",
                width: "100%",
                backgroundColor: "white",
                outline: "none",
              }}
            />
            <FaSearch
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                color: "#888",
              }}
            />
          </div>

          {/* Icônes + Profil */}
          <div className="d-flex align-items-center">
            <div style={{ ...iconStyle }}><FaCog size={16} /></div>
            <NotificationCenter />
            <div className="d-flex align-items-center ms-3">
              <div
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "50%",
                  backgroundColor: "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  marginRight: "10px",
                }}
              >
                {fullName?.charAt(0) || user?.username?.charAt(0) || localStorage.getItem("username")?.charAt(0) || 'A'}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "500" }}>{fullName || user?.username || localStorage.getItem("username") || "Administrateur"}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Administrateur</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Welcome Banner ===== */}
        <div className="card mb-4" style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "white" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Bonjour, {fullName || user?.username || localStorage.getItem("username") || "Administrateur"}!</h2>
                <p className="mb-0">Bienvenue sur votre tableau de bord d'administration</p>
              </div>
              <div className="text-end">
                <div className="d-flex align-items-center">
                  <FaUserShield size={30} className="me-2" />
                  <div>
                    <div className="fw-bold">Administrateur système</div>
                    <small>Accès complet aux fonctionnalités</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Stats Cards ===== */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Utilisateurs</h5>
                    <h2>{stats.total_users || 0}</h2>
                  </div>
                  <FaUsers size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Médecins</h5>
                    <h2>{stats.total_doctors || 0}</h2>
                  </div>
                  <FaUserMd size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Patients</h5>
                    <h2>{stats.total_patients || 0}</h2>
                  </div>
                  <FaUserInjured size={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Rendez-vous</h5>
                    <h2>{stats.total_appointments || 0}</h2>
                  </div>
                  <FaCalendarCheck size={30} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Quick Actions Carousel ===== */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Gestion rapide</h5>
            <div className="d-flex">
              <button className="btn btn-sm btn-outline-secondary me-1" onClick={prevSlide}>
                <FaChevronLeft />
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={nextSlide}>
                <FaChevronRight />
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="d-flex overflow-hidden">
              <div 
                className="d-flex" 
                style={{ 
                  transform: `translateX(-${currentSlide * 100}%)`, 
                  transition: "transform 0.5s ease-in-out",
                  width: `${Math.ceil(quickActions.length / 4) * 100}%`
                }}
              >
                {Array(Math.ceil(quickActions.length / 4)).fill().map((_, groupIndex) => (
                  <div key={groupIndex} className="d-flex" style={{ width: "100%" }}>
                    {quickActions.slice(groupIndex * 4, (groupIndex + 1) * 4).map((action, index) => (
                      <div key={index} className="col-md-3 mb-3 px-2">
                        <Link 
                          to={action.path}
                          className="text-decoration-none"
                        >
                          <div 
                            className="card h-100 text-center border-0 shadow-sm"
                            style={{ 
                              backgroundColor: `var(--bs-${action.color})`,
                              color: "white",
                              transition: "transform 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <div className="card-body d-flex flex-column justify-content-center align-items-center">
                              <div className="mb-2">{action.icon}</div>
                              <h6 className="card-title mb-0">{action.title}</h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Health Tip of the Day ===== */}
        <div className="alert alert-info d-flex align-items-center mb-4">
          <FaNotesMedical size={24} className="me-2" />
          <div>
            <strong>Conseil d'administration du jour:</strong> {healthTips[Math.floor(Math.random() * healthTips.length)]}
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Vue d'ensemble
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Utilisateurs
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              Rendez-vous
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "content" ? "active" : ""}`}
              onClick={() => setActiveTab("content")}
            >
              Contenu
            </button>
          </li>
        </ul>

        {/* ===== Overview Tab ===== */}
        {activeTab === "overview" && (
          <div>
            <div className="row">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Croissance des utilisateurs</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mois" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="utilisateurs" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Statistiques globales</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-column">
                      <div className="d-flex justify-content-between mb-3">
                        <span>Secrétaires</span>
                        <span className="fw-bold">{stats.total_secretaries || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Articles</span>
                        <span className="fw-bold">{stats.total_articles || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Hôpitaux</span>
                        <span className="fw-bold">{stats.total_hospitals || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Cliniques</span>
                        <span className="fw-bold">{stats.total_clinics || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Nouveaux cette semaine</span>
                        <span className="fw-bold text-success">+{stats.new_users_this_week || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Tendances des rendez-vous</h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={appointmentTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="jour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="rendez_vous" fill="#82ca9d" name="Rendez-vous" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Users Tab ===== */}
        {activeTab === "users" && (
          <div>
            <div className="row">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Gestion des utilisateurs</h5>
                    <button className="btn btn-primary">
                      <FaUser className="me-1" /> Ajouter un utilisateur
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Total</th>
                            <th>Actifs</th>
                            <th>Inactifs</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Médecins</td>
                            <td>{stats.total_doctors || 0}</td>
                            <td>{Math.round((stats.total_doctors || 0) * 0.95)}</td>
                            <td>{Math.round((stats.total_doctors || 0) * 0.05)}</td>
                            <td>
                              <Link to="/admin/medecins" className="btn btn-sm btn-outline-primary">
                                Gérer
                              </Link>
                            </td>
                          </tr>
                          <tr>
                            <td>Patients</td>
                            <td>{stats.total_patients || 0}</td>
                            <td>{Math.round((stats.total_patients || 0) * 0.85)}</td>
                            <td>{Math.round((stats.total_patients || 0) * 0.15)}</td>
                            <td>
                              <Link to="/admin/patients" className="btn btn-sm btn-outline-primary">
                                Gérer
                              </Link>
                            </td>
                          </tr>
                          <tr>
                            <td>Secrétaires</td>
                            <td>{stats.total_secretaries || 0}</td>
                            <td>{Math.round((stats.total_secretaries || 0) * 0.9)}</td>
                            <td>{Math.round((stats.total_secretaries || 0) * 0.1)}</td>
                            <td>
                              <Link to="/admin/secretaires" className="btn btn-sm btn-outline-primary">
                                Gérer
                              </Link>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Appointments Tab ===== */}
        {activeTab === "appointments" && (
          <div>
            <div className="row">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header">
                    <h5>Statistiques des rendez-vous</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="card mb-3">
                          <div className="card-body">
                            <h5 className="card-title">Total des rendez-vous</h5>
                            <h2>{stats.total_appointments || 0}</h2>
                            <p className="text-muted">Depuis le début</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card mb-3">
                          <div className="card-body">
                            <h5 className="card-title">Ce mois-ci</h5>
                            <h2>{stats.appointments_this_month || 0}</h2>
                            <p className="text-muted">Rendez-vous programmés</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5>Répartition par statut</h5>
                      <div className="d-flex">
                        <div className="flex-grow-1 me-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Confirmés</span>
                            <span>65%</span>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-success" role="progressbar" style={{ width: "65%" }}></div>
                          </div>
                        </div>
                        <div className="flex-grow-1 me-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>En attente</span>
                            <span>25%</span>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-warning" role="progressbar" style={{ width: "25%" }}></div>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Annulés</span>
                            <span>10%</span>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-danger" role="progressbar" style={{ width: "10%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Content Tab ===== */}
        {activeTab === "content" && (
          <div>
            <div className="row">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header">
                    <h5>Gestion du contenu</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="card mb-3">
                          <div className="card-body text-center">
                            <FaBookMedical size={40} className="text-primary mb-2" />
                            <h5>Articles de santé</h5>
                            <p className="display-4">{stats.total_articles || 0}</p>
                            <Link to="/admin/articles" className="btn btn-outline-primary">
                              Gérer les articles
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card mb-3">
                          <div className="card-body text-center">
                            <FaBuilding size={40} className="text-success mb-2" />
                            <h5>Établissements</h5>
                            <p className="display-4">{(stats.total_hospitals || 0) + (stats.total_clinics || 0)}</p>
                            <Link to="/admin/etablissements" className="btn btn-outline-success">
                              Gérer les établissements
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card mb-3">
                          <div className="card-body text-center">
                            <FaComments size={40} className="text-info mb-2" />
                            <h5>Messages</h5>
                            <p className="display-4">24</p>
                            <Link to="/admin/messages" className="btn btn-outline-info">
                              Voir les messages
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Enhanced Chatbot */}
      <EnhancedChatbot />
    </div>
  );
}

// Styles
const iconStyle = {
  width: "35px",
  height: "35px",
  borderRadius: "50%",
  backgroundColor: "#f0f0f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "15px",
  cursor: "pointer",
  position: "relative",
};

export default EnhancedDashboardAdminV2;