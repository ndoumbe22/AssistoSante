import React, { useState, useEffect } from "react";

function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'API pour récupérer les patients du médecin
      // const data = await patientService.getMyPatients();
      // setPatients(data);

      // Données mockées temporaires
      setPatients([]);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2>
            <i className="bi bi-people-fill text-primary"></i> Mes Patients
          </h2>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i> Vous n'avez pas encore de patients
          assignés.
        </div>
      ) : (
        <div className="row">
          {patients.map((patient) => (
            <div key={patient.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{patient.nom}</h5>
                  <p className="card-text">{patient.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientsList;