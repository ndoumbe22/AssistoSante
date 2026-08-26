import React, { useEffect, useState } from "react";
import { medicalDocumentAPI } from "../../../services/api";
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
    setError(null);
    try {
      const response = await medicalDocumentAPI.getDocuments();
      const docs = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      // ID du médecin connecté
      const currentDoctorId = localStorage.getItem("user_id");

      // Filtrer documents partagés avec ce médecin
      const myDocs = docs.filter(
        (doc) =>
          doc.medecin?.id?.toString() === currentDoctorId ||
          doc.medecin?.toString() === currentDoctorId
      );

      setDocuments(myDocs);
    } catch (err) {
      console.error("Erreur API :", err);
      setError("Erreur lors du chargement des documents patients. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement sécurisé avec nom et extension corrects
  const handleDownload = async (url, doc) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await response.blob();
      const fileType = response.headers.get("content-type") || "application/octet-stream";
      const extension = fileType.split("/")[1] || "bin";
      const fileBlob = new Blob([blob], { type: fileType });

      const filename = `${doc.document_type}_${doc.nom_patient ?? 'patient'}.${extension}`;

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(fileBlob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Erreur téléchargement :", err);
      alert("Impossible de télécharger le fichier. Vérifiez la console pour plus de détails.");
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
          Aucun document partagé avec vous.
        </div>
      ) : (
        <div className="row mt-3">
          {documents.map((doc) => (
            <div key={doc.id} className="col-md-6 mb-3">
              <div className="card p-3 shadow-sm">
                <h5 className="mb-3 text-center">INFORMATIONS PATIENT</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Nom:</strong> {doc.nom_patient ?? "Non renseigné"}</p>
                    <p><strong>Prénom:</strong> {doc.prenom_patient ?? "Non renseigné"}</p>
                    <p><strong>Date de Naissance:</strong> {doc.date_naissance ?? "Non renseignée"}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Adresse:</strong> {doc.adresse ?? "Non renseignée"}</p>
                    <p><strong>Téléphone:</strong> {doc.telephone ?? "Non renseigné"}</p>
                    <p><strong>Poids:</strong> {doc.poids ?? "Non renseigné"} kg</p>
                    <p><strong>Taille:</strong> {doc.taille ?? "Non renseignée"} cm</p>
                  </div>
                </div>

                <p className="mt-2"><strong>Type :</strong> {doc.document_type}</p>
                <p className="text-muted">
                  Partagé le : {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("fr-FR") : "Date inconnue"}
                </p>
                <p>{doc.description}</p>

                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownload(doc.file_url, doc)}
                  >
                    <FaDownload className="me-1" /> Télécharger
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DossiersPatients;
