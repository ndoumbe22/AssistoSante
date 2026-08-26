import React, { useState, useEffect } from "react";
import { medicalDocumentAPI, rendezVousAPI } from "../../services/api";
import { FaFileMedical, FaDownload, FaTrash, FaUpload } from "react-icons/fa";

function DocumentPartage() {
  const [documents, setDocuments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadData, setUploadData] = useState({
    doctor: "",
    file: null,
    document_type: "",
    description: "",
    nom_patient: "",
    prenom_patient: "",
    date_naissance: "",
    poids: "",
    taille: "",
    adresse: "",
    telephone: "",
  });

  useEffect(() => {
    loadDocuments();
    loadDoctors();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await medicalDocumentAPI.getDocuments();
      const docs =
        Array.isArray(response.data)
          ? response.data
          : response.data?.results ?? [];
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des documents.");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const rdv = await rendezVousAPI.mesRendezVous();
      const rdvList = Array.isArray(rdv) ? rdv : rdv.data ?? [];

      const confirmed = rdvList.filter(
        (r) => r.statut === "CONFIRMED" || r.statut === "TERMINE"
      );

      const uniqueDoctors = {};
      confirmed.forEach((r) => {
        if (r.medecin) {
          uniqueDoctors[r.medecin] = {
            id: r.medecin,
            name: r.medecin_nom,
            first_name: r.medecin_prenom,
            specialite: r.specialite, // spécialité récupérée
          };
        }
      });

      

      setDoctors(Object.values(uniqueDoctors));
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des médecins.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !uploadData.doctor ||
      !uploadData.file ||
      !uploadData.document_type ||
      !uploadData.nom_patient ||
      !uploadData.prenom_patient ||
      !uploadData.date_naissance ||
      !uploadData.poids ||
      !uploadData.taille ||
      !uploadData.adresse ||
      !uploadData.telephone
    ) {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("medecin", uploadData.doctor);
      formData.append("file", uploadData.file);
      formData.append("document_type", uploadData.document_type);
      formData.append("description", uploadData.description);

      formData.append("nom_patient", uploadData.nom_patient);
      formData.append("prenom_patient", uploadData.prenom_patient);
      formData.append("date_naissance", uploadData.date_naissance);
      formData.append("poids", uploadData.poids);
      formData.append("taille", uploadData.taille);
      formData.append("adresse", uploadData.adresse);
      formData.append("telephone", uploadData.telephone);

      await medicalDocumentAPI.createDocument(formData);

      setShowUploadModal(false);
      setUploadData({
        doctor: "",
        file: null,
        document_type: "",
        description: "",
        nom_patient: "",
        prenom_patient: "",
        date_naissance: "",
        poids: "",
        taille: "",
        adresse: "",
        telephone: "",
      });

      await loadDocuments();
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Erreur lors de l'upload: " + JSON.stringify(err.response?.data));
    }
  };

  const handleDelete = async (id) => {
    try {
      await medicalDocumentAPI.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2><FaFileMedical className="me-2" /> Documents partagés</h2>
        <button className="btn btn-success" onClick={() => setShowUploadModal(true)}>
          <FaUpload className="me-1" /> Partager un document
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {documents.length === 0 ? (
        <p>Aucun document trouvé.</p>
      ) : (
        documents.map((d) => {
          // récupérer la spécialité du médecin
          const specialite = d.medecin_specialite ?? "Spécialité inconnue";
          console.log("DOCUMENT COMPLET =", d);

          return (
            <div key={d.id} className="card p-3 mb-3">
              <h5 className="mb-3 text-center">INFORMATIONS PATIENT</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Nom:</strong> {d.nom_patient ?? "Non renseigné"}</p>
                  <p><strong>Prénom:</strong> {d.prenom_patient ?? "Non renseigné"}</p>
                  <p><strong>Date de Naissance:</strong> {d.date_naissance ?? "Non renseignée"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Adresse:</strong> {d.adresse ?? "Non renseignée"}</p>
                  <p><strong>Téléphone:</strong> {d.telephone ?? "Non renseigné"}</p>
                  <p><strong>Poids:</strong> {d.poids ?? "Non renseigné"} kg</p>
                  <p><strong>Taille:</strong> {d.taille ?? "Non renseignée"} cm</p>
                </div>
              </div>

              {/* Médecin et spécialité */}
              {d.medecin_nom && (
                <p className="mt-2">
                  Partagé avec <strong>Dr. {d.medecin_nom}</strong>
                  {d.medecin_specialite ? ` - ${d.medecin_specialite}` : ""}
                </p>
              )}

              <div className="d-flex justify-content-between mt-3">
                <a href={d.file_url} download className="btn btn-primary btn-sm">
                  <FaDownload className="me-1" /> Télécharger
                </a>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                  <FaTrash className="me-1" /> Supprimer
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Partager un document</h5>
                <button className="btn-close" onClick={() => setShowUploadModal(false)}></button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="modal-body">
                  <label className="form-label">Médecin</label>
                  <select
                    className="form-control mb-3"
                    value={uploadData.doctor}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, doctor: e.target.value })
                    }
                    required
                  >
                    <option value="">Sélectionner…</option>
                    {(doctors || []).map((m) => (
                      <option key={m.id} value={m.id}>
                         Dr. {m.name} {m.first_name} {m.specialite ? `- ${m.specialite}` : ""}
                      </option>
                    ))}
                  </select>

                  <label className="form-label">Fichier</label>
                  <input
                    type="file"
                    className="form-control mb-3"
                    onChange={(e) =>
                      setUploadData({ ...uploadData, file: e.target.files[0] })
                    }
                    required
                  />

                  <label className="form-label">Type de document</label>
                  <input
                    type="text"
                    className="form-control mb-3"
                    value={uploadData.document_type}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, document_type: e.target.value })
                    }
                    placeholder="Ex: Ordonnance"
                    required
                  />

                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control mb-3"
                    rows="3"
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, description: e.target.value })
                    }
                  ></textarea>

                  <hr />

                  <label className="form-label">Nom du patient</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={uploadData.nom_patient}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, nom_patient: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Prénom du patient</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={uploadData.prenom_patient}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, prenom_patient: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Date de naissance</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={uploadData.date_naissance}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, date_naissance: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mb-2"
                    value={uploadData.poids}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, poids: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Taille (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mb-2"
                    value={uploadData.taille}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, taille: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Adresse</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={uploadData.adresse}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, adresse: e.target.value })
                    }
                    required
                  />

                  <label className="form-label">Téléphone</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={uploadData.telephone}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, telephone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Partager
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentPartage;
