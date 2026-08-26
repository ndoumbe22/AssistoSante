import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ChatbotSettings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    welcome_message: "",
    fallback_message: "",
    placeholder_text: "",
    input_placeholder: "",
    primary_color: "#22c55e",
    confidence_threshold: 0.5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Charger la config depuis le backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://127.0.0.1:8000/api/chatbot/config/", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        setConfig(res.data);
      } catch (err) {
        console.error("Erreur chargement config :", err);
        setError("Impossible de charger la configuration.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem("token");
      await axios.put(
        "http://127.0.0.1:8000/api/chatbot/config/",
        config,
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      setSuccess("Configuration sauvegardée avec succès !");
    } catch (err) {
      console.error("Erreur sauvegarde config :", err);
      setError("Impossible de sauvegarder la configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement de la configuration...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramétrage du Chatbot</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <div className="space-y-4">
        {/* Message de bienvenue avec personnalisation */}
        <div>
          <label className="block font-medium mb-1">Message de bienvenue :</label>
          <input
            type="text"
            name="welcome_message"
            value={config.welcome_message}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Utilisez <code>{'{user}'}</code> pour insérer automatiquement le prénom de l'utilisateur connecté.
          </p>
        </div>

        <div>
          <label className="block font-medium mb-1">Message fallback :</label>
          <input
            type="text"
            name="fallback_message"
            value={config.fallback_message}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Placeholder recherche :</label>
          <input
            type="text"
            name="placeholder_text"
            value={config.placeholder_text}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Placeholder input :</label>
          <input
            type="text"
            name="input_placeholder"
            value={config.input_placeholder}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Couleur principale :</label>
          <input
            type="color"
            name="primary_color"
            value={config.primary_color}
            onChange={handleChange}
            className="w-16 h-10 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Seuil confiance (0 à 1) :</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            name="confidence_threshold"
            value={config.confidence_threshold}
            onChange={handleChange}
            className="w-24 border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaSave className="mr-2" /> {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          Retour
        </button>
      </div>
    </div>
  );
}

export default ChatbotSettings;
