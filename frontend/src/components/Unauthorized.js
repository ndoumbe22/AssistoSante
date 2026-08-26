import React from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

function Unauthorized() {
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm p-5 text-center">
            <div className="d-flex justify-content-center mb-4">
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#fff3cd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaExclamationTriangle size={40} color="#856404" />
              </div>
            </div>
            <h2 className="text-warning">Accès non autorisé</h2>
            <p className="mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/" className="btn btn-primary">
                Retour à l'accueil
              </Link>
              <Link to="/connecter" className="btn btn-success">
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
