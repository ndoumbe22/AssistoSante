// ConsultationPage.js ✅ Version modifiée
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaFileMedical,
  FaUserMd,
  FaUser,
  FaSave,
  FaPlus,
  FaPaperPlane, // nouveau picto
  FaDownload,
  FaArrowLeft,
  FaClipboardList,
  FaHeartbeat,
  FaCheck,
} from "react-icons/fa";

function ConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const [consultation, setConsultation] = useState(null);

  // Champs principaux
  const [notes, setNotes] = useState("");
  const [diagnostic, setDiagnostic] = useState("");

  // Form: Traitement
  const [medicament, setMedicament] = useState("");
  const [dosage, setDosage] = useState("");
  const [posologie, setPosologie] = useState("");

  // Form: Mesure
  const [constante, setConstante] = useState("");
  const [valeur, setValeur] = useState("");
  const [unite, setUnite] = useState("");

  // Listes affichées
  const [traitements, setTraitements] = useState([]);
  const [mesures, setMesures] = useState([]);
  const email = consultation?.patient?.email;

  // Charger le rendez-vous depuis ConsultationListe
  useEffect(() => {
    const rdv = location.state?.rdv;
    if (!rdv) {
      toast.error("Rendez-vous introuvable !");
      navigate(-1);
      return;
    }

    setConsultation({
      numero: rdv?.numero || "N/A",
      date: rdv?.date || "N/A",
      heure: rdv?.heure || "00:00",
      patient: {
        user: {
          first_name: rdv?.patient_prenom || rdv?.patient_nom || "Patient",
          last_name: rdv?.patient_nom || "",
        },
        email: rdv.patient_email,
      },
      medecin: {
        user: {
          first_name: user?.firstName || "Docteur",
          last_name: user?.lastName || "",
        },
      },
      statut: "en_cours",
      notes: "",
      diagnostic: "",
    });

    setLoading(false);
  }, [location.state, user, navigate]);

  // Sauvegarder les notes
  const saveNotes = () => {
    setSaving(true);
    setConsultation(prev => ({ ...prev, notes }));
    toast.success("Notes enregistrées");
    setSaving(false);
  };

  const saveDiagnostic = () => {
    setSaving(true);
    setConsultation(prev => ({ ...prev, diagnostic }));
    toast.success("Diagnostic enregistré");
    setSaving(false);
  };

  const addTraitement = () => {
    if (!medicament || !dosage || !posologie) {
      toast.warn("Veuillez renseigner médicament, dosage et posologie.");
      return;
    }
    const newTraitement = { medicament_nom: medicament, medicament_dosage: dosage, posologie };
    setTraitements(prev => [newTraitement, ...prev]);
    setMedicament("");
    setDosage("");
    setPosologie("");
    toast.success("Traitement ajouté");
  };

  const addMesure = () => {
    if (!constante || !valeur || !unite) {
      toast.warn("Veuillez renseigner nom de la mesure, valeur et unité.");
      return;
    }
    const newMesure = { nom_constante: constante, valeur, unite };
    setMesures(prev => [newMesure, ...prev]);
    setConstante("");
    setValeur("");
    setUnite("");
    toast.success("Mesure ajoutée");
  };

  // ✅ ENVOYER AU PATIENT
  const handleSendToPatient = async () => {
  const email = consultation?.patient?.email;

  if (!email) {
    toast.error("Email du patient introuvable !");
    return;
  }

  try {
    const payload = {
      email,
      consultation: {
        ...consultation,
        notes,
        diagnostic,
        traitements,
        mesures,
      },
    };
    console.log("Payload envoyé :", payload);

    const response = await fetch("http://127.0.0.1:8000/api/envoyer-consultation/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l’envoi");
    }

    toast.success("Consultation envoyée au patient ✅");
    navigate("/consultations");
  } catch (err) {
    toast.error("Erreur : " + err.message);
    console.error(err);
  }
};



  // ✅ EXPORT PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Consultation #${consultation.numero}`, 14, 15);

    doc.setFontSize(12);
    doc.text(`Médecin : Dr. ${consultation.medecin.user.first_name} ${consultation.medecin.user.last_name}`, 14, 25);
    doc.text(`Patient : ${consultation.patient.user.first_name} ${consultation.patient.user.last_name}`, 14, 32);
    doc.text(`Date : ${consultation.date}   Heure : ${consultation.heure}`, 14, 39);

    // Notes
    doc.setFontSize(14);
    doc.text("Notes médicales :", 14, 50);
    doc.setFontSize(12);
    doc.text(notes || "Aucune note", 14, 57);

    // Diagnostic
    doc.setFontSize(14);
    doc.text("Diagnostic :", 14, 75);
    doc.setFontSize(12);
    doc.text(diagnostic || "Aucun diagnostic", 14, 82);

    // Table Traitements
    if (traitements.length > 0) {
      autoTable(doc, {
        startY: 95,
        head: [["Médicament", "Dosage", "Posologie"]],
        body: traitements.map(t => [t.medicament_nom, t.medicament_dosage, t.posologie]),
      });
    }

    // Table Mesures
    if (mesures.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120,
        head: [["Mesure", "Valeur", "Unité"]],
        body: mesures.map(m => [m.nom_constante, m.valeur, m.unite]),
      });
    }

    doc.save(`consultation_${consultation.numero}.pdf`);

    toast.success("PDF téléchargé ✅");
  };

  if (loading) return <div className="text-center py-5">Chargement...</div>;

  return (
    <div className="container py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">
            <FaFileMedical className="me-2 text-primary" />
            Consultation #{consultation.numero}
          </h3>
          <div className="text-muted">
            <FaUserMd className="me-1" />
            {`Dr. ${consultation.medecin.user.first_name} ${consultation.medecin.user.last_name}`}
            {" · "}
            <FaUser className="ms-2 me-1" />
            {`${consultation.patient.user.first_name} ${consultation.patient.user.last_name}`}
            {" · "}
            {consultation.date} à {consultation.heure}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-1" /> Retour
          </button>

          {/* ✅ Export PDF */}
          <button className="btn btn-outline-primary" onClick={handleExportPDF}>
            <FaDownload className="me-1" /> Export PDF
          </button>

          {/* ✅ Envoyer au patient */}
          <button
            className="btn btn-success"
            onClick={handleSendToPatient}
          >
            <FaCheck className="me-1" /> Envoyer au patient
          </button>
        </div>
      </div>

      {/* --- RESTE DE LA PAGE (notes, diagnostic, etc) identique --- */}
      {/* ✅ Je n’ai PAS modifié cette partie pour éviter les bugs */}
      {/* ✅ Elle reste telle qu’elle était dans ton fichier */}

      {/* Notes */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3">Notes médicales</h5>
          <textarea
            className="form-control"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, antécédents, motif de consultation..."
          />
          <div className="d-flex justify-content-end mt-2">
            <button className="btn btn-primary" onClick={saveNotes} disabled={saving}>
              <FaSave className="me-1" />
              Enregistrer les notes
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3">Diagnostic</h5>
          <textarea
            className="form-control"
            rows={3}
            value={diagnostic}
            onChange={(e) => setDiagnostic(e.target.value)}
            placeholder="Diagnostic principal, diagnostics différentiels..."
          />
          <div className="d-flex justify-content-end mt-2">
            <button className="btn btn-success" onClick={saveDiagnostic} disabled={saving}>
              <FaSave className="me-1" />
              Enregistrer le diagnostic
            </button>
          </div>
        </div>
      </div>

      {/* Traitement */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaClipboardList className="me-2" />
            Prescription / Traitement
          </h5>

          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Médicament"
                value={medicament}
                onChange={(e) => setMedicament(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Dosage (ex: 500 mg)"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Posologie (ex: 1 cp x 3/j)"
                value={posologie}
                onChange={(e) => setPosologie(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-2">
            <button className="btn btn-info" onClick={addTraitement} disabled={saving}>
              <FaPlus className="me-1" />
              Ajouter le traitement
            </button>
          </div>
        </div>
      </div>

      {/* Mesures */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <FaHeartbeat className="me-2" />
            Mesures / Signes vitaux
          </h5>

          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Nom (TA, Température, Poids...)"
                value={constante}
                onChange={(e) => setConstante(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Valeur"
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Unité (mmHg, °C, kg...)"
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-2">
            <button className="btn btn-warning" onClick={addMesure} disabled={saving}>
              <FaPlus className="me-1" />
              Ajouter la mesure
            </button>
          </div>
        </div>
      </div>

      {/* Récap colonne de droite */}
      <div className="row">
        <div className="col-lg-4">

          <div className="card mb-3">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">Informations</h6>
              <div className="mb-1">
                <strong>Statut :</strong>{" "}
                <span className="badge bg-primary">{consultation?.statut}</span>
              </div>
              <div className="mb-1">
                <strong>Date :</strong> {consultation?.date}
              </div>
              <div className="mb-1">
                <strong>Heure :</strong> {consultation?.heure}
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">Traitements</h6>
              {traitements.length === 0 ? (
                <div className="text-muted">Aucun traitement ajouté.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Médicament</th>
                        <th>Dosage</th>
                        <th>Posologie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traitements.map((t, idx) => (
                        <tr key={idx}>
                          <td>{t.medicament_nom}</td>
                          <td>{t.medicament_dosage}</td>
                          <td>{t.posologie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">Mesures</h6>
              {mesures.length === 0 ? (
                <div className="text-muted">Aucune mesure ajoutée.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Mesure</th>
                        <th>Valeur</th>
                        <th>Unité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mesures.map((m, idx) => (
                        <tr key={idx}>
                          <td>{m.nom_constante}</td>
                          <td>{m.valeur}</td>
                          <td>{m.unite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ConsultationPage;
