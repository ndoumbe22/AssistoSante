import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doctorAPI, specialtyAPI, userAPI, disponibiliteMedecinAPI, rendezVousAPI } from "../../services/api";
import { FaUserMd, FaCalendarAlt, FaClock, FaStethoscope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PriseDeRendezVous() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Spécialité, 2: Médecin, 3: Date, 4: Confirmation
  const [specialites, setSpecialites] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState("");
  const [selectedMedecin, setSelectedMedecin] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [nextSlots, setNextSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [motif, setMotif] = useState("");
  const [typeConsultation, setTypeConsultation] = useState("cabinet"); // Add this line
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/connecter");
    }
  }, [isAuthenticated, navigate]);

  // Charger les spécialités depuis l'API (using doctors data since pathologies endpoint is empty)
  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        setLoading(true);
        const response = await doctorAPI.getDoctors();
        console.log("Doctors API response:", response);
        
        // Add debugging logs to see the structure
        console.log('👨‍⚕️ MÉDECINS REÇUS POUR SPÉCIALITÉS:', response.data);
        if (response.data && response.data.length > 0) {
          console.log('👨‍⚕️ PREMIER MÉDECIN POUR SPÉCIALITÉS:', response.data[0]);
        }
        
        // Ensure we're working with an array from the results field
        let doctorsData = [];
        if (response && response.data && response.data.results) {
          doctorsData = Array.isArray(response.data.results) ? response.data.results : [];
        } else if (response && response.data) {
          // Fallback in case results field doesn't exist
          doctorsData = Array.isArray(response.data) ? response.data : [];
        }
        
        console.log("Doctors data extracted:", doctorsData);
        
        // Extract unique specialties from doctors
        const specialtiesSet = new Set();
        doctorsData.forEach(doctor => {
          const specialty = doctor.specialite || doctor.specialty || doctor.pathologie || "Spécialité non spécifiée";
          console.log("Doctor specialty:", specialty, "for doctor:", doctor);
          specialtiesSet.add(specialty);
        });
        const specialtiesArray = Array.from(specialtiesSet);
        console.log("Specialties array:", specialtiesArray);
        setSpecialites(specialtiesArray);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des spécialités: " + (err.response?.data?.detail || err.response?.data?.error || err.message));
        console.error("Erreur lors du chargement des spécialités :", err);
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSpecialites();
    }
  }, [isAuthenticated]);

  // Charger les médecins quand une spécialité est sélectionnée
  useEffect(() => {
    if (selectedSpecialite) {
      const fetchMedecins = async () => {
        try {
          setLoading(true);
          const response = await doctorAPI.getDoctors();
          
          // Add debugging logs to see the structure
          console.log('👨‍⚕️ MÉDECINS REÇUS:', response.data);
          if (response.data && response.data.length > 0) {
            console.log('👨‍⚕️ PREMIER MÉDECIN:', response.data[0]);
          }
          
          // Ensure we're working with an array from the results field
          let doctorsData = [];
          if (response && response.data && response.data.results) {
            doctorsData = Array.isArray(response.data.results) ? response.data.results : [];
          } else if (response && response.data) {
            // Fallback in case results field doesn't exist
            doctorsData = Array.isArray(response.data) ? response.data : [];
          }
          
          // Filter doctors by selected specialty (case insensitive)
          const filteredDoctors = doctorsData.filter(doctor => {
            // Check multiple possible field names for specialty
            const doctorSpecialty = doctor.specialite || doctor.specialty || doctor.pathologie || "";
            return doctorSpecialty && 
                   doctorSpecialty.toLowerCase().includes(selectedSpecialite.toLowerCase());
          });
          
          setMedecins(filteredDoctors);
          setLoading(false);
        } catch (err) {
          setError("Erreur lors du chargement des médecins: " + (err.response?.data?.detail || err.response?.data?.error || err.message));
          setLoading(false);
          console.error("Erreur lors du chargement des médecins :", err);
        }
      };

      fetchMedecins();
    }
  }, [selectedSpecialite]);

  // Charger les disponibilités quand un médecin est sélectionné
  useEffect(() => {
    if (selectedMedecin && selectedDate) {
      const fetchAvailableSlots = async (medecinId, date) => {
        try {
          setLoading(true);
          console.log('🔄 Récupération créneaux...', {medecinId, date});
          
          // Formater la date en YYYY-MM-DD
          const dateFormatted = date instanceof Date 
            ? date.toISOString().split('T')[0]
            : date;
          
          const response = await rendezVousAPI.creneauxDisponibles(medecinId, dateFormatted);
          
          console.log('✅ Créneaux reçus:', response);
          
          if (response && Array.isArray(response.slots)) {
            setAvailableSlots(response.slots);
            console.log(`✅ ${response.slots.length} créneaux chargés`);
          } else {
            console.error('❌ Format de réponse invalide:', response);
            setAvailableSlots([]);
          }
          
        } catch (error) {
          console.error('❌ Erreur récupération créneaux:', error);
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      };

      // Fix: Check if selectedMedecin has user property before accessing it
      if (selectedMedecin.user && selectedMedecin.user.id) {
        fetchAvailableSlots(selectedMedecin.user.id, selectedDate);
      } else if (selectedMedecin.id) {
        // Fallback to medecin.id if user is not available
        fetchAvailableSlots(selectedMedecin.id, selectedDate);
      }
    }
  }, [selectedMedecin, selectedDate]);
  
  // Charger les prochains créneaux disponibles
  const fetchNextSlots = async () => {
    if (selectedMedecin) {
      try {
        setLoading(true);
        // Fix: Check if selectedMedecin has user property before accessing it
        const medecinId = selectedMedecin.user?.id || selectedMedecin.id;
        const response = await disponibiliteMedecinAPI.getProchainsCreneaux(medecinId, 5);
        
        if (response && response.data && response.data.creneaux) {
          setNextSlots(response.data.creneaux);
        } else {
          setNextSlots([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des prochains créneaux:", err);
        // More detailed error handling
        let errorMessage = "Erreur lors du chargement des prochains créneaux";
        if (err.response) {
          if (err.response.data && err.response.data.error) {
            errorMessage += ": " + err.response.data.error;
          } else if (err.response.data && err.response.data.message) {
            errorMessage += ": " + err.response.data.message;
          } else if (err.response.status === 404) {
            errorMessage += ": Médecin non trouvé";
          } else if (err.response.status === 400) {
            errorMessage += ": Données invalides";
          }
        } else if (err.request) {
          errorMessage += ": Problème de connexion au serveur";
        } else {
          errorMessage += ": " + err.message;
        }
        setError(errorMessage);
        setNextSlots([]);
        setLoading(false);
      }
    }
  };
  
  // Charger les prochains créneaux quand un médecin est sélectionné
  useEffect(() => {
    if (selectedMedecin) {
      fetchNextSlots();
    }
  }, [selectedMedecin]);

  const handleSpecialiteSelect = (specialite) => {
    console.log("Specialty selected:", specialite);
    setSelectedSpecialite(specialite);
    setStep(2);
  };

  const handleMedecinSelect = (medecin) => {
    console.log('👨‍⚕️ Médecin sélectionné:', medecin);
    console.log('- ID:', medecin.id);
    console.log('- User ID:', medecin.user?.id);
    console.log('- Nom:', medecin.user?.first_name, medecin.user?.last_name);
    
    setSelectedMedecin(medecin);
    setStep(3);
  };

  const handleDateChange = (date) => {
    // Vérifier que la date n'est pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    // Additional validation to ensure date is not in the past
    if (selectedDateObj < today) {
      setError('Veuillez sélectionner une date future');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setSelectedDate(date);
    setError(null);
  };

  const handleSlotSelect = (heure) => {
    console.log('🕐 CLIC SUR CRÉNEAU:', heure);
    setSelectedSlot(heure);
    console.log('✅ selectedSlot mis à jour:', heure);
  };

  const handleConfirm = async () => {
    console.log('=== 📤 DÉBUT CRÉATION RENDEZ-VOUS ===');
    
    // Validation
    if (!selectedMedecin || !selectedDate || !selectedSlot || !motif) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      // Récupérer le user_id du médecin (cohérent avec creneaux_disponibles)
      const medecinUserId = selectedMedecin.user?.id || selectedMedecin.user_id || selectedMedecin.id;
      
      console.log('🔍 DEBUG:');
      console.log('  - selectedMedecin:', selectedMedecin);
      console.log('  - medecinUserId calculé:', medecinUserId);
      
      if (!medecinUserId) {
        alert('ERREUR: Impossible de récupérer l\'ID du médecin');
        console.error('❌ selectedMedecin:', selectedMedecin);
        return;
      }

      // Formatter les données
      const dateFormatted = selectedDate.toISOString().split('T')[0];
      const heureFormatted = selectedSlot.substring(0, 5);

      const appointmentData = {
        medecin_id: medecinUserId,  // ✅ user_id du médecin
        date: dateFormatted,        // ✅ date au lieu de date_rdv
        heure: heureFormatted,      // ✅ HH:MM
        motif_consultation: motif,
        type_consultation: typeConsultation || 'cabinet'
      };

      console.log('📤 PAYLOAD FINAL:', appointmentData);

      const response = await rendezVousAPI.creer(appointmentData);
      
      console.log('✅ SUCCÈS:', response);
      alert('Rendez-vous créé avec succès !');
      navigate('/patient/rendez-vous');
      
    } catch (error) {
      console.error('❌ ERREUR:', error);
      console.error('❌ Response data:', error.response?.data);
      
      if (error.response?.data) {
        const errors = error.response.data;
        let errorMsg = 'Erreur :\n';
        Object.keys(errors).forEach(key => {
          errorMsg += `${key}: ${errors[key]}\n`;
        });
        alert(errorMsg);
      } else {
        alert('Erreur lors de la création du rendez-vous');
      }
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedSpecialite("");
    setSelectedMedecin(null);
    setSelectedDate(new Date());
    setSelectedSlot("");
    setMotif("");
    setSuccess(false);
  };

  // Show login message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg rounded-3">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
                    <FaUserMd size={40} className="text-primary" />
                  </div>
                </div>
                <h2 className="mb-3">🔐 Authentification requise</h2>
                <p className="mb-4 text-muted">Vous devez être connecté pour prendre un rendez-vous.</p>
                <Link to="/connecter" className="btn btn-primary btn-lg px-4 py-2">
                  Commencer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render success message if we're redirecting
  if (success) {
    // Redirect immediately without showing success message
    return null;
  }

  // Helper function to safely get doctor name
  const getDoctorName = (medecin) => {
    if (!medecin) return "Médecin";
    
    // Check if medecin has user property with first_name and last_name
    if (medecin.user && medecin.user.first_name && medecin.user.last_name) {
      return `Dr. ${medecin.user.first_name} ${medecin.user.last_name}`;
    }
    
    // Fallback to direct properties
    if (medecin.first_name && medecin.last_name) {
      return `Dr. ${medecin.first_name} ${medecin.last_name}`;
    }
    
    // Fallback to just first name
    if (medecin.user && medecin.user.first_name) {
      return `Dr. ${medecin.user.first_name}`;
    }
    
    if (medecin.first_name) {
      return `Dr. ${medecin.first_name}`;
    }
    
    // Last resort
    return "Dr. Médecin";
  };

  // Helper function to safely get doctor specialty
  const getDoctorSpecialty = (medecin) => {
    if (!medecin) return "Spécialité non spécifiée";
    return medecin.specialite || medecin.specialty || medecin.pathologie || "Spécialité non spécifiée";
  };

  // Helper function to safely get doctor photo
  const getDoctorPhoto = (medecin) => {
    if (!medecin) return null;
    return medecin.photo || medecin.user?.photo || null;
  };

  // Helper function to safely get doctor rating
  const getDoctorRating = (medecin) => {
    if (!medecin) return 5;
    return medecin.note || 5;
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-4">
            <Link to="/patient/rendez-vous" className="btn btn-outline-secondary me-3">
              <FaArrowLeft className="me-2" /> Retour
            </Link>
            <div>
              <h1 className="mb-0">Prendre un rendez-vous</h1>
              <p className="text-muted mb-0">Suivez les étapes pour programmer votre consultation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between position-relative">
                {/* Progress line */}
                <div className="position-absolute top-50 start-0 end-0 translate-middle-y" style={{ height: "4px", backgroundColor: "#e9ecef", zIndex: 1 }}></div>
                <div 
                  className="position-absolute top-50 start-0 translate-middle-y" 
                  style={{ 
                    height: "4px", 
                    backgroundColor: "#28a745", 
                    zIndex: 2, 
                    width: `${(step - 1) * 33.33}%`,
                    transition: "width 0.3s ease"
                  }}
                ></div>
                
                {/* Steps */}
                {[1, 2, 3, 4].map((stepNum) => (
                  <div key={stepNum} className="position-relative" style={{ zIndex: 3 }}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= stepNum ? 'bg-success text-white' : 'bg-light text-muted'}`} 
                         style={{ width: "40px", height: "40px", border: step >= stepNum ? "2px solid #28a745" : "2px solid #dee2e6" }}>
                      {stepNum}
                    </div>
                    <div className="text-center mt-2">
                      <small className={step === stepNum ? "fw-bold text-success" : "text-muted"}>
                        {stepNum === 1 && "Spécialité"}
                        {stepNum === 2 && "Médecin"}
                        {stepNum === 3 && "Date & Heure"}
                        {stepNum === 4 && "Confirmation"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show rounded-3 shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on step */}
      <div className="row">
        <div className="col-12">
          {step === 1 && (
            <div className="card border-0 shadow-lg rounded-3">
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "70px", height: "70px" }}>
                    <FaStethoscope size={35} className="text-primary" />
                  </div>
                  <h2 className="mb-2">Sélectionnez une spécialité</h2>
                  <p className="text-muted">Choisissez la spécialité médicale qui correspond à vos besoins</p>
                </div>
                
                {specialites.length > 0 ? (
                  <div className="row g-4">
                    {specialites.map((specialite, index) => (
                      <div key={index} className="col-md-6 col-lg-3">
                        <div 
                          className="card border-0 shadow-sm h-100 rounded-3 cursor-pointer hover-lift"
                          style={{ transition: "all 0.3s ease", cursor: "pointer" }}
                          onClick={() => handleSpecialiteSelect(specialite)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSpecialiteSelect(specialite);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Sélectionner la spécialité ${specialite}`}
                        >
                          <div className="card-body text-center p-4">
                            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: "60px", height: "60px" }}>
                              <FaStethoscope size={25} className="text-primary" />
                            </div>
                            <h5 className="card-title mb-0">{specialite}</h5>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info rounded-3">
                    <div className="text-center">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      {loading ? (
                        <span>Chargement des spécialités...</span>
                      ) : (
                        <>
                          <span>Aucune spécialité disponible pour le moment.</span>
                          <p className="mb-0 mt-2">Veuillez contacter l'administrateur pour ajouter des spécialités.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card border-0 shadow-lg rounded-3">
              <div className="card-body p-5">
                <div className="d-flex align-items-center mb-4">
                  <button className="btn btn-outline-secondary me-3 rounded-circle" onClick={() => setStep(1)}>
                    <FaArrowLeft />
                  </button>
                  <div>
                    <h2 className="mb-0">Médecins en {selectedSpecialite}</h2>
                    <p className="text-muted mb-0">Sélectionnez le médecin avec lequel vous souhaitez prendre rendez-vous</p>
                  </div>
                </div>
                
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row g-4">
                    {medecins.length > 0 ? (
                      medecins.map((medecin) => (
                        <div key={medecin.id} className="col-md-6 col-lg-4">
                          <div 
                            className="card border-0 shadow-sm h-100 rounded-3 cursor-pointer hover-lift"
                            style={{ transition: "all 0.3s ease" }}
                            onClick={() => handleMedecinSelect(medecin)}
                          >
                            <div className="card-body text-center p-4">
                              <div className="mb-3">
                                {getDoctorPhoto(medecin) ? (
                                  <img src={getDoctorPhoto(medecin)} alt={getDoctorName(medecin)} 
                                       className="rounded-circle" style={{ width: "90px", height: "90px", objectFit: "cover" }} />
                                ) : (
                                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" 
                                       style={{ width: "90px", height: "90px" }}>
                                    <FaUserMd size={45} className="text-primary" />
                                  </div>
                                )}
                              </div>
                              <h5 className="card-title mb-1">{getDoctorName(medecin)}</h5>
                              <p className="text-muted mb-2">({getDoctorSpecialty(medecin)})</p>
                              <div className="d-flex justify-content-center align-items-center mb-3">
                                <span className="badge bg-success me-2">{getDoctorRating(medecin)}</span>
                                <div className="text-warning">
                                  {'★'.repeat(Math.floor(getDoctorRating(medecin)))}
                                  {'☆'.repeat(5 - Math.floor(getDoctorRating(medecin)))}
                                </div>
                              </div>
                              <button className="btn btn-primary w-100 rounded-pill">
                                Choisir ce médecin
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12">
                        <div className="alert alert-info rounded-3">
                          <div className="text-center">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            <span>Aucun médecin disponible pour cette spécialité pour le moment.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card border-0 shadow-lg rounded-3">
              <div className="card-body p-5">
                <div className="d-flex align-items-center mb-4">
                  <button className="btn btn-outline-secondary me-3 rounded-circle" onClick={() => setStep(2)}>
                    <FaArrowLeft />
                  </button>
                  <div>
                    <h2 className="mb-0">Disponibilités de {selectedMedecin ? getDoctorName(selectedMedecin) : "Médecin"}</h2>
                    <p className="text-muted mb-0">Sélectionnez une date et un créneau horaire pour votre rendez-vous</p>
                  </div>
                </div>
                
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-body p-4">
                        <h4 className="mb-4">
                          <FaCalendarAlt className="me-2 text-primary" />
                          Sélectionnez une date
                        </h4>
                        <div className="calendar-container">
                          <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            className="border-0 w-100"
                            minDate={new Date()} // This blocks past dates
                            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
                            navigationAriaLabel="Navigation du calendrier"
                            navigationLabel={({ date }) => 
                              date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                            }
                            tileClassName={({ date, view }) => {
                              // Highlight today
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const selectedDateObj = new Date(date);
                              selectedDateObj.setHours(0, 0, 0, 0);
                              
                              if (selectedDateObj.getTime() === today.getTime()) {
                                return 'react-calendar__tile--today';
                              }
                              return null;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-body p-4">
                        <h4 className="mb-4">
                          <FaClock className="me-2 text-primary" />
                          Sélectionnez un créneau
                        </h4>
                        
                        <div className="mb-4">
                          <h6 className="mb-3">Créneaux disponibles pour le {selectedDate ? selectedDate.toLocaleDateString('fr-FR') : 'Date non sélectionnée'}</h6>
                          
                          {loading ? (
                            <div className="text-center py-3">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Chargement des disponibilités...</span>
                              </div>
                              <p className="mt-2">Chargement des disponibilités...</p>
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <div className="alert alert-info">
                              <p className="mb-2">Aucun créneau disponible ce jour. {selectedMedecin ? getDoctorName(selectedMedecin) : "Le médecin"} ne consulte pas ou tous les créneaux sont réservés.</p>
                              
                              {nextSlots.length > 0 && (
                                <>
                                  <h6 className="mt-3">Prochaines disponibilités :</h6>
                                  <div className="d-flex flex-wrap gap-2">
                                    {nextSlots.map((creneau, index) => (
                                      <button
                                        key={index}
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => {
                                          // Convert date string to Date object and set it
                                          const dateObj = new Date(creneau.date);
                                          setSelectedDate(dateObj);
                                          // The useEffect will automatically trigger and load available slots
                                        }}
                                      >
                                        {new Date(creneau.date).toLocaleDateString('fr-FR')} à {creneau.heure}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="row g-2">
                              {availableSlots.map((slot, index) => (
                                <div key={index} className="col-4">
                                  <button
                                    className={`btn w-100 rounded-pill slot-button ${
                                      slot.disponible 
                                        ? (selectedSlot === slot.heure ? 'btn-primary' : 'btn-outline-secondary') 
                                        : 'unavailable'
                                    }`}
                                    onClick={() => {
                                      if (slot.disponible) {
                                        console.log('🖱️ Bouton cliqué - heure:', slot.heure);
                                        handleSlotSelect(slot.heure);
                                      }
                                    }}
                                    disabled={!slot.disponible}
                                    title={slot.disponible ? '' : slot.motif_indisponibilite}
                                  >
                                    {slot.heure}
                                    {!slot.disponible && (
                                      <span className="badge bg-dark ms-1">
                                        <small>❌</small>
                                      </span>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {selectedSlot && (
                          <div className="alert alert-success mt-3">
                            Créneau sélectionné : {selectedSlot}
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <label className="form-label">Motif de la consultation</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Décrivez brièvement le motif de votre consultation..."
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <button
                          className="btn btn-primary w-100 mt-4 rounded-pill py-2"
                          onClick={() => {
                            console.log('🚀 VÉRIFICATION AVANT CONTINUER:', {
                              selectedSlot,
                              motif,
                              selectedDate
                            });
                            
                            if (!selectedSlot) {
                              alert("Veuillez sélectionner un créneau horaire");
                              return;
                            }
                            
                            if (!motif || motif.trim() === "") {
                              alert("Veuillez remplir le motif de consultation");
                              return;
                            }
                            
                            console.log('🚀 DONNÉES ENVOYÉES:', {
                              date: selectedDate,
                              slot: selectedSlot,
                              medecin: selectedMedecin?.id,
                              motif: motif
                            });
                            
                            setStep(4);
                          }}
                        >
                          Continuer vers la confirmation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card border-0 shadow-lg rounded-3">
              <div className="card-body p-5">
                <div className="d-flex align-items-center mb-4">
                  <button className="btn btn-outline-secondary me-3 rounded-circle" onClick={() => setStep(3)}>
                    <FaArrowLeft />
                  </button>
                  <div>
                    <h2 className="mb-0">Confirmer votre rendez-vous</h2>
                    <p className="text-muted mb-0">Vérifiez les détails de votre rendez-vous avant de confirmer</p>
                  </div>
                </div>
                
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-body p-4">
                        <h4 className="mb-4 pb-2 border-bottom">Détails du rendez-vous</h4>
                        
                        <div className="d-flex mb-4">
                          <div className="me-3">
                            {selectedMedecin && getDoctorPhoto(selectedMedecin) ? (
                              <img src={getDoctorPhoto(selectedMedecin)} alt={getDoctorName(selectedMedecin)} 
                                   className="rounded-circle" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                            ) : (
                              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                                   style={{ width: "60px", height: "60px" }}>
                                <FaUserMd size={30} className="text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="mb-0">{selectedMedecin ? getDoctorName(selectedMedecin) : "Médecin"}</h5>
                            <p className="text-muted mb-0">{selectedMedecin ? getDoctorSpecialty(selectedMedecin) : "Spécialité non spécifiée"}</p>
                          </div>
                        </div>
                        
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="d-flex">
                              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center me-3" 
                                   style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                                <FaCalendarAlt className="text-primary" />
                              </div>
                              <div>
                                <small className="text-muted">Date</small>
                                <p className="mb-0 fw-medium">{selectedDate ? selectedDate.toLocaleDateString('fr-FR') : 'Date non sélectionnée'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-12">
                            <div className="d-flex">
                              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center me-3" 
                                   style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                                <FaClock className="text-primary" />
                              </div>
                              <div>
                                <small className="text-muted">Heure</small>
                                <p className="mb-0 fw-medium">{selectedSlot}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-12">
                            <div className="d-flex">
                              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center me-3" 
                                   style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                                <i className="bi bi-chat-text text-primary"></i>
                              </div>
                              <div>
                                <small className="text-muted">Motif</small>
                                <p className="mb-0 fw-medium">{motif || "Non spécifié"}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Add consultation type display */}
                          <div className="col-12">
                            <div className="d-flex">
                              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center me-3" 
                                   style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                                <i className={`bi ${typeConsultation === 'teleconsultation' ? 'bi-camera-video' : 'bi-building'} text-primary`}></i>
                              </div>
                              <div>
                                <small className="text-muted">Type de consultation</small>
                                <p className="mb-0 fw-medium">
                                  {typeConsultation === 'teleconsultation' ? '📹 Téléconsultation en ligne' : '🏥 Consultation au cabinet'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-body p-4">
                        <h4 className="mb-4 pb-2 border-bottom">Informations importantes</h4>
                        
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item px-0 py-3 border-0">
                            <div className="d-flex">
                              <div className="text-success me-3">
                                <i className="bi bi-check-circle-fill"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">Arrivée</h6>
                                <p className="mb-0 text-muted">Veuillez arriver 15 minutes avant votre rendez-vous</p>
                              </div>
                            </div>
                          </li>
                          
                          <li className="list-group-item px-0 py-3 border-0">
                            <div className="d-flex">
                              <div className="text-primary me-3">
                                <i className="bi bi-card-text"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">Documents à apporter</h6>
                                <p className="mb-0 text-muted">Apportez votre carte d'identité et votre carte vitale</p>
                              </div>
                            </div>
                          </li>
                          
                          <li className="list-group-item px-0 py-3 border-0">
                            <div className="d-flex">
                              <div className="text-warning me-3">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">Annulation</h6>
                                <p className="mb-0 text-muted">En cas d'empêchement, veuillez annuler au moins 24h à l'avance</p>
                              </div>
                            </div>
                          </li>
                        </ul>
                        
                        <div className="mt-4">
                          <button
                            className="btn btn-primary w-100 rounded-pill py-2 mb-2"
                            onClick={handleConfirm}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Confirmation en cours...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="me-2" />
                                Confirmer le rendez-vous
                              </>
                            )}
                          </button>
                          
                          <button
                            className="btn btn-outline-secondary w-100 rounded-pill py-2"
                            onClick={() => setStep(3)}
                          >
                            Modifier les informations
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Styles */}
      <style>{`
        .hover-lift {
          cursor: pointer;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .react-calendar {
          border: none !important;
          width: 100% !important;
        }
        
        .react-calendar__tile--today {
          background: #e9f5e9 !important;
          font-weight: bold !important;
        }
        
        .react-calendar__tile--active {
          background: #28a745 !important;
          color: white !important;
        }
        
        .react-calendar__tile--active:hover {
          background: #218838 !important;
        }
        
        .calendar-container {
          border-radius: 10px;
          overflow: hidden;
        }
        
        @media (max-width: 768px) {
          .card-body {
            padding: 1.5rem !important;
          }
          
          h1, h2 {
            font-size: 1.5rem !important;
          }
          
          .react-calendar {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PriseDeRendezVous;