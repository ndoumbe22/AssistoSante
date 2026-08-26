import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-4" style={{ backgroundColor: "#103e6e" }}>
      <div className="container">
        <div className="row">
          {/* About Section */}
          <div className="col-md-4 col-lg-4 col-xl-4 mx-auto mb-4">
            <h5 className="text-uppercase fw-bold mb-4">
              <i className="fas fa-gem me-3"></i>AssitoSanté
            </h5>
            <p>
              Plateforme de santé virtuelle intégrée pour un accès facilité aux soins médicaux, 
              aux consultations en ligne et au suivi personnalisé de votre santé.
            </p>
            <div className="d-flex justify-content-center justify-content-md-start">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="me-3 text-white">
                <FaFacebook />
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="me-3 text-white">
                <FaTwitter />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="me-3 text-white">
                <FaInstagram />
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="me-3 text-white">
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Liens Rapides</h5>
            <p>
              <Link to="/" className="text-white text-decoration-none">Accueil</Link>
            </p>
            <p>
              <Link to="/medecin_generaliste" className="text-white text-decoration-none">Médecins</Link>
            </p>
            <p>
              <Link to="/pharmacie" className="text-white text-decoration-none">Pharmacies</Link>
            </p>
            <p>
              <Link to="/hopitaux" className="text-white text-decoration-none">Hôpitaux</Link>
            </p>
          </div>

          {/* Services */}
          <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Services</h5>
            <p>
              <Link to="/patient/rendez-vous" className="text-white text-decoration-none">Rendez-vous</Link>
            </p>
            <p>
              <Link to="/patient/dossier-medical" className="text-white text-decoration-none">Dossier Médical</Link>
            </p>
            <p>
              <Link to="/patient/medication-reminders" className="text-white text-decoration-none">Rappels Médicaments</Link>
            </p>
            <p>
              <Link to="/patient/messagerie" className="text-white text-decoration-none">Messagerie</Link>
            </p>
          </div>

          {/* Contact */}
          <div className="col-md-3 col-lg-4 col-xl-4 mx-auto mb-md-0 mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Contact</h5>
            <p>
              <FaMapMarkerAlt className="me-3" /> Dakar, Sénégal
            </p>
            <p>
              <FaEnvelope className="me-3" /> contact@assitosante.sn
            </p>
            <p>
              <FaPhone className="me-3" /> +221 33 XXX XX XX
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center p-3" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
        © 2023 AssitoSanté. Tous droits réservés.
      </div>
    </footer>
  );
};

export default Footer;