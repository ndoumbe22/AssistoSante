import React, { useState, useEffect } from "react";
import { 
  FaUsers, FaCalendar, FaFileAlt, FaChartBar, 
  FaBell, FaExclamationTriangle, FaCheckCircle, FaChevronRight,
  FaRobot, FaHospital, FaUserMd
} from "react-icons/fa";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import { userAPI } from "../../services/api";
import "../../components/DashboardLayout.css";
import Chatbot from "../../components/Chatbot";

// Colors for charts
const COLORS = ['#0d9488', '#f59e0b', '#ef4444'];
const USER_COLORS = ['#0d9488', '#10b981', '#3b82f6'];

function DonezoAdminDashboard() {
  const [user, setUser] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    users: 0,
    appointments: 0,
    pendingArticles: 0,
    activeToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Starting to fetch admin dashboard data...");
        
        // Fetch user profile
        let userResponse = null;
        try {
          console.log("Fetching user profile...");
          userResponse = await userAPI.getProfile();
          console.log("User profile fetched successfully:", userResponse.data);
          setUser(userResponse.data);
        } catch (userError) {
          console.error("Error fetching user profile:", userError);
          // Set user from auth context if API fails
          if (authUser) {
            console.log("Using user data from auth context:", authUser);
            setUser({
              username: authUser.username,
              first_name: authUser.firstName,
              last_name: authUser.lastName,
              email: authUser.email
            });
          }
        }
        
        // Fetch admin statistics with better error handling
        let statsResponse = {};
        try {
          console.log("Fetching admin statistics...");
          statsResponse = await adminService.getStatistics();
          console.log("Admin statistics fetched successfully:", statsResponse);
          
          // Ensure we have the right data structure
          setStats({
            users: statsResponse.total_users || statsResponse.users_count || statsResponse.totalUsers || 0,
            appointments: statsResponse.total_rendez_vous || statsResponse.appointments_count || statsResponse.totalAppointments || 0,
            pendingArticles: statsResponse.pending_articles_count || statsResponse.pendingArticles || 0,
            activeToday: statsResponse.rendez_vous_today || statsResponse.active_today_count || statsResponse.activeToday || 0
          });
        } catch (statsError) {
          console.error("Error fetching statistics:", statsError);
          // Set default values
          setStats({
            users: 0,
            appointments: 0,
            pendingArticles: 0,
            activeToday: 0
          });
        }
        
        // Fetch users with better error handling
        try {
          console.log("Fetching users...");
          const usersResponse = await adminService.getUsers();
          console.log("Users fetched successfully:", usersResponse.length || 0, "users");
          
          // Generate recent activity from users data with better error handling
          const usersData = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);
          const activity = usersData.slice(0, 5).map((user, index) => ({
            id: index + 1,
            user: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Utilisateur',
            action: "a mis à jour son profil",
            time: "Il y a quelques minutes"
          }));
          setRecentActivity(activity);
        } catch (usersError) {
          console.error("Error fetching users:", usersError);
          setRecentActivity([]);
        }
        
        // Generate alerts with better error handling
        console.log("Generating alerts...");
        try {
          const pendingAppointments = statsResponse.rendez_vous_by_status?.find(s => s.statut === 'en_attente')?.count || 
                                     statsResponse.pending_appointments_count || 
                                     statsResponse.pendingAppointments || 0;
          
          const pendingArticles = statsResponse.pending_articles_count || 
                                 statsResponse.pendingArticles || 0;
          
          setAlerts([
            { id: 1, type: "warning", message: `${pendingAppointments} rendez-vous en attente de confirmation`, time: "Il y a 10 min" },
            { id: 2, type: "info", message: `${pendingArticles} articles en attente de validation`, time: "Il y a 25 min" },
            { id: 3, type: "success", message: "Système de sauvegarde opérationnel", time: "Il y a 1 heure" }
          ]);
        } catch (alertsError) {
          console.error("Error generating alerts:", alertsError);
          setAlerts([
            { id: 1, type: "success", message: "Système opérationnel", time: "Il y a 1 heure" }
          ]);
        }
        
      } catch (err) {
        console.error("General error in fetchData:", err);
        setError("Erreur lors du chargement des données: " + (err.message || "Erreur inconnue"));
      } finally {
        setLoading(false);
        console.log("Finished fetching admin dashboard data");
      }
    };

    fetchData();
  }, [authUser]);

  // Generate user data for charts
  const generateUserData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((day, index) => ({
      day,
      patients: 10 + Math.floor(Math.random() * 10),
      doctors: 2 + Math.floor(Math.random() * 5),
      admins: 1
    }));
  };

  // Appointment statistics
  const appointmentStats = [
    { name: 'Confirmés', value: 65 },
    { name: 'En attente', value: 20 },
    { name: 'Annulés', value: 15 }
  ];

  // User distribution
  const userDistribution = [
    { name: 'Patients', value: 75 },
    { name: 'Médecins', value: 20 },
    { name: 'Admins', value: 5 }
  ];

  // Stat cards data
  const statCards = [
    { title: "Utilisateurs", value: stats.users, icon: <FaUsers />, color: "bg-teal-100 text-teal-600" },
    { title: "Rendez-vous", value: stats.appointments, icon: <FaCalendar />, color: "bg-blue-100 text-blue-600" },
    { title: "Articles en attente", value: stats.pendingArticles, icon: <FaFileAlt />, color: "bg-yellow-100 text-yellow-600" },
    { title: "Actifs aujourd'hui", value: stats.activeToday, icon: <FaChartBar />, color: "bg-green-100 text-green-600" }
  ];

  // Quick access buttons for main functionalities
  const quickAccessButtons = [
    { title: "Gestion utilisateurs", icon: <FaUsers />, color: "bg-blue-100 text-blue-600", onClick: () => navigate("/admin/utilisateurs") },
    { title: "Modération articles", icon: <FaFileAlt />, color: "bg-green-100 text-green-600", onClick: () => navigate("/admin/articles") },
    { title: "Paramétrage chatbot", icon: <FaRobot />, color: "bg-purple-100 text-purple-600", onClick: () => navigate("/admin/chatbot") },
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4">Chargement du tableau de bord administrateur...</p>
            <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="container mx-auto py-6 px-4">
          <div className="alert alert-danger bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="text-lg font-bold mb-2">Erreur de chargement</h3>
            <p>{error}</p>
            <div className="mt-4 flex space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Réessayer
              </button>
              <button 
                onClick={() => navigate("/connecter")} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Se reconnecter
              </button>
            </div>
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
              <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
              <p className="opacity-90">
                Bonjour, {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || user?.email || 'Administrateur'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-teal-700 transition">
                <FaBell className="text-xl" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="font-semibold">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'A'}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            {/* System Alerts */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaExclamationTriangle className="text-teal-600" />
                Alertes système
              </h2>
              
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      alert.type === 'info' ? 'border-blue-500 bg-blue-50' :
                      alert.type === 'success' ? 'border-green-500 bg-green-50' : 'border-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      {alert.type === 'warning' && <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-2" />}
                      {alert.type === 'info' && <FaBell className="text-blue-500 mt-0.5 mr-2" />}
                      {alert.type === 'success' && <FaCheckCircle className="text-green-500 mt-0.5 mr-2" />}
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Distribution */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaUsers className="text-teal-600" />
                Distribution des utilisateurs
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={USER_COLORS[index % USER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaBell className="text-teal-600" />
                Activité récente
              </h2>
              
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start p-3 border-b last:border-0">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-teal-600 text-xs font-bold">
                          {activity.user.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.user}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* User Registration Chart */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaChartBar className="text-teal-600" />
                Inscriptions cette semaine
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateUserData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="patients" stackId="1" stroke="#0d9488" fill="#0d9488" name="Patients" />
                    <Area type="monotone" dataKey="doctors" stackId="1" stroke="#10b981" fill="#10b981" name="Médecins" />
                    <Area type="monotone" dataKey="admins" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Admins" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Appointment Statistics */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaCalendar className="text-teal-600" />
                Statistiques des rendez-vous
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Rendez-vous">
                      {appointmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Status */}
            <div className="dashboard-card p-6">
              <h2 className="section-title mb-4">
                <FaCheckCircle className="text-teal-600" />
                État du système
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Base de données</span>
                    <span className="text-sm text-green-600">Opérationnel</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Serveur API</span>
                    <span className="text-sm text-green-600">Opérationnel</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Stockage</span>
                    <span className="text-sm text-yellow-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Sauvegarde</span>
                    <span className="text-sm text-green-600">À jour</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
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

export default DonezoAdminDashboard;