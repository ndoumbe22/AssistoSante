import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";
import Chatbot from "./Chatbot";

function Layout() {
  const { user, logout, loading, isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".navbar, .mobile-menu")) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* 🔹 Header */}
      <header
        className={`navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <div className="container-fluid px-4">
          {/* 🔸 Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src="/images/logo.png"
              alt="Logo"
              width="60"
              height="40"
              className="me-2"
            />
            <span className="fw-bold text-success">AssitoSanté</span>
          </Link>

          {/* 🔸 Mobile menu button */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* 🔸 Desktop Navigation */}
          <div className="d-none d-lg-flex align-items-center">
            <nav className="navbar-nav me-auto">
              <Link className="nav-link" to="/">
                Accueil
              </Link>
              <Link className="nav-link" to="/medecins">
                Médecin
              </Link>
              <Link className="nav-link" to="/articles">
                Articles
              </Link>
              <Link className="nav-link" to="/pharmacie">
                Pharmacies
              </Link>
              <Link className="nav-link" to="/hopitaux">
                Hôpitaux
              </Link>
              <Link className="nav-link" to="/dentistes">
                Dentistes
              </Link>
              <Link className="nav-link" to="/cliniques">
                Cliniques
              </Link>
              <Link className="nav-link" to="/qui_sommes_nous">
                Qui sommes-nous ?
              </Link>
            </nav>

            <div className="d-flex align-items-center">
              {user ? (
                <>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-success dropdown-toggle d-flex align-items-center"
                      type="button"
                      id="userDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      {user.first_name}
                    </button>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      aria-labelledby="userDropdown"
                    >
                      <li>
                        <Link className="dropdown-item" to="/profil">
                          <i className="bi bi-person me-2"></i>Mon Profil
                        </Link>
                      </li>
                      {user.role === "patient" && (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/patient">
                              <i className="bi bi-speedometer2 me-2"></i>
                              Tableau de bord
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/patient/rendez-vous"
                            >
                              <i className="bi bi-calendar-check me-2"></i>
                              Mes Rendez-vous
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/patient/dossier-medical"
                            >
                              <i className="bi bi-file-medical me-2"></i>
                              Dossier Médical
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/patient/consultations"
                            >
                              <i className="bi bi-camera-video me-2"></i>
                              Consultations
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/patient/medication-reminders"
                            >
                              <i className="bi bi-alarm me-2"></i>
                              Rappels Médicaments
                            </Link>
                          </li>
                        </>
                      )}
                      {user.role === "medecin" && (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/medecin">
                              <i className="bi bi-speedometer2 me-2"></i>
                              Tableau de bord
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/medecin/rendez-vous"
                            >
                              <i className="bi bi-calendar-check me-2"></i>
                              Rendez-vous
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/medecin/patients"
                            >
                              <i className="bi bi-people me-2"></i>
                              Mes Patients
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/medecin/articles"
                            >
                              <i className="bi bi-file-text me-2"></i>
                              Mes Articles
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/medecin/consultations"
                            >
                              <i className="bi bi-camera-video me-2"></i>
                              Consultations
                            </Link>
                            <Link
                              className="dropdown-item"
                              to="/medecin/disponibilites"
                            >
                              <i className="bi bi-calendar me-2"></i>
                              Mes Disponibilités
                            </Link>
                          </li>
                        </>
                      )}
                      {user.role === "admin" && (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/admin">
                              <i className="bi bi-speedometer2 me-2"></i>
                              Tableau de bord
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/admin/users">
                              <i className="bi bi-people me-2"></i>
                              Gestion des Utilisateurs
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/appointments"
                            >
                              <i className="bi bi-calendar-check me-2"></i>
                              Gestion des Rendez-vous
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/articles"
                            >
                              <i className="bi bi-file-text me-2"></i>
                              Modération des Articles
                            </Link>
                          </li>
                        </>
                      )}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Déconnexion
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="d-flex">
                  <Link
                    className="btn btn-outline-success me-2"
                    to="/connecter"
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Connexion
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔸 Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu bg-white shadow-lg">
            <div className="container-fluid px-4 py-3">
              <nav className="navbar-nav">
                <Link className="nav-link" to="/" onClick={toggleMenu}>
                  Accueil
                </Link>
                <Link className="nav-link" to="/medecins" onClick={toggleMenu}>
                  Médecin
                </Link>
                <Link className="nav-link" to="/articles" onClick={toggleMenu}>
                  Articles
                </Link>
                <Link className="nav-link" to="/pharmacie" onClick={toggleMenu}>
                  Pharmacies
                </Link>
                <Link className="nav-link" to="/hopitaux" onClick={toggleMenu}>
                  Hôpitaux
                </Link>
                <Link className="nav-link" to="/dentistes" onClick={toggleMenu}>
                  Dentistes
                </Link>
                <Link className="nav-link" to="/cliniques" onClick={toggleMenu}>
                  Cliniques
                </Link>
                <Link
                  className="nav-link"
                  to="/qui_sommes_nous"
                  onClick={toggleMenu}
                >
                  Qui sommes-nous ?
                </Link>
              </nav>

              <div className="mt-3 pt-3 border-top">
                {user ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold">
                        Bonjour, {user.first_name}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleLogout}
                      >
                        Déconnexion
                      </button>
                    </div>
                    <div className="d-grid gap-2">
                      <Link
                        className="btn btn-outline-primary"
                        to="/profil"
                        onClick={toggleMenu}
                      >
                        Mon Profil
                      </Link>
                      {user.role === "patient" && (
                        <>
                          <Link
                            className="btn btn-outline-success"
                            to="/patient"
                            onClick={toggleMenu}
                          >
                            Tableau de bord
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/patient/rendez-vous"
                            onClick={toggleMenu}
                          >
                            Mes Rendez-vous
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/patient/dossier-medical"
                            onClick={toggleMenu}
                          >
                            Dossier Médical
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/patient/consultations"
                            onClick={toggleMenu}
                          >
                            Consultations
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/patient/medication-reminders"
                            onClick={toggleMenu}
                          >
                            Rappels Médicaments
                          </Link>
                        </>
                      )}
                      {user.role === "medecin" && (
                        <>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin"
                            onClick={toggleMenu}
                          >
                            Tableau de bord
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin/rendez-vous"
                            onClick={toggleMenu}
                          >
                            Rendez-vous
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin/patients"
                            onClick={toggleMenu}
                          >
                            Mes Patients
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin/articles"
                            onClick={toggleMenu}
                          >
                            Mes Articles
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin/consultations"
                            onClick={toggleMenu}
                          >
                            Consultations
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/medecin/disponibilites"
                            onClick={toggleMenu}
                          >
                            Mes Disponibilités
                          </Link>
                        </>
                      )}
                      {user.role === "admin" && (
                        <>
                          <Link
                            className="btn btn-outline-success"
                            to="/admin"
                            onClick={toggleMenu}
                          >
                            Tableau de bord
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/admin/users"
                            onClick={toggleMenu}
                          >
                            Gestion des Utilisateurs
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/admin/appointments"
                            onClick={toggleMenu}
                          >
                            Gestion des Rendez-vous
                          </Link>
                          <Link
                            className="btn btn-outline-success"
                            to="/admin/articles"
                            onClick={toggleMenu}
                          >
                            Modération des Articles
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="d-grid gap-2">
                    <Link
                      className="btn btn-outline-success"
                      to="/connecter"
                      onClick={toggleMenu}
                    >
                      <i className="bi bi-box-arrow-in-right me-1"></i>
                      Connexion
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Enhanced Design */}
      <section
        className="hero-section py-5"
        style={{
          background: "linear-gradient(135deg, #e0f7fa 0%, #f8f9fa 100%)",
          minHeight: "500px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-12 px-4 px-lg-5">
              <h1
                className="display-4 fw-bold mb-4"
                style={{ color: "#155724" }}
              >
                Votre santé, notre priorité
              </h1>
              <p
                className="lead text-muted mb-4"
                style={{ fontSize: "1.2rem", lineHeight: "1.6" }}
              >
                Accédez à des soins médicaux de qualité, trouvez des
                professionnels de santé et gérez votre santé en toute
                simplicité.
              </p>
              <div className="d-flex flex-wrap gap-3">
                {loading ? (
                  // Show a loading state while authentication is being checked
                  <div className="btn btn-secondary btn-lg rounded-pill px-4 py-2">
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Chargement...
                  </div>
                ) : (
                  // For all users (authenticated or not), show only one button to go to login page
                  <Link
                    className="btn btn-success btn-lg rounded-pill px-4 py-2"
                    to="/connecter"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Commencer
                  </Link>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-12 text-center mt-4 mt-lg-0">
              <img
                src="/images/sante.jpg"
                alt="Soins de santé"
                className="img-fluid rounded-4 shadow-lg"
                style={{
                  maxWidth: "90%",
                  height: "auto",
                  border: "8px solid white",
                  boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main content area for child routes */}
      <main className="container my-5">
        <Outlet />
      </main>

      {/* Professional Footer Component */}
      <Footer />

      {/* Bootstrap Icons */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
      />

      {/* Floating buttons */}
      {!showChatbot && (
        <Link
          to="/patient/prise-rendez-vous"
          id="rendezvous-btn"
          className="btn btn-success fw-bold"
          style={{ position: "fixed", bottom: "90px", right: "20px", zIndex: 1000 }}
        >
          Prendre Rendez-vous
        </Link>
      )}

      {!showChatbot && (
        <button
          className="btn btn-primary chatbot-floating-button"
          onClick={() => user ? navigate("/connecter?redirect=chatbot") : navigate("/chatbot")}
          style={{
            position: "fixed",
            bottom: "80px",
            left: "20px",
            zIndex: 1000,
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="bi bi-chat-dots" style={{ fontSize: "24px" }}></i>
        </button>
      )}

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </>
  );
}

export default Layout;
