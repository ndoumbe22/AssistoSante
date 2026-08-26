import React, { useState } from "react";
import HealthMap from "../../components/HealthMap";
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock, FaDirections } from "react-icons/fa";

function LocaliserServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [useNearby, setUseNearby] = useState(false);
  const [radius, setRadius] = useState(10);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const facilityTypes = [
    { value: "all", label: "Tous les types" },
    { value: "hopital", label: "Hôpitaux" },
    { value: "clinique", label: "Cliniques" },
    { value: "pharmacie", label: "Pharmacies" },
    { value: "dentiste", label: "Dentistes" }
  ];

  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility);
  };

  const handleGetDirections = () => {
    if (selectedFacility) {
      // Open Google Maps with directions
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.latitude},${selectedFacility.longitude}`, "_blank");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h1 className="text-center mb-4">
            <FaMapMarkerAlt className="me-2" />
            Localiser les Services de Santé
          </h1>
          
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3 mb-md-0">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par nom ou adresse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-3 mb-3 mb-md-0">
                  <select
                    className="form-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {facilityTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-3 mb-3 mb-md-0">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="nearbySwitch"
                      checked={useNearby}
                      onChange={(e) => setUseNearby(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="nearbySwitch">
                      À proximité ({radius} km)
                    </label>
                  </div>
                </div>
                
                {useNearby && (
                  <div className="col-md-2">
                    <input
                      type="range"
                      className="form-range"
                      min="1"
                      max="50"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                    />
                    <small className="text-muted">{radius} km</small>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <button className="btn btn-primary me-2">
                  <FaMapMarkerAlt className="me-2" />
                  Localiser ma position
                </button>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-body p-0">
                  <HealthMap 
                    onFacilitySelect={handleFacilitySelect}
                    useNearby={useNearby}
                    radius={radius}
                  />
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h5>
                    {selectedFacility ? "Détails de l'établissement" : "Sélectionnez un établissement"}
                  </h5>
                </div>
                <div className="card-body">
                  {selectedFacility ? (
                    <div>
                      <h4>{selectedFacility.nom}</h4>
                      <p className="text-muted">
                        {selectedFacility.type === "hopital" && "Hôpital"}
                        {selectedFacility.type === "clinique" && "Clinique"}
                        {selectedFacility.type === "pharmacie" && "Pharmacie"}
                        {selectedFacility.type === "dentiste" && "Cabinet dentaire"}
                      </p>
                      
                      <div className="mb-3">
                        <strong>
                          <FaMapMarkerAlt className="me-2" />
                          Adresse
                        </strong>
                        <p className="mb-0">{selectedFacility.adresse}</p>
                      </div>
                      
                      {selectedFacility.telephone && (
                        <div className="mb-3">
                          <strong>
                            <FaPhone className="me-2" />
                            Téléphone
                          </strong>
                          <p className="mb-0">{selectedFacility.telephone}</p>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <strong>
                          <FaClock className="me-2" />
                          Horaires
                        </strong>
                        <p className="mb-0">Ouvert 24h/24</p>
                      </div>
                      
                      {selectedFacility.distance && (
                        <div className="mb-3">
                          <strong>Distance</strong>
                          <p className="mb-0">{selectedFacility.distance} km</p>
                        </div>
                      )}
                      
                      <button 
                        className="btn btn-primary w-100"
                        onClick={handleGetDirections}
                      >
                        <FaDirections className="me-2" />
                        Obtenir l'itinéraire
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaMapMarkerAlt size={48} className="text-muted mb-3" />
                      <p className="text-muted">
                        Cliquez sur un marqueur de la carte pour voir les détails de l'établissement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocaliserServices;