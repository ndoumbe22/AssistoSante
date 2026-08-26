import React, { useState, useEffect } from "react";
import urgenceService from "../../services/urgenceService";

function UrgencesDashboard() {
  const [urgences, setUrgences] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("en_attente");

  useEffect(() => {
    loadData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filterStatut]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [urgencesData, notifData] = await Promise.all([
        urgenceService.getUrgencesMedecin({ statut: filterStatut }),
        urgenceService.getNotifications(),
      ]);
      setUrgences(urgencesData);
      setNotifications(notifData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrendreEnCharge = async (id, titre) => {
    if (window.confirm(`Prendre en charge l'urgence "${titre}" ?`)) {
      try {
        await urgenceService.prendreEnCharge(id);
        alert("✅ Urgence prise en charge");
        loadData();
      } catch (error) {
        console.error("Erreur:", error);
        alert(error.response?.data?.error || "Erreur");
      }
    }
  };

  const handleResoudre = async (id, titre) => {
    const notes = prompt(`Notes de résolution pour "${titre}" :`);
    if (notes !== null) {
      try {
        await urgenceService.resoudreUrgence(id, notes);
        alert("✅ Urgence résolue");
        loadData();
      } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur");
      }
    }
  };

  const getPrioriteBadgeClass = (priorite) => {
    switch (priorite) {
      case "critique":
        return "danger";
      case "elevee":
        return "warning";
      case "moyenne":
        return "info";
      case "faible":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeClass = (statut) => {
    switch (statut) {
      case "en_attente":
        return "warning";
      case "prise_en_charge":
        return "primary";
      case "resolue":
        return "success";
      case "annulee":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const notificationsNonLues = notifications.filter((n) => !n.lue).length;

  if (loading)
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🚨 Urgences Médicales</h2>
        <div>
          {notificationsNonLues > 0 && (
            <span className="badge bg-danger me-2" style={{ fontSize: "1rem" }}>
              {notificationsNonLues} nouvelle(s) notification(s)
            </span>
          )}
          <button className="btn btn-primary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise"></i> Rafraîchir
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="btn-group mb-4" role="group">
        <button
          className={`btn btn-outline-primary ${
            filterStatut === "en_attente" ? "active" : ""
          }`}
          onClick={() => setFilterStatut("en_attente")}
        >
          En attente
        </button>
        <button
          className={`btn btn-outline-primary ${
            filterStatut === "mes_prises_en_charge" ? "active" : ""
          }`}
          onClick={() => setFilterStatut("mes_prises_en_charge")}
        >
          Mes prises en charge
        </button>
        <button
          className={`btn btn-outline-primary ${
            filterStatut === "resolue" ? "active" : ""
          }`}
          onClick={() => setFilterStatut("resolue")}
        >
          Résolues
        </button>
      </div>

      {/* Liste */}
      {urgences.length === 0 ? (
        <div className="alert alert-info">
          Aucune urgence dans cette catégorie
        </div>
      ) : (
        <div className="row">
          {urgences.map((urgence) => (
            <div key={urgence.id} className="col-lg-6 mb-3">
              <div
                className={`card border-${getPrioriteBadgeClass(
                  urgence.priorite
                )}`}
              >
                <div className="card-header d-flex justify-content-between align-items-center">
                  <strong>{urgence.type_urgence}</strong>
                  <div>
                    <span
                      className={`badge bg-${getPrioriteBadgeClass(
                        urgence.priorite
                      )} me-2`}
                    >
                      {urgence.priorite}
                    </span>
                    <span className="badge bg-secondary">
                      Score: {urgence.score_urgence}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Patient :</strong> {urgence.patient_nom}
                  </p>
                  <p>
                    <strong>Symptômes :</strong> {urgence.symptomes}
                  </p>
                  <p>
                    <strong>Description :</strong> {urgence.description}
                  </p>
                  <p>
                    <strong>Contact :</strong> {urgence.telephone_contact}
                  </p>
                  <p>
                    <strong>Statut :</strong>
                    <span
                      className={`badge bg-${getStatusBadgeClass(
                        urgence.statut
                      )} ms-2`}
                    >
                      {urgence.statut}
                    </span>
                  </p>
                  <small className="text-muted">
                    <i className="bi bi-clock"></i> Signalée il y a{" "}
                    {urgence.temps_ecoule}
                  </small>
                </div>
                <div className="card-footer">
                  {urgence.statut === "en_attente" && (
                    <button
                      className="btn btn-success w-100"
                      onClick={() =>
                        handlePrendreEnCharge(urgence.id, urgence.type_urgence)
                      }
                    >
                      <i className="bi bi-hand-thumbs-up"></i> Prendre en charge
                    </button>
                  )}
                  {urgence.statut === "prise_en_charge" && (
                    <button
                      className="btn btn-primary w-100"
                      onClick={() =>
                        handleResoudre(urgence.id, urgence.type_urgence)
                      }
                    >
                      <i className="bi bi-check-circle"></i> Marquer comme
                      résolue
                    </button>
                  )}
                  {urgence.statut === "resolue" && (
                    <div className="alert alert-success mb-0">
                      ✅ Résolue par {urgence.medecin_nom}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UrgencesDashboard;
