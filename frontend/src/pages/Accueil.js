import React, { useState, useEffect } from "react";
import {
  adminAPI,
  patientAPI,
  doctorAPI,
  clinicAPI,
  pharmacyAPI,
} from "../services/api";
import api from "../services/api";
import publicService from "../services/publicService";

function Accueil() {
  const [stats, setStats] = useState([
    { title: "Médecins", value: "0", icon: "bi bi-person-fill" },
    { title: "Patients", value: "0", icon: "bi bi-people-fill" },
    { title: "Cliniques", value: "0", icon: "bi bi-hospital-fill" },
    { title: "Pharmacies", value: "0", icon: "bi bi-capsule" },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        console.log("Fetching statistics...");

        // Try to use public statistics endpoint first (no authentication required)
        try {
          const statsResponse = await publicService.getStatistics();
          console.log("Public statistics response:", statsResponse);

          if (statsResponse && typeof statsResponse === "object") {
            // Use the statistics from the public endpoint
            setStats([
              {
                title: "Médecins",
                value: statsResponse.total_doctors?.toString() || "0",
                icon: "bi bi-person-fill",
              },
              {
                title: "Patients",
                value: statsResponse.total_patients?.toString() || "0",
                icon: "bi bi-people-fill",
              },
              {
                title: "Cliniques",
                value: statsResponse.total_clinics?.toString() || "0",
                icon: "bi bi-hospital-fill",
              },
              {
                title: "Pharmacies",
                value: statsResponse.total_pharmacies?.toString() || "0",
                icon: "bi bi-capsule",
              },
            ]);
            setLoading(false);
            return;
          }
        } catch (publicError) {
          console.log("Public statistics endpoint not available:", publicError);
          console.log("Error details:", {
            message: publicError.message,
            response: publicError.response,
            status: publicError.response?.status,
            data: publicError.response?.data,
          });
        }

        // If all else fails, show mock data
        setStats([
          { title: "Médecins", value: "150+", icon: "bi bi-person-fill" },
          { title: "Patients", value: "5000+", icon: "bi bi-people-fill" },
          { title: "Cliniques", value: "25+", icon: "bi bi-hospital-fill" },
          { title: "Pharmacies", value: "100+", icon: "bi bi-capsule" },
        ]);

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        setError(
          "Impossible de charger les statistiques. Affichage des données de démonstration."
        );

        // Fallback to mock data in case of error
        setStats([
          { title: "Médecins", value: "150+", icon: "bi bi-person-fill" },
          { title: "Patients", value: "5000+", icon: "bi bi-people-fill" },
          { title: "Cliniques", value: "25+", icon: "bi bi-hospital-fill" },
          { title: "Pharmacies", value: "100+", icon: "bi bi-capsule" },
        ]);

        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Services data (static as these are features, not dynamic counts)
  const services = [
    {
      title: "Recherche de Médecins",
      description:
        "Trouvez facilement des médecins généralistes et spécialistes près de chez vous.",
      icon: "bi bi-search",
    },
    {
      title: "Téléconsultation",
      description:
        "Consultez des professionnels de santé à distance en toute sécurité.",
      icon: "bi bi-laptop",
    },
    {
      title: "Prise de Rendez-vous",
      description:
        "Prenez des rendez-vous en ligne avec les praticiens de votre choix.",
      icon: "bi bi-calendar-check",
    },
    {
      title: "Suivi Médical",
      description:
        "Accédez à vos dossiers médicaux et suivez votre état de santé.",
      icon: "bi bi-file-medical",
    },
  ];

  // Mock data for testimonials (static as these are user testimonials)
  const testimonials = [
    {
      name: "Awa Diop",
      role: "Patient",
      content:
        "AssitoSanté m'a permis de trouver rapidement un médecin spécialiste. L'interface est intuitive et les services sont excellents!",
      rating: 5,
    },
    {
      name: "Dr. Samba Ndiaye",
      role: "Médecin Généraliste",
      content:
        "Cette plateforme facilite vraiment mon travail quotidien. Je peux mieux organiser mes rendez-vous et suivre mes patients.",
      rating: 5,
    },
    {
      name: "Fatou Fall",
      role: "Patient",
      content:
        "Grâce à AssitoSanté, j'ai pu consulter un spécialiste sans attendre des heures. Un vrai soulagement pour les personnes âgées comme ma mère.",
      rating: 4,
    },
  ];

  // Function to render star ratings
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < rating ? "#ffc107" : "#ddd" }}>
        ★
      </span>
    ));
  };

  return (
    <>
      {/* Section principale sous le header - Enhanced Hero Section */}
      <section
        className="position-relative overflow-hidden"
        style={{
          minHeight: "calc(100vh - 140px)",
          width: "100%",
          marginTop: "0px",
          padding: "60px 0",
          background: "linear-gradient(135deg, #e0f7fa 0%, #f8f9fa 100%)",
        }}
      >
        {/* Vidéo de fond */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ objectFit: "cover", zIndex: -1, opacity: 0.3 }}
        >
          <source src="/videos/medical_bg.mp4" type="video/mp4" />
          Votre navigateur ne supporte pas la vidéo.
        </video>

        {/* Container fluide (pleine largeur, sans marges) */}
        <div className="container-fluid h-100">
          <div className="row align-items-center h-100">
            {/* Colonne gauche : Texte - Enhanced */}
            <div className="col-lg-6 px-5" style={{ color: "#333" }}>
              {/* Barre de recherche - Enhanced */}
              <div className="input-group mb-4">
                <input
                  type="text"
                  className="form-control form-control-lg rounded-start-pill"
                  placeholder="Recherchez des médecins, cliniques, pharmacies..."
                  aria-label="Recherche"
                  style={{
                    fontSize: "15px",
                    border: "2px solid #28a745",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <button
                  className="btn btn-success btn-lg rounded-end-pill"
                  type="button"
                  style={{
                    padding: "12px 24px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <i className="bi bi-search me-2"></i>Rechercher
                </button>
              </div>

              {/* Titre et texte - Enhanced */}
              <h1
                className="display-4 fw-bold mb-4"
                style={{ color: "#155724" }}
              >
                AssistoSanté : Votre Partenaire Santé Virtuel
              </h1>
              <p
                className="lead mb-4"
                style={{ fontSize: "1.2rem", lineHeight: "1.6" }}
              >
                Notre mission est de promouvoir la santé et le bien-être grâce à
                une plateforme qui facilite l'accès aux soins de qualité, aux
                professionnels de santé et aux services médicaux, partout et à
                tout moment.
              </p>
              <p className="mb-4" style={{ fontSize: "1.1rem" }}>
                Avec AssistoSanté, trouvez rapidement un médecin, une pharmacie,
                une clinique ou encore accédez à nos services de
                téléconsultation.
              </p>
            </div>

            {/* Colonne droite : Carousel - Enhanced */}
            <div className="col-lg-6 px-5">
              <div
                id="carouselAccueil"
                className="carousel slide shadow-lg rounded-4"
                data-bs-ride="carousel"
                style={{
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                }}
              >
                <div className="carousel-inner">
                  <div className="carousel-item active">
                    <img
                      src="/images/medecin.jpg"
                      className="d-block w-100"
                      alt="Médecin généraliste"
                      style={{ height: "450px", objectFit: "cover" }}
                    />
                    <div className="carousel-caption d-block bg-white bg-opacity-75 rounded p-3 mx-3 mb-3">
                      <h5 className="text-success fw-bold">
                        Médecin généraliste
                      </h5>
                      <p className="text-muted mb-0">
                        Consultations en présentiel et à distance
                      </p>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <img
                      src="/images/hopital2.jpg"
                      className="d-block w-100"
                      alt="Hôpitaux modernes"
                      style={{ height: "450px", objectFit: "cover" }}
                    />
                    <div className="carousel-caption d-block bg-white bg-opacity-75 rounded p-3 mx-3 mb-3">
                      <h5 className="text-success fw-bold">
                        Hôpitaux modernes
                      </h5>
                      <p className="text-muted mb-0">
                        Établissements de santé de qualité
                      </p>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <img
                      src="/images/pharmacie2.jpg"
                      className="d-block w-100"
                      alt="Pharmacies de proximité"
                      style={{ height: "450px", objectFit: "cover" }}
                    />
                    <div className="carousel-caption d-block bg-white bg-opacity-75 rounded p-3 mx-3 mb-3">
                      <h5 className="text-success fw-bold">
                        Pharmacies de proximité
                      </h5>
                      <p className="text-muted mb-0">
                        Livraison de médicaments à domicile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contrôles */}
                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#carouselAccueil"
                  data-bs-slide="prev"
                >
                  <span className="carousel-control-prev-icon"></span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#carouselAccueil"
                  data-bs-slide="next"
                >
                  <span className="carousel-control-next-icon"></span>
                </button>

                {/* Indicators */}
                <div className="carousel-indicators">
                  <button
                    type="button"
                    data-bs-target="#carouselAccueil"
                    data-bs-slide-to="0"
                    className="active"
                    aria-current="true"
                    aria-label="Slide 1"
                  ></button>
                  <button
                    type="button"
                    data-bs-target="#carouselAccueil"
                    data-bs-slide-to="1"
                    aria-label="Slide 2"
                  ></button>
                  <button
                    type="button"
                    data-bs-target="#carouselAccueil"
                    data-bs-slide-to="2"
                    aria-label="Slide 3"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section des statistiques - Enhanced */}
      <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="fw-bold display-5 text-success">
                Notre Plateforme en Chiffres
              </h2>
              <p className="text-muted lead">
                Découvrez l'impact de notre plateforme sur la communauté
                médicale
              </p>
              {error && <div className="alert alert-warning mt-3">{error}</div>}
            </div>
          </div>
          <div className="row g-4">
            {stats.map((stat, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div className="card h-100 shadow-sm border-0 text-center rounded-3 hover-effect">
                  <div className="card-body">
                    <div className="display-4 mb-3 text-success">
                      <i className={stat.icon}></i>
                    </div>
                    <h3 className="fw-bold text-primary mb-2">
                      {loading ? (
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        stat.value
                      )}
                    </h3>
                    <p className="text-muted mb-0 fw-medium">{stat.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section des services - Enhanced */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="fw-bold display-5 text-success">Nos Services</h2>
              <p className="text-muted lead">
                Découvrez l'ensemble des services que nous offrons pour
                améliorer votre accès aux soins
              </p>
            </div>
          </div>
          <div className="row g-4">
            {services.map((service, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div className="card h-100 shadow-sm border-0 rounded-3 service-card">
                  <div className="card-body text-center">
                    <div className="display-4 mb-3 text-success">
                      <i className={service.icon}></i>
                    </div>
                    <h5 className="fw-bold mb-3">{service.title}</h5>
                    <p className="text-muted">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section des témoignages - Enhanced */}
      <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="fw-bold display-5 text-success">Témoignages</h2>
              <p className="text-muted lead">
                Découvrez ce que nos utilisateurs disent de notre plateforme
              </p>
            </div>
          </div>
          <div className="row g-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className="card h-100 shadow-sm border-0 rounded-3 testimonial-card">
                  <div className="card-body">
                    <div className="mb-3">
                      {renderStars(testimonial.rating)}
                    </div>
                    <p className="card-text mb-4 fst-italic">
                      "{testimonial.content}"
                    </p>
                    <div className="d-flex align-items-center">
                      <div className="ms-3">
                        <h6 className="mb-0 fw-bold">{testimonial.name}</h6>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>
        {`
          /* Ensure carousel images display properly */
          .carousel-inner img {
            width: 100%;
            height: 450px;
            object-fit: cover;
            border-radius: 20px;
          }
          
          /* Fix for video background */
          .position-relative {
            position: relative !important;
          }
          
          .position-absolute {
            position: absolute !important;
          }
          
          /* Card hover effect */
          .card {
            transition: all 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
          }
          
          .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15) !important;
          }
          
          .service-card:hover {
            border-top: 4px solid #28a745;
          }
          
          .testimonial-card:hover {
            border-left: 4px solid #28a745;
          }
          
          /* Ensure Bootstrap Icons are loaded */
          .bi::before {
            display: inline-block;
            font-family: "bootstrap-icons" !important;
            font-style: normal;
            font-weight: normal !important;
            font-variant: normal;
            text-transform: none;
            line-height: 1;
            vertical-align: -.125em;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Fix carousel caption visibility */
          .carousel-caption {
            color: #333;
            text-shadow: none;
            bottom: 0;
          }
          
          .carousel-caption h5 {
            color: #155724 !important;
            font-weight: bold;
          }
          
          /* Carousel indicators */
          .carousel-indicators [data-bs-target] {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #28a745;
            border: none;
          }
          
          .carousel-indicators .active {
            background-color: #155724;
          }
          
          /* Responsive adjustments */
          @media (max-width: 992px) {
            .carousel-inner img {
              height: 350px;
            }
            
            .display-4 {
              font-size: 2.5rem;
            }
            
            .display-5 {
              font-size: 2rem;
            }
          }
          
          @media (max-width: 768px) {
            .carousel-inner img {
              height: 300px;
            }
            
            .display-4 {
              font-size: 2rem;
            }
            
            .display-5 {
              font-size: 1.75rem;
            }
            
            .lead {
              font-size: 1rem;
            }
            
            .section {
              padding: 40px 0;
            }
          }
          
          @media (max-width: 576px) {
            .carousel-inner img {
              height: 250px;
            }
            
            .display-4 {
              font-size: 1.75rem;
            }
            
            .display-5 {
              font-size: 1.5rem;
            }
            
            .btn-lg {
              font-size: 0.9rem;
              padding: 8px 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default Accueil;
