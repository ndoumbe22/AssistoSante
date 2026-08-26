import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doctorAPI } from "../../services/api";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave, FaEdit, FaStethoscope, FaBuilding } from "react-icons/fa";
import DoctorRatingsDisplay from "../../components/DoctorRatingsDisplay";

function Profile() {
  const { user } = useAuth();
  const [medecinData, setMedecinData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    specialite: "",
    numeroOrdre: "",
    hopital: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Charger les données du médecin
  useEffect(() => {
    const fetchMedecinData = async () => {
      try {
        setLoading(true);
        
        // Get doctor data from the API
        // First, we need to find the doctor ID for the current user
        const doctorsResponse = await doctorAPI.getDoctors();
        const currentDoctor = doctorsResponse.data.find(doc => doc.user.username === user.username);
        
        if (currentDoctor) {
          setMedecinData({
            nom: currentDoctor.user.last_name || "",
            prenom: currentDoctor.user.first_name || "",
            telephone: "", // These fields are not in the current API response
            email: currentDoctor.user.email || "",
            adresse: "", // These fields are not in the current API response
            specialite: currentDoctor.specialite || "",
            numeroOrdre: "", // These fields are not in the current API response
            hopital: "" // These fields are not in the current API response
          });
        } else {
          // Fallback to user data if doctor not found
          setMedecinData({
            nom: user.lastName || "",
            prenom: user.firstName || "",
            telephone: "",
            email: user.email || "",
            adresse: "",
            specialite: "Médecin",
            numeroOrdre: "",
            hopital: ""
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement du profil");
        setLoading(false);
        console.error("Erreur lors du chargement du profil :", err);
      }
    };

    if (user) {
      fetchMedecinData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMedecinData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // In a real application, this would send a request to the API
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      setSaving(false);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Erreur lors de la sauvegarde du profil");
      setSaving(false);
      console.error("Erreur lors de la sauvegarde du profil :", err);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Chargement...</div>;
  }

  if (error) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Profil Médecin</h2>
            {success && (
              <div className="alert alert-success py-2 px-3 mb-0">
                Profil mis à jour avec succès !
              </div>
            )}
          </div>
          
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Informations Professionnelles</h4>
                {!isEditing ? (
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit className="me-2" /> Modifier
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
            
            {/* Doctor Ratings Display */}
            <div className="card-body">
              <DoctorRatingsDisplay doctorId={1} />
            </div>
            
            <div className="card-body">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nom"
                        value={medecinData.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prénom</label>
                      <input
                        type="text"
                        className="form-control"
                        name="prenom"
                        value={medecinData.prenom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Téléphone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="telephone"
                        value={medecinData.telephone}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={medecinData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Spécialité</label>
                      <input
                        type="text"
                        className="form-control"
                        name="specialite"
                        value={medecinData.specialite}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Numéro d'Ordre</label>
                      <input
                        type="text"
                        className="form-control"
                        name="numeroOrdre"
                        value={medecinData.numeroOrdre}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Hôpital</label>
                      <input
                        type="text"
                        className="form-control"
                        name="hopital"
                        value={medecinData.hopital}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Adresse</label>
                      <textarea
                        className="form-control"
                        name="adresse"
                        value={medecinData.adresse}
                        onChange={handleInputChange}
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Enregistrer les modifications
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="row">
                  <div className="col-md-4 text-center mb-4">
                    <div className="d-flex justify-content-center mb-3">
                      <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#e9f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FaUser size={60} color="#2E7D32" />
                      </div>
                    </div>
                    <h4>Dr. {medecinData.prenom} {medecinData.nom}</h4>
                    <p className="text-muted">{medecinData.specialite}</p>
                  </div>
                  
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaPhone size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Téléphone</small>
                            <p className="mb-0">{medecinData.telephone || "Non renseigné"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaEnvelope size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Email</small>
                            <p className="mb-0">{medecinData.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaMapMarkerAlt size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Adresse</small>
                            <p className="mb-0">{medecinData.adresse || "Non renseignée"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaStethoscope size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Spécialité</small>
                            <p className="mb-0">{medecinData.specialite || "Non renseignée"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaUser size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Numéro d'Ordre</small>
                            <p className="mb-0">{medecinData.numeroOrdre || "Non renseigné"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="d-flex">
                          <div className="me-3 text-success">
                            <FaBuilding size={20} />
                          </div>
                          <div>
                            <small className="text-muted">Hôpital</small>
                            <p className="mb-0">{medecinData.hopital || "Non renseigné"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-white">
              <h4 className="mb-0">Sécurité du Compte</h4>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-0">Mot de passe</h6>
                  <p className="text-muted mb-0">Dernière mise à jour il y a 2 mois</p>
                </div>
                <button className="btn btn-outline-success">Changer le mot de passe</button>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Authentification à deux facteurs</h6>
                  <p className="text-muted mb-0">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
                </div>
              </div>
            </div>
          </div>
          
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-white">
              <h4 className="mb-0">Paramètres de Notification</h4>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
                <label className="form-check-label">Notifications par email</label>
              </div>
              
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" defaultChecked />
                <label className="form-check-label">Notifications par SMS</label>
              </div>
              
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" />
                <label className="form-check-label">Notifications push</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;