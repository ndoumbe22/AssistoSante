import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate import
import { FaPlus, FaEdit, FaTrash, FaChartBar, FaCalendarAlt, FaPills, FaArrowLeft } from "react-icons/fa"; // Added FaArrowLeft import
import medicationService from "../../services/medicationService";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function MedicationReminders() {
  const navigate = useNavigate(); // Added navigate hook
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [activeTab, setActiveTab] = useState("reminders");
  const [statistics, setStatistics] = useState(null);

  const [formData, setFormData] = useState({
    medicament: "",
    dosage: "",
    frequence: "1/jour",
    heure_rappel: "",
    date_debut: "",
    date_fin: "",
    notes: ""
  });

  useEffect(() => {
    loadReminders();
    loadHistory();
    loadStatistics();
  }, []);

  useEffect(() => {
    setFilteredReminders(reminders);
  }, [reminders]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await medicationService.getReminders();
      setReminders(data);
    } catch (err) {
      setError("Erreur lors du chargement des rappels: " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await medicationService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
    }
  };

  const loadStatistics = async () => {
    try {
      // Calculate statistics from history data
      const today = new Date();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      // Count taken medications per day
      const dailyCounts = last7Days.map(date => {
        const count = history.filter(item => 
          item.prise_effectuee && 
          item.date_prise.startsWith(date)
        ).length;
        return count;
      });

      // Adherence rate
      const totalTaken = history.filter(item => item.prise_effectuee).length;
      const totalReminders = history.length;
      const adherenceRate = totalReminders > 0 ? Math.round((totalTaken / totalReminders) * 100) : 0;

      setStatistics({
        last7Days,
        dailyCounts,
        adherenceRate,
        totalTaken,
        totalReminders
      });
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  };

  const frequencies = [
    { value: "1/jour", label: "1 fois par jour" },
    { value: "2/jour", label: "2 fois par jour" },
    { value: "3/jour", label: "3 fois par jour" },
    { value: "4/jour", label: "4 fois par jour" },
    { value: "1/semaine", label: "1 fois par semaine" },
    { value: "autre", label: "Autre" }
  ];

  const getFrequencyLabel = (frequency) => {
    const freq = frequencies.find(f => f.value === frequency);
    return freq ? freq.label : frequency;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentReminder) {
        // Update existing reminder
        await medicationService.updateReminder(currentReminder.id, formData);
        setShowEditModal(false);
      } else {
        // Add new reminder
        await medicationService.createReminder(formData);
        setShowAddModal(false);
      }
      
      setFormData({
        medicament: "",
        dosage: "",
        frequence: "1/jour",
        heure_rappel: "",
        date_debut: "",
        date_fin: "",
        notes: ""
      });
      setCurrentReminder(null);
      loadReminders();
      loadHistory();
      loadStatistics();
      alert(currentReminder ? "Rappel mis à jour" : "Rappel ajouté");
    } catch (err) {
      alert("Erreur lors de l'enregistrement: " + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const handleEdit = (reminder) => {
    setCurrentReminder(reminder);
    setFormData({
      medicament: reminder.medicament,
      dosage: reminder.dosage,
      frequence: reminder.frequence,
      heure_rappel: reminder.heure_rappel,
      date_debut: reminder.date_debut,
      date_fin: reminder.date_fin || "",
      notes: reminder.notes || ""
    });
    setShowEditModal(true);
  };

  const handleDelete = async (reminderId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rappel ?")) {
      try {
        await medicationService.deleteReminder(reminderId);
        loadReminders();
        loadHistory();
        loadStatistics();
        alert("Rappel supprimé");
      } catch (err) {
        alert("Erreur lors de la suppression: " + (err.response?.data?.error || err.message));
        console.error(err);
      }
    }
  };

  const handleMarkTaken = async (historyId) => {
    try {
      await medicationService.markTaken(historyId, "Pris par le patient");
      loadHistory();
      loadStatistics();
      alert("Médicament marqué comme pris");
    } catch (err) {
      alert("Erreur lors de la mise à jour: " + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const handleAddNew = () => {
    setCurrentReminder(null);
    setFormData({
      medicament: "",
      dosage: "",
      frequence: "1/jour",
      heure_rappel: "",
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: "",
      notes: ""
    });
    setShowAddModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  // Chart data
  const chartData = {
    labels: statistics?.last7Days.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Médicaments pris',
        data: statistics?.dailyCounts || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const barChartData = {
    labels: ['Adhérence'],
    datasets: [
      {
        label: 'Taux d\'adhérence',
        data: [statistics?.adherenceRate || 0],
        backgroundColor: statistics?.adherenceRate >= 80 ? 'rgba(75, 192, 192, 0.6)' : 
                       statistics?.adherenceRate >= 60 ? 'rgba(255, 205, 86, 0.6)' : 
                       'rgba(255, 99, 132, 0.6)',
        borderColor: statistics?.adherenceRate >= 80 ? 'rgb(75, 192, 192)' : 
                      statistics?.adherenceRate >= 60 ? 'rgb(255, 205, 86)' : 
                      'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Added back button */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate("/patient/dashboard")}
            >
              <FaArrowLeft className="me-2" />
              Retour au tableau de bord
            </button>
            <h2>
              <FaPills className="me-2" />
              Rappels de Médicaments
            </h2>
            <button 
              className="btn btn-primary"
              onClick={handleAddNew}
            >
              <FaPlus className="me-2" />
              Ajouter un rappel
            </button>
          </div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}
          
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "reminders" ? "active" : ""}`}
                onClick={() => setActiveTab("reminders")}
              >
                <FaCalendarAlt className="me-2" />
                Rappels Actifs
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                <FaChartBar className="me-2" />
                Historique
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "statistics" ? "active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                <FaChartBar className="me-2" />
                Statistiques
              </button>
            </li>
          </ul>
          
          {/* Reminders Tab */}
          {activeTab === "reminders" && (
            <div className="row">
              {filteredReminders.length === 0 ? (
                <div className="col-12">
                  <div className="card text-center p-5">
                    <h4 className="text-muted">
                      <FaPills className="me-2" />
                      Aucun rappel de médicament
                    </h4>
                    <p className="text-muted">
                      Vous n'avez pas encore configuré de rappels de médicaments.
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={handleAddNew}
                    >
                      <FaPlus className="me-2" />
                      Ajouter votre premier rappel
                    </button>
                  </div>
                </div>
              ) : (
                filteredReminders.map((reminder) => (
                  <div key={reminder.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-header bg-primary text-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">{reminder.medicament}</h5>
                          <span className="badge bg-light text-dark">
                            {reminder.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>
                      <div className="card-body">
                        <p className="card-text">
                          <strong>Dosage:</strong> {reminder.dosage}
                        </p>
                        <p className="card-text">
                          <strong>Fréquence:</strong> {getFrequencyLabel(reminder.frequence)}
                        </p>
                        <p className="card-text">
                          <strong>Heure:</strong> {formatTime(reminder.heure_rappel)}
                        </p>
                        <p className="card-text">
                          <strong>Début:</strong> {formatDate(reminder.date_debut)}
                        </p>
                        {reminder.date_fin && (
                          <p className="card-text">
                            <strong>Fin:</strong> {formatDate(reminder.date_fin)}
                          </p>
                        )}
                        {reminder.notes && (
                          <p className="card-text">
                            <strong>Notes:</strong> {reminder.notes}
                          </p>
                        )}
                      </div>
                      <div className="card-footer">
                        <div className="btn-group w-100" role="group">
                          <button 
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleEdit(reminder)}
                          >
                            <FaEdit className="me-1" />
                            Modifier
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(reminder.id)}
                          >
                            <FaTrash className="me-1" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === "history" && (
            <div className="card">
              <div className="card-body">
                {history.length === 0 ? (
                  <div className="text-center py-5">
                    <h4 className="text-muted">
                      <FaChartBar className="me-2" />
                      Aucun historique
                    </h4>
                    <p className="text-muted">
                      Aucun historique de prise de médicaments disponible.
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Médicament</th>
                          <th>Date/Heure</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.rappel_medicament}</strong>
                            </td>
                            <td>
                              {new Date(item.date_prise).toLocaleString('fr-FR')}
                            </td>
                            <td>
                              {item.prise_effectuee ? (
                                <span className="badge bg-success">Pris</span>
                              ) : (
                                <span className="badge bg-warning">En attente</span>
                              )}
                            </td>
                            <td>
                              {!item.prise_effectuee && (
                                <button 
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleMarkTaken(item.id)}
                                >
                                  Marquer comme pris
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Statistics Tab */}
          {activeTab === "statistics" && statistics && (
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <h5 className="card-title">Taux d'Adhérence</h5>
                    <div className="display-4 mb-3">
                      {statistics.adherenceRate}%
                    </div>
                    <div className={`progress ${statistics.adherenceRate >= 80 ? 'bg-success' : statistics.adherenceRate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${statistics.adherenceRate}%` }}
                      ></div>
                    </div>
                    <p className="mt-2">
                      {statistics.totalTaken} pris sur {statistics.totalReminders} rappels
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-8 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Prises des 7 derniers jours</h5>
                    <Line 
                      data={chartData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Médicaments pris par jour'
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-md-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Résumé de l'Adhérence</h5>
                    <Bar 
                      data={barChartData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentReminder ? "Modifier le rappel" : "Ajouter un rappel"}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Médicament *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="medicament"
                          value={formData.medicament}
                          onChange={handleInputChange}
                          placeholder="Nom du médicament"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Dosage *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="dosage"
                          value={formData.dosage}
                          onChange={handleInputChange}
                          placeholder="Ex: 500mg, 1 comprimé"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fréquence</label>
                        <select
                          className="form-select"
                          name="frequence"
                          value={formData.frequence}
                          onChange={handleInputChange}
                        >
                          {frequencies.map(freq => (
                            <option key={freq.value} value={freq.value}>
                              {freq.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Heure du rappel *</label>
                        <input
                          type="time"
                          className="form-control"
                          name="heure_rappel"
                          value={formData.heure_rappel}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date de début *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date_debut"
                          value={formData.date_debut}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date de fin</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date_fin"
                          value={formData.date_fin}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Instructions spéciales, effets secondaires, etc."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {currentReminder ? "Mettre à jour" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicationReminders;