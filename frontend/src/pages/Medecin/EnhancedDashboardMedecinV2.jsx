import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaCalendarCheck, FaUserMd, FaFileMedical, FaEnvelope, 
  FaCog, FaSignOutAlt, FaUser, FaSearch, FaBell, 
  FaPills, FaRobot, FaChartLine, FaQrcode, FaStar,
  FaChevronLeft, FaChevronRight, FaStethoscope, FaHospital,
  FaPrescriptionBottle, FaHeartbeat, FaNotesMedical, FaUsers,
  FaClipboardList, FaComments, FaBookMedical, FaVideo
} from "react-icons/fa";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { doctorAPI, appointmentAPI } from "../../services/api";
import EnhancedChatbot from "../../components/EnhancedChatbot";
import NotificationCenter from "../../components/NotificationCenter";
import DoctorRatingsDisplay from "../../components/DoctorRatingsDisplay";

function EnhancedDashboardMedecinV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState("light");
  const [fullName, setFullName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showRatings, setShowRatings] = useState(false);

  // 🔔 Notifications
  const [notifications, setNotifications] = useState([
    "Nouveau patient en attente de confirmation.",
    "Rappel: Consultation à 14h avec M. Diop.",
    "Nouveau message de votre secrétaire.",
  ]);

  // Quick actions carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const quickActions = [
    { 
      title: "Mes rendez-vous", 
      icon: <FaCalendarCheck size={24} />, 
      color: "primary",
      path: "/medecin/rendez-vous"
    },
    { 
      title: "Mes consultations", 
      icon: <FaVideo size={24} />, 
      color: "info",
      path: "/medecin/consultations"
    },
    { 
      title: "Mes patients", 
      icon: <FaUsers size={24} />, 
      color: "success",
      path: "/medecin/patients"
    },
    { 
      title: "Dossiers médicaux", 
      icon: <FaFileMedical size={24} />, 
      color: "info",
      path: "/medecin/dossiers-patients"
    },
    { 
      title: "Documents partagés", 
      icon: <FaClipboardList size={24} />, 
      color: "warning",
      path: "/medecin/document-partage"
    }
  ];

  // Health tips for doctors
  const healthTips = [
    "Prenez des pauses régulières pour éviter l'épuisement professionnel.",
    "Maintenez une bonne posture pendant les consultations.",
    "Hydratez-vous régulièrement tout au long de la journée.",
    "Pratiquez une activité physique pour réduire le stress.",
    "Assurez-vous de bien dormir pour maintenir votre concentration."
  ];

  // Charger les données du médecin depuis l'API
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get doctor's full name from user data
        if (user) {
          const firstName = user.firstName || user.first_name || "";
          const lastName = user.lastName || user.last_name || "";
          const username = user.username || "";
          const specialty = user.specialty || user.profile?.specialty || "Médecin";
          setFullName(`Dr. ${firstName} ${lastName}`.trim() || `Dr. ${username}`.trim() || `Dr. ${specialty}`);
          
          // Set doctor data with user information
          setDoctorData({
            id: 1, // In a real implementation, this would come from the API
            user: {
              first_name: firstName,
              last_name: lastName,
              email: user.email || ""
            },
            specialite: "Médecin", // Default specialty
            rating: 0,
            total_patients: 0,
            consultations_this_month: 0
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des données du médecin :", err);
        setError("Erreur lors du chargement des données du médecin");
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [user]);

  // Charger les rendez-vous du médecin
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await appointmentAPI.getAppointments();
        setAppointments(response?.data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des rendez-vous :", err);
        setAppointments([]);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Charger les patients du médecin
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // In a real implementation, you would call the API to get the doctor's patients
        // For now, we'll simulate with appointment data since there might not be a specific endpoint
        const appointmentsResponse = await appointmentAPI.getAppointments();
        
        // Extract unique patients from appointments
        const uniquePatients = [...new Set(appointmentsResponse.data.map(app => app.patient_name || app.patient || 'Patient inconnu'))];
        
        // Create patient objects with mock data (in a real app, this would come from a patients endpoint)
        const patientData = uniquePatients.slice(0, 4).map((name, index) => ({
          id: index + 1,
          nom: name,
          age: 20 + Math.floor(Math.random() * 60), // Random age between 20-80
          derniere_consultation: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Random date within last 30 days
        }));
        
        setPatients(patientData);
      } catch (err) {
        console.error("Erreur lors du chargement des patients :", err);
        
        // Fallback to mock data if API fails
        setPatients([
          { id: 1, nom: "Aminata Fall", age: 35, derniere_consultation: "2024-06-10" },
          { id: 2, nom: "Mamadou Sow", age: 42, derniere_consultation: "2024-06-08" },
          { id: 3, nom: "Fatou Ndiaye", age: 28, derniere_consultation: "2024-06-05" },
          { id: 4, nom: "Ousmane Sarr", age: 55, derniere_consultation: "2024-06-01" }
        ]);
      }
    };

    if (user) {
      fetchPatients();
    }
  }, [user]);

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
      setCurrentSlide(prev => (prev + 1) % Math.ceil(quickActions.length / 3));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [quickActions.length]);

  const handleLogout = () => {
    // Clear all stored data using the same names as AuthContext
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
  const [appointmentHistoryData, setAppointmentHistoryData] = useState([
    { mois: "Mai", rendez_vous: 38 },
    { mois: "Juin", rendez_vous: 42 },
    { mois: "Juil", rendez_vous: 35 }
  ]);

  const [patientAgeDistribution, setPatientAgeDistribution] = useState([
    { range: "0-18", count: 15 },
    { range: "19-35", count: 42 },
    { range: "36-50", count: 38 },
    { range: "51-65", count: 25 },
    { range: "65+", count: 12 }
  ]);

  const [consultationTypes, setConsultationTypes] = useState([
    { type: "Consultation générale", count: 65 },
    { type: "Suivi chronique", count: 28 },
    { type: "Urgence", count: 12 },
    { type: "Prévention", count: 18 }
  ]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => window.location.reload()}
              ></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}>
      {/* Header */}
      <header className={`sticky-top shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <Link className="navbar-brand d-flex align-items-center" to="/medecin/dashboard">
              <FaUserMd className="me-2 text-primary" size={24} />
              <span className="fw-bold">Santé Virtuelle</span>
            </Link>
            
            <div className="d-flex align-items-center">
              {/* Search Bar */}
              <div className="input-group me-3" style={{ width: "300px" }}>
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Notifications */}
              <div className="me-3 position-relative" style={iconStyle}>
                <FaBell size={20} />
                {notifications.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {notifications.length}
                  </span>
                )}
                <NotificationCenter 
                  notifications={notifications} 
                  onClear={() => setNotifications([])} 
                />
              </div>
              
              {/* User Profile */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                >
                  <FaUser className="me-2" />
                  {fullName || user?.username || "Médecin"}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/medecin/profile">
                      <FaUser className="me-2" /> Mon profil
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/medecin/notifications">
                      <FaBell className="me-2" /> Notifications
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/medecin/settings">
                      <FaCog className="me-2" /> Paramètres
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Secondary Navigation */}
        <div className="border-bottom">
          <div className="container-fluid">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <FaChartLine className="me-2" /> Vue d'ensemble
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
                  onClick={() => setActiveTab("appointments")}
                >
                  <FaCalendarCheck className="me-2" /> Rendez-vous
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "patients" ? "active" : ""}`}
                  onClick={() => setActiveTab("patients")}
                >
                  <FaUsers className="me-2" /> Patients
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "documents" ? "active" : ""}`}
                  onClick={() => setActiveTab("documents")}
                >
                  <FaFileMedical className="me-2" /> Documents
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "articles" ? "active" : ""}`}
                  onClick={() => setActiveTab("articles")}
                >
                  <FaBookMedical className="me-2" /> Articles
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "ratings" ? "active" : ""}`}
                  onClick={() => setShowRatings(!showRatings)}
                >
                  <FaStar className="me-2" /> Évaluations
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid py-4">
        {activeTab === "overview" && (
          <div className="row">
            {/* Stats Cards */}
            <div className="col-md-3 mb-4">
              <div className="card border-primary h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title text-muted">Rendez-vous aujourd'hui</h6>
                      <h2 className="card-text">{appointments.length}</h2>
                    </div>
                    <FaCalendarCheck size={32} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card border-success h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title text-muted">Patients actifs</h6>
                      <h2 className="card-text">{patients.length}</h2>
                    </div>
                    <FaUsers size={32} className="text-success" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card border-info h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title text-muted">Consultations ce mois</h6>
                      <h2 className="card-text">42</h2>
                    </div>
                    <FaStethoscope size={32} className="text-info" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-4">
              <div className="card border-warning h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title text-muted">Note moyenne</h6>
                      <h2 className="card-text">4.2/5</h2>
                    </div>
                    <FaStar size={32} className="text-warning" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Carousel */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Actions rapides</h5>
                  <div className="d-flex">
                    <button 
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                    >
                      <FaChevronLeft />
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCurrentSlide(prev => Math.min(Math.ceil(quickActions.length / 3) - 1, prev + 1))}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex overflow-hidden">
                    {quickActions
                      .slice(currentSlide * 3, currentSlide * 3 + 3)
                      .map((action, index) => (
                        <div 
                          key={index} 
                          className="col-md-4 px-2"
                          onClick={() => navigate(action.path)}
                        >
                          <div 
                            className={`card h-100 text-center cursor-pointer border-${action.color} hover-shadow`}
                            style={{ minHeight: "150px" }}
                          >
                            <div className="card-body d-flex flex-column justify-content-center align-items-center">
                              <div className={`mb-3 text-${action.color}`}>
                                {action.icon}
                              </div>
                              <h6 className="card-title">{action.title}</h6>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="col-md-8 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5>Historique des rendez-vous</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={appointmentHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rendez_vous" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name="Rendez-vous"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5>Répartition des patients par âge</h5>
                </div>
                <div className="card-body" style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patientAgeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {patientAgeDistribution.map((entry, index) => (
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

            {/* Health Tip */}
            <div className="col-md-12">
              <div className="alert alert-info d-flex align-items-center">
                <FaHeartbeat size={24} className="me-3" />
                <div>
                  <strong>Conseil santé pour les médecins:</strong> {healthTips[Math.floor(Math.random() * healthTips.length)]}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Rendez-vous</h5>
                  <Link to="/medecin/rendez-vous" className="btn btn-primary">
                    Voir tous les rendez-vous
                  </Link>
                </div>
                <div className="card-body">
                  {appointments.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Date</th>
                            <th>Heure</th>
                            <th>Motif</th>
                            <th>Type</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.slice(0, 5).map(appointment => (
                            <tr key={appointment.id}>
                              <td>{appointment.patient_name || appointment.patient || 'Patient non spécifié'}</td>
                              <td>{appointment.date ? new Date(appointment.date).toLocaleDateString('fr-FR') : 'Date non spécifiée'}</td>
                              <td>{appointment.time || 'Heure non spécifiée'}</td>
                              <td>{appointment.motif || 'Motif non spécifié'}</td>
                              <td>
                                {appointment.type_consultation === "teleconsultation" ? (
                                  <span className="badge bg-info">
                                    📹 Téléconsultation
                                  </span>
                                ) : (
                                  <span className="badge bg-success">
                                    🏥 Au cabinet
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${
                                  appointment.status === 'confirmed' ? 'bg-success' : 
                                  appointment.status === 'pending' ? 'bg-warning' : 
                                  appointment.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {appointment.status === 'confirmed' ? 'Confirmé' : 
                                   appointment.status === 'pending' ? 'En attente' : 
                                   appointment.status === 'cancelled' ? 'Annulé' : 'Inconnu'}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button className="btn btn-sm btn-outline-primary">Voir</button>
                                  <button className="btn btn-sm btn-outline-success">Confirmer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">Aucun rendez-vous trouvé.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Patients</h5>
                  <Link to="/medecin/patients" className="btn btn-primary">
                    Voir tous les patients
                  </Link>
                </div>
                <div className="card-body">
                  {patients.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Âge</th>
                            <th>Dernière consultation</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.map(patient => (
                            <tr key={patient.id}>
                              <td>{patient.nom}</td>
                              <td>{patient.age} ans</td>
                              <td>{patient.derniere_consultation ? new Date(patient.derniere_consultation).toLocaleDateString('fr-FR') : 'Non spécifiée'}</td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button className="btn btn-sm btn-outline-primary">Voir dossier</button>
                                  <button className="btn btn-sm btn-outline-success">Contacter</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">Aucun patient trouvé.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Documents médicaux</h5>
                  <Link to="/medecin/document-partage" className="btn btn-primary">
                    Gérer les documents
                  </Link>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <FaFileMedical className="me-2" />
                    Cette section vous permet de gérer les documents médicaux partagés avec vos patients.
                  </div>
                  <div className="d-flex justify-content-center">
                    <Link to="/medecin/document-partage" className="btn btn-lg btn-primary">
                      Accéder aux documents
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "articles" && (
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Mes articles</h5>
                  <Link to="/medecin/articles" className="btn btn-primary">
                    Gérer mes articles
                  </Link>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <FaBookMedical className="me-2" />
                    Cette section vous permet de rédiger, publier et gérer vos articles médicaux.
                  </div>
                  <div className="d-flex justify-content-center">
                    <Link to="/medecin/articles" className="btn btn-lg btn-primary">
                      Accéder à mes articles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRatings && (
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5>Évaluations des patients</h5>
                </div>
                <div className="card-body">
                  <DoctorRatingsDisplay doctorId={doctorData?.id || 1} />
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

export default EnhancedDashboardMedecinV2;