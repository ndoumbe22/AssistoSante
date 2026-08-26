// src/pages/Medecin/DemarrerConsultationButton.jsx
import React from "react";
import axios from "axios";
import { FaVideo } from "react-icons/fa";

const DemarrerConsultationButton = ({ rdv }) => {
  const handleStartConsultation = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.warn("Aucun token dans localStorage");
        window.location.href = "/connecter"; // redirige vers la page de connexion
        return;
      }

      // Requête POST pour créer une réunion Zoom
      const res = await axios.post(
        `http://127.0.0.1:8000/api/create-meeting-for-rdv/${rdv.id || rdv.numero}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Vérification si la réunion Zoom a été créée
      if (res.data.error) {
        console.error("Erreur Zoom :", res.data.error);
        alert("Impossible de créer la réunion Zoom. Vérifiez les logs serveur.");
        return;
      }

      const { start_url, join_url } = res.data;

      if (start_url) {
        window.open(start_url, "_blank"); // ouvre Zoom pour l'hôte
      } else {
        alert("Le lien de la reunion vous sera envoyé veuiller patienter.");
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la téléconsultation :", error);
      alert("Erreur lors du chargement de la téléconsultation.");
    }
  };

  return (
    <button
      className="btn btn-primary btn-sm"
      onClick={handleStartConsultation}
    >
      <FaVideo className="me-2" /> Démarrer Téléconsultation
    </button>
  );
};

export default DemarrerConsultationButton;
