import React, { useEffect, useState } from "react";
import { medicalDocumentAPI } from "../../services/api";
import { FaFileMedical, FaDownload } from "react-icons/fa";

function DossiersPatients() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await medicalDocumentAPI.getDocuments();
      const docs = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des documents patients.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>
        <FaFileMedical className="me-2" />
        Dossiers Médicaux des Patients
      </h2>

      {documents.length === 0 ? (
        <div className="alert alert-info mt-3">
          Aucun document partagé par vos patients.
        </div>
      ) : (
        <div className="row mt-3">
          {documents.map((doc) => (
            <div key={doc.id} className="col-md-6 mb-3">
              <div className="card p-3 shadow-sm">
                <h5>{doc.document_type}</h5>
                <p>{doc.description}</p>
                <p className="text-muted mb-1">
                  Patient : <strong>{doc.patient_nom}</strong>
                </p>
                <p className="text-muted">
                  Partagé le :{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                </p>
                <a
                  href={doc.file_url}
                  download
                  className="btn btn-primary btn-sm"
                >
                  <FaDownload className="me-1" />
                  Télécharger
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DossiersPatients;
