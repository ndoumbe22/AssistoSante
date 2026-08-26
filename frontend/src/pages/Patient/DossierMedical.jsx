import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { patientAPI, userAPI, medicalDocumentAPI } from "../../services/api";
import { 
  FaUser, FaHeart, FaWeight, FaTemperatureHigh, 
  FaPrescription, FaFileMedical, FaAllergies,
  FaPhone, FaEnvelope, FaMapMarkerAlt
} from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

function DossierMedical() {
  const { user, isAuthenticated } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [traitements, setTraitements] = useState([]);
  const [mesures, setMesures] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  // Charger les données du dossier médical
  useEffect(() => {
    const fetchMedicalData = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch current user's profile data
        const profileResponse = await userAPI.getProfile();
        console.log("User profile:", profileResponse.data);
        
        // Set patient data with user profile information
        setPatientData({
          nom: profileResponse.data.last_name || "",
          prenom: profileResponse.data.first_name || "",
          email: profileResponse.data.email || "",
          telephone: profileResponse.data.telephone || "",
          adresse: profileResponse.data.adresse || "",
          // Add other fields as needed
          allergies: [],
          contactUrgence: {
            nom: "",
            telephone: ""
          }
        });
        
        // Fetch medications
        try {
          const medicationsResponse = await patientAPI.getMedications();
          setTraitements(medicationsResponse.data);
        } catch (medicationError) {
          console.error("Error fetching medications:", medicationError);
          setTraitements([]);
        }
        
        // Fetch consultations from the API
        try {
          const consultationsResponse = await patientAPI.getAppointmentHistory();
          // Transform the data to match the expected format
          const formattedConsultations = consultationsResponse.data.map(app => ({
            id: app.id,
            date: app.date,
            medecin: app.doctor_name || app.doctor || "Médecin non spécifié",
            diagnostic: app.diagnostic || "Diagnostic non disponible",
            ordonnance: app.ordonnance || "Ordonnance non disponible"
          }));
          setConsultations(formattedConsultations);
        } catch (consultationError) {
          console.error("Error fetching consultations:", consultationError);
          // Fallback to mock data if API fails
          const mockConsultations = [
            { id: 1, date: "2023-10-15", medecin: "Dr. Ibrahim Dia", diagnostic: "Rhume saisonnier", ordonnance: "Paracétamol 500mg, 3 fois par jour pendant 5 jours" },
            { id: 2, date: "2023-08-22", medecin: "Dr. Fatou Ndiaye", diagnostic: "Hypertension légère", ordonnance: "Surveillance régulière, réduction sel" },
            { id: 3, date: "2023-05-10", medecin: "Dr. Mamadou Fall", diagnostic: "Migraine chronique", ordonnance: "Propranolol 40mg matin et soir" }
          ];
          setConsultations(mockConsultations);
        }
        
        // Fetch medical measures from the API (this would need a specific endpoint)
        try {
          // For now, we'll use mock data as there's no specific API endpoint
          // In a real implementation, you would call the appropriate API
          const mockMesures = [
            { id: 1, constante: "Poids", valeur: 65, unite: "kg", date: "2023-10-15" },
            { id: 2, constante: "Tension", valeur: "130/85", unite: "mmHg", date: "2023-10-15" },
            { id: 3, constante: "Température", valeur: 37.2, unite: "°C", date: "2023-10-15" },
            { id: 4, constante: "Poids", valeur: 64, unite: "kg", date: "2023-08-22" },
            { id: 5, constante: "Tension", valeur: "125/80", unite: "mmHg", date: "2023-08-22" },
            { id: 6, constante: "Poids", valeur: 66, unite: "kg", date: "2023-05-10" }
          ];
          setMesures(mockMesures);
        } catch (mesuresError) {
          console.error("Error fetching medical measures:", mesuresError);
          setMesures([]);
        }
        
        // Fetch medical documents from the API
        try {
          const documentsResponse = await medicalDocumentAPI.getDocuments();
          // Transform the data to match the expected format
          const formattedDocuments = documentsResponse.data.map(doc => ({
            id: doc.id,
            nom: doc.title || doc.name || "Document sans titre",
            date: doc.uploaded_at || doc.created_at || new Date().toISOString(),
            type: doc.file_type || "pdf"
          }));
          setDocuments(formattedDocuments);
        } catch (documentError) {
          console.error("Error fetching documents:", documentError);
          // Fallback to mock data if API fails
          const mockDocuments = [
            { id: 1, nom: "Analyse sanguine.pdf", date: "2023-10-15", type: "pdf" },
            { id: 2, nom: "Radiographie thoracique.jpg", date: "2023-08-22", type: "image" },
            { id: 3, nom: "Ordonnance_2023_10.pdf", date: "2023-10-15", type: "pdf" }
          ];
          setDocuments(mockDocuments);
        };
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement du dossier médical: " + (err.response?.data?.error || err.message));
        setLoading(false);
        console.error("Erreur lors du chargement du dossier médical :", err);
      }
    };

    if (isAuthenticated) {
      fetchMedicalData();
    }
  }, [isAuthenticated, user]);

  // Données pour les graphiques
  const poidsData = mesures
    .filter(m => m.constante === "Poids")
    .map(m => ({ date: m.date, poids: m.valeur }));
    
  const tensionData = mesures
    .filter(m => m.constante === "Tension")
    .map(m => ({ date: m.date, tension: m.valeur }));

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">Dossier Médical</h2>
          
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <FaUser className="me-2" /> Informations Personnelles
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "consultations" ? "active" : ""}`}
                onClick={() => setActiveTab("consultations")}
              >
                <FaFileMedical className="me-2" /> Historique Consultations
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "constantes" ? "active" : ""}`}
                onClick={() => setActiveTab("constantes")}
              >
                <FaHeart className="me-2" /> Constantes Médicales
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "traitements" ? "active" : ""}`}
                onClick={() => setActiveTab("traitements")}
              >
                <FaPrescription className="me-2" /> Traitements en Cours
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "documents" ? "active" : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                <FaFileMedical className="me-2" /> Documents Médicaux
              </button>
            </li>
          </ul>
          
          {/* Contenu selon l'onglet actif */}
          {activeTab === "info" && (
            <div className="row">
              <div className="col-md-8">
                <div className="card shadow-sm p-4 mb-4">
                  <h4 className="mb-4">Informations Personnelles</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Nom:</strong> {patientData?.nom}</p>
                      <p><strong>Prénom:</strong> {patientData?.prenom}</p>
                      <p><strong>Âge:</strong> {patientData?.age} ans</p>
                      <p><strong>Sexe:</strong> {patientData?.sexe}</p>
                      <p><strong>Groupe sanguin:</strong> {patientData?.groupeSanguin}</p>
                    </div>
                    <div className="col-md-6">
                      <p><FaPhone className="me-2" /> {patientData?.telephone}</p>
                      <p><FaEnvelope className="me-2" /> {patientData?.email}</p>
                      <p><FaMapMarkerAlt className="me-2" /> {patientData?.adresse}</p>
                    </div>
                  </div>
                </div>
                
                <div className="card shadow-sm p-4">
                  <h4 className="mb-4">Informations Médicales</h4>
                  <div className="mb-4">
                    <h5><FaAllergies className="me-2 text-danger" /> Allergies</h5>
                    {patientData?.allergies.map((allergie, index) => (
                      <span key={index} className="badge bg-danger me-2">{allergie}</span>
                    ))}
                  </div>
                  
                  <div>
                    <h5>Contact d'Urgence</h5>
                    <p><strong>{patientData?.contactUrgence.nom}</strong></p>
                    <p><FaPhone className="me-2" /> {patientData?.contactUrgence.telephone}</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card shadow-sm p-4 text-center">
                  <div className="d-flex justify-content-center mb-3">
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FaUser size={50} color="#2E7D32" />
                    </div>
                  </div>
                  <h4>{patientData?.prenom} {patientData?.nom}</h4>
                  <p className="text-muted">Patient</p>
                  <hr />
                  <p className="mb-1"><strong>Dernière consultation:</strong></p>
                  <p>15 octobre 2023</p>
                  <p className="mb-1"><strong>Prochain rendez-vous:</strong></p>
                  <p>Aucun</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "consultations" && (
            <div>
              <h4 className="mb-4">Historique des Consultations</h4>
              {consultations.length === 0 ? (
                <div className="card shadow-sm p-5 text-center">
                  <p>Aucune consultation enregistrée.</p>
                </div>
              ) : (
                <div className="row">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="col-md-6 mb-4">
                      <div className="card shadow-sm p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5>{consultation.date}</h5>
                          <span className="badge bg-success">Consultation</span>
                        </div>
                        <p><strong>Médecin:</strong> {consultation.medecin}</p>
                        <p><strong>Diagnostic:</strong> {consultation.diagnostic}</p>
                        <p><strong>Ordonnance:</strong> {consultation.ordonnance}</p>
                        <button className="btn btn-outline-success btn-sm">
                          Télécharger le document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "constantes" && (
            <div>
              <h4 className="mb-4">Évolution des Constantes Médicales</h4>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card shadow-sm p-3">
                    <h5>Évolution du Poids (kg)</h5>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={poidsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="poids" stroke="#2E7D32" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card shadow-sm p-3">
                    <h5>Tension Artérielle</h5>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tensionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="tension" fill="#2E7D32" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card shadow-sm p-4">
                <h5>Historique des Mesures</h5>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Constante</th>
                        <th>Valeur</th>
                        <th>Unité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mesures.map((mesure) => (
                        <tr key={mesure.id}>
                          <td>{mesure.date}</td>
                          <td>{mesure.constante}</td>
                          <td>{mesure.valeur}</td>
                          <td>{mesure.unite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "traitements" && (
            <div>
              <h4 className="mb-4">Traitements en Cours</h4>
              
              {traitements.length === 0 ? (
                <div className="card shadow-sm p-5 text-center">
                  <p>Aucun traitement en cours.</p>
                </div>
              ) : (
                <div className="row">
                  {traitements.map((traitement) => (
                    <div key={traitement.id} className="col-md-6 mb-4">
                      <div className="card shadow-sm p-4">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5>{traitement.medicament}</h5>
                            <p className="text-muted">{traitement.dosage}</p>
                          </div>
                          <span className="badge bg-success">En cours</span>
                        </div>
                        <p><strong>Posologie:</strong> {traitement.posologie}</p>
                        <p><strong>Durée:</strong> {traitement.duree}</p>
                        <p><strong>Prescrit le:</strong> {traitement.date}</p>
                        <div className="d-flex justify-content-between mt-3">
                          <button className="btn btn-outline-success btn-sm">Rappel</button>
                          <button className="btn btn-outline-secondary btn-sm">Historique</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "documents" && (
            <div>
              <h4 className="mb-4">Documents Médicaux</h4>
              
              <div className="card shadow-sm p-4 mb-4">
                <h5>Télécharger un nouveau document</h5>
                <div className="input-group">
                  <input type="file" className="form-control" />
                  <button className="btn btn-outline-success">Uploader</button>
                </div>
              </div>
              
              {documents.length === 0 ? (
                <div className="card shadow-sm p-5 text-center">
                  <p>Aucun document médical enregistré.</p>
                </div>
              ) : (
                <div className="row">
                  {documents.map((document) => (
                    <div key={document.id} className="col-md-4 mb-4">
                      <div className="card shadow-sm p-3 text-center">
                        <div className="d-flex justify-content-center mb-3">
                          <div style={{ width: "60px", height: "60px", borderRadius: "10px", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {document.type === "pdf" ? (
                              <span style={{ fontSize: "24px", color: "#2E7D32" }}>PDF</span>
                            ) : (
                              <span style={{ fontSize: "24px", color: "#2E7D32" }}>IMG</span>
                            )}
                          </div>
                        </div>
                        <h6>{document.nom}</h6>
                        <p className="text-muted">{document.date}</p>
                        <button className="btn btn-success btn-sm">Télécharger</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DossierMedical;