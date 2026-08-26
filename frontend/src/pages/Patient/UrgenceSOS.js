import React, { useState, useEffect } from "react";
import urgenceService from "../../services/urgenceService";

function UrgenceSOS() {
  const [showForm, setShowForm] = useState(false);
  const [urgences, setUrgences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_urgence: "",
    description: "",
    symptomes: "",
    telephone_contact: "",
    personne_contact: "",
    latitude: null,
    longitude: null,
    adresse: "",
  });

  useEffect(() => {
    loadUrgences();
  }, []);

  const loadUrgences = async () => {
    try {
      const data = await urgenceService.getMyUrgences();
      setUrgences(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSOSClick = () => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Erreur de géolocalisation:", error);
        }
      );
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.type_urgence ||
      !formData.description ||
      !formData.telephone_contact
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      await urgenceService.createUrgence(formData);
      alert("🚨 Urgence signalée ! Les médecins ont été notifiés.");
      setShowForm(false);
      setFormData({
        type_urgence: "",
        description: "",
        symptomes: "",
        telephone_contact: "",
        personne_contact: "",
        latitude: null,
        longitude: null,
        adresse: "",
      });
      loadUrgences();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du signalement");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (statut) => {
    switch (statut) {
      case "en_attente":
        return "bg-warning";
      case "prise_en_charge":
        return "bg-primary";
      case "resolue":
        return "bg-success";
      case "annulee":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getPrioriteBadgeClass = (priorite) => {
    switch (priorite) {
      case "critique":
        return "bg-danger";
      case "elevee":
        return "bg-warning text-dark";
      case "moyenne":
        return "bg-info";
      case "faible":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="container py-4">
      {!showForm ? (
        <div className="text-center">
          <div className="alert alert-warning">
            <h4>⚠️ EN CAS D'URGENCE VITALE</h4>
            <p>
              Composez immédiatement le <strong>15 (SAMU)</strong>
            </p>
          </div>

          <button
            className="btn btn-danger btn-lg"
            onClick={handleSOSClick}
            style={{ fontSize: "2rem", padding: "30px 60px" }}
          >
            🚨 SOS - URGENCE MÉDICALE
          </button>

          <p className="mt-3 text-muted">
            Pour les urgences non vitales nécessitant une consultation rapide
          </p>

          {/* Historique */}
          <div className="mt-5">
            <h4>Mes urgences</h4>
            {urgences.length === 0 ? (
              <p className="text-muted">Aucune urgence signalée</p>
            ) : (
              <div className="list-group">
                {urgences.map((u) => (
                  <div key={u.id} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <strong>{u.type_urgence}</strong>
                      <span
                        className={`badge ${getPrioriteBadgeClass(
                          u.priorite
                        )} me-2`}
                      >
                        {u.priorite}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">
                        {new Date(u.date_creation).toLocaleString("fr-FR")}
                      </small>
                      <span
                        className={`badge ${getStatusBadgeClass(u.statut)}`}
                      >
                        {u.statut}
                      </span>
                    </div>
                    {u.medecin_nom && (
                      <div>
                        <strong>Médecin:</strong> {u.medecin_nom}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card">
              <div className="card-header bg-danger text-white">
                <h4 className="mb-0">🚨 Signaler une urgence</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Type d'urgence *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.type_urgence}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type_urgence: e.target.value,
                        })
                      }
                      placeholder="Ex: Douleur abdominale intense"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Description détaillée *
                    </label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows="4"
                      placeholder="Décrivez votre situation en détail..."
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Symptômes *</label>
                    <textarea
                      className="form-control"
                      value={formData.symptomes}
                      onChange={(e) =>
                        setFormData({ ...formData, symptomes: e.target.value })
                      }
                      rows="3"
                      placeholder="Listez vos symptômes..."
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Téléphone de contact *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.telephone_contact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          telephone_contact: e.target.value,
                        })
                      }
                      placeholder="+221 XX XXX XX XX"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Personne à contacter (optionnel)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.personne_contact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personne_contact: e.target.value,
                        })
                      }
                      placeholder="Nom d'un proche"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Adresse (optionnel)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      placeholder="Votre adresse actuelle"
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Envoi...
                        </>
                      ) : (
                        "🚨 Envoyer l'urgence"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UrgenceSOS;
