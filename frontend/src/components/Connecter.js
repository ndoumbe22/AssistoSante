import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Connecter() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authAPI.login({
        username: formData.username,
        password: formData.password,
      });

      console.log("Login response:", res.data);

      if (!res.data || !res.data.access) {
        throw new Error("Réponse invalide du serveur");
      }

      // Check if user account is active
      if (!res.data.user.is_active) {
        throw new Error(
          "Ce compte est désactivé. Veuillez contacter l'administrateur."
        );
      }

      // Use the login function from AuthContext
      login(res.data.user, {
       access: res.data.access,
       refresh: res.data.refresh,
      });

      // ✅ Sauvegarde explicite du token dans le localStorage
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));


      // Vérifie si l'utilisateur vient du chatbot
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

     // Si l'utilisateur a cliqué sur le chatbot avant de se connecter
      if (redirect === "chatbot") {
         navigate("/chatbot"); // 🔹 Redirige vers le chatbot
      return;
      }

      // Sinon, on garde les redirections normales
      const role = res.data.user.role || "patient";
      if (role === "patient") {
        navigate("/interface_patient");
      } else if (role === "medecin") {
        navigate("/medecin/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error:", error);

      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";

      // Check if it's a network error
      if (!error.response && !error.request) {
        errorMessage = error.message;
      }
      // Handle API response errors
      else if (error.response) {
        const errorData = error.response.data;

        // Use the error message from the API if available
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (error.response.status === 401) {
          errorMessage = "Identifiants incorrects";
        } else if (error.response.status === 403) {
          errorMessage =
            "Ce compte est désactivé. Veuillez contacter l'administrateur.";
        } else if (error.response.status >= 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
        }
      }
      // Handle network errors
      else if (error.request) {
        errorMessage =
          "Impossible de contacter le serveur. Vérifiez votre connexion.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h2 className="auth-title">Connexion</h2>
          <p className="auth-subtitle">Accédez à votre espace santé</p>
        </div>

        {error && (
          <div className="alert alert-danger-custom" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-custom">
            <label htmlFor="username" className="form-label-custom">
              <i className="bi bi-person me-2"></i>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control-custom"
              placeholder="Entrez votre nom d'utilisateur"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="password" className="form-label-custom">
              <i className="bi bi-lock me-2"></i>
              Mot de passe
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-control-custom"
                placeholder="Entrez votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
              </button>
            </div>
          </div>

          <div className="form-options">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="rememberMe"
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Se souvenir de moi
              </label>
            </div>
            <Link to="/forgot-password" className="forgot-password-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-submit-custom"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Connexion en cours...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Commencer
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Vous n'avez pas de compte ?{" "}
            <Link to="/inscrire" className="auth-link">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>
    </div>
  );
}

export default Connecter;
