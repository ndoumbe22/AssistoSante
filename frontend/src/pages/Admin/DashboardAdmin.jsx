import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUserMd, FaUser, FaHospital, FaComments, 
  FaChartLine, FaChartPie, FaBell, FaSignOutAlt, 
  FaCog, FaSearch, FaStethoscope, FaUserNurse, FaCalendarAlt
} from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

import DonezoAdminDashboard from "./DonezoAdminDashboard";

function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("DashboardAdmin mounted, user:", user);
    
    // Check if user is admin
    if (user && user.role !== 'admin') {
      console.log("User is not admin, redirecting to unauthorized");
      navigate('/unauthorized');
      return;
    }
    
    // Small delay to ensure auth context is fully loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4">Chargement du tableau de bord administrateur...</p>
        </div>
      </div>
    );
  }

  // If no user or not admin, redirect
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p>Accès non autorisé. Redirection...</p>
          <button 
            onClick={() => navigate("/connecter")} 
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  console.log("Rendering DonezoAdminDashboard");
  return <DonezoAdminDashboard />;
}

export default DashboardAdmin;