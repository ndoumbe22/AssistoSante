import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaHospital, FaClinicMedical, FaTooth, FaPrescriptionBottle, FaDirections, FaFilter, FaSearchLocation, FaSync } from "react-icons/fa";
import HealthMap from "../../components/HealthMap";
import urgenceService from "../../services/urgenceService";

function LocaliserCentres() {
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("proximity");
  const [useNearby, setUseNearby] = useState(true);
  const [radius, setRadius] = useState(10);

  // Load facilities and user location
  useEffect(() => {
    loadFacilities();
    getUserLocation();
  }, [useNearby, radius]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...facilities];
    
    // Apply type filter
    if (filterType !== "all") {
      result = result.filter(facility => facility.type === filterType);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(facility => 
        facility.nom.toLowerCase().includes(term) || 
        facility.adresse.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (userLocation && sortBy === "proximity") {
      result = result.sort((a, b) => {
        const distanceA = a.distance || calculateDistance(
          userLocation.lat, userLocation.lng, 
          a.latitude, a.longitude
        );
        const distanceB = b.distance || calculateDistance(
          userLocation.lat, userLocation.lng, 
          b.latitude, b.longitude
        );
        return distanceA - distanceB;
      });
    } else if (sortBy === "name") {
      result = result.sort((a, b) => a.nom.localeCompare(b.nom));
    }
    
    setFilteredFacilities(result);
  }, [facilities, filterType, searchTerm, sortBy, userLocation]);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      let data;
      
      if (useNearby && userLocation) {
        // Load nearby facilities
        data = await urgenceService.getNearbyHealthFacilities(
          userLocation.lat, 
          userLocation.lng, 
          radius
        );
      } else {
        // Load all facilities
        data = await urgenceService.getHealthFacilities();
      }
      
      setFacilities(data);
    } catch (err) {
      setError("Erreur lors du chargement des centres de santé: " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Erreur de géolocalisation:", error);
          // Default to Dakar coordinates
          setUserLocation({ lat: 14.6937, lng: -17.444 });
        }
      );
    } else {
      // Default to Dakar coordinates
      setUserLocation({ lat: 14.6937, lng: -17.444 });
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const getDistanceText = (facility) => {
    if (facility.distance) {
      return facility.distance < 1 ? `${Math.round(facility.distance * 1000)} m` : `${facility.distance.toFixed(1)} km`;
    }
    
    if (!userLocation) return "";
    const distance = calculateDistance(userLocation.lat, userLocation.lng, facility.latitude, facility.longitude);
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  };

  const getFacilityTypeText = (type) => {
    switch (type) {
      case "hopital": return "Hôpital";
      case "clinique": return "Clinique";
      case "pharmacie": return "Pharmacie";
      case "dentiste": return "Dentiste";
      default: return type;
    }
  };

  const getFacilityIcon = (type) => {
    switch (type) {
      case "hopital": return <FaHospital className="me-2" />;
      case "clinique": return <FaClinicMedical className="me-2" />;
      case "pharmacie": return <FaPrescriptionBottle className="me-2" />;
      case "dentiste": return <FaTooth className="me-2" />;
      default: return <FaHospital className="me-2" />;
    }
  };

  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility);
  };

  const handleGetDirections = (facility) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${facility.latitude},${facility.longitude}`;
      window.open(url, "_blank");
    } else {
      alert("Impossible d'obtenir votre position actuelle. Veuillez activer la géolocalisation.");
    }
  };

  const handleRefresh = () => {
    loadFacilities();
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <FaMapMarkerAlt className="me-2" />
            Localiser les Centres de Santé
          </h2>
        </div>
      </div>
      
      <div className="row">
        {/* Map Column */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaMapMarkerAlt className="me-2" />
                Carte Interactive
              </h5>
              <div className="d-flex">
                <button className="btn btn-light btn-sm me-2" onClick={getUserLocation}>
                  <FaSearchLocation className="me-1" />
                  Ma position
                </button>
                <button className="btn btn-light btn-sm" onClick={handleRefresh}>
                  <FaSync className="me-1" />
                  Actualiser
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <HealthMap 
                onFacilitySelect={handleFacilitySelect} 
                useNearby={useNearby}
                radius={radius}
              />
            </div>
          </div>
        </div>
        
        {/* Facilities List Column */}
        <div className="col-lg-4">
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <FaFilter className="me-2" />
                Filtres et Recherche
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Mode d'affichage</label>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="displayMode"
                    id="nearbyMode"
                    checked={useNearby}
                    onChange={() => setUseNearby(true)}
                  />
                  <label className="form-check-label" htmlFor="nearbyMode">
                    Centres à proximité
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="displayMode"
                    id="allMode"
                    checked={!useNearby}
                    onChange={() => setUseNearby(false)}
                  />
                  <label className="form-check-label" htmlFor="allMode">
                    Tous les centres
                  </label>
                </div>
              </div>
              
              {useNearby && (
                <div className="mb-3">
                  <label className="form-label">Rayon (km)</label>
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between">
                    <span>1 km</span>
                    <span className="fw-bold">{radius} km</span>
                    <span>50 km</span>
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <label className="form-label">Type de centre</label>
                <select 
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tous les types</option>
                  <option value="hopital">Hôpitaux</option>
                  <option value="clinique">Cliniques</option>
                  <option value="pharmacie">Pharmacies</option>
                  <option value="dentiste">Dentistes</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Recherche</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par nom ou adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Trier par</label>
                <select 
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="proximity">Proximité</option>
                  <option value="name">Nom</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Facilities List */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Centres de Santé</h5>
                <small className="text-muted">{filteredFacilities.length} centre{filteredFacilities.length !== 1 ? 's' : ''} trouvé{filteredFacilities.length !== 1 ? 's' : ''}</small>
              </div>
            </div>
            <div className="card-body p-0" style={{ maxHeight: "500px", overflowY: "auto" }}>
              {filteredFacilities.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">Aucun centre de santé ne correspond à vos critères.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredFacilities.map((facility) => (
                    <div 
                      key={facility.id} 
                      className={`list-group-item list-group-item-action ${selectedFacility && selectedFacility.id === facility.id ? 'active' : ''}`}
                      onClick={() => setSelectedFacility(facility)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {getFacilityIcon(facility.type)}
                            {facility.nom}
                          </h6>
                          <p className="mb-1 text-muted">
                            <small>{facility.adresse}</small>
                          </p>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-secondary me-2">
                              {getFacilityTypeText(facility.type)}
                            </span>
                            <span className="text-muted">
                              <small>{getDistanceText(facility)}</small>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedFacility && selectedFacility.id === facility.id && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <div className="d-flex justify-content-between">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(facility);
                              }}
                            >
                              <FaDirections className="me-1" />
                              Itinéraire
                            </button>
                            {facility.telephone && (
                              <a 
                                href={`tel:${facility.telephone}`} 
                                className="btn btn-outline-success btn-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Appeler
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocaliserCentres;