import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaHospital,
  FaClinicMedical,
  FaTooth,
  FaPrescriptionBottle,
} from "react-icons/fa";
import urgenceService from "../services/urgenceService";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different facility types
const facilityIcons = {
  hopital: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  clinique: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  pharmacie: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  dentiste: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

function HealthMap({ onFacilitySelect, useNearby = false, radius = 10 }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);

  useEffect(() => {
    loadFacilities();
    getUserLocation();
  }, []);

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
      setError(
        "Erreur lors du chargement des centres de santé: " +
          (err.response?.data?.error || err.message)
      );
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

  const getFacilityIcon = (type) => {
    return facilityIcons[type] || facilityIcons.hopital;
  };

  const getFacilityIconComponent = (type) => {
    switch (type) {
      case "hopital":
        return <FaHospital className="me-2" />;
      case "clinique":
        return <FaClinicMedical className="me-2" />;
      case "pharmacie":
        return <FaPrescriptionBottle className="me-2" />;
      case "dentiste":
        return <FaTooth className="me-2" />;
      default:
        return <FaHospital className="me-2" />;
    }
  };

  const getFacilityTypeText = (type) => {
    switch (type) {
      case "hopital":
        return "Hôpital";
      case "clinique":
        return "Clinique";
      case "pharmacie":
        return "Pharmacie";
      case "dentiste":
        return "Dentiste";
      default:
        return type;
    }
  };

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  // Default center if no user location
  const center = userLocation || { lat: 14.6937, lng: -17.444 };

  return (
    <div style={{ height: "500px", position: "relative" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        key={`${center.lat}-${center.lng}`} // Add key to force re-render when center changes
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div>
                <h6>Votre position</h6>
                <p>Vous êtes ici</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Health facilities markers */}
        {facilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.latitude, facility.longitude]}
            icon={getFacilityIcon(facility.type)}
            eventHandlers={{
              click: () => handleFacilityClick(facility),
            }}
          >
            <Popup>
              <div>
                <h6>{facility.nom}</h6>
                <p>
                  {getFacilityIconComponent(facility.type)}
                  {getFacilityTypeText(facility.type)}
                </p>
                <p>
                  <strong>Adresse:</strong> {facility.adresse}
                </p>
                {facility.telephone && (
                  <p>
                    <strong>Téléphone:</strong> {facility.telephone}
                  </p>
                )}
                {facility.distance && (
                  <p>
                    <strong>Distance:</strong> {facility.distance} km
                  </p>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFacilityClick(facility);
                  }}
                >
                  Voir les détails
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        className="position-absolute bg-white p-2 rounded shadow"
        style={{ bottom: "10px", left: "10px", zIndex: 1000 }}
      >
        <div className="d-flex flex-wrap">
          <div className="me-3 mb-2">
            <span className="badge bg-danger">●</span> Hôpitaux
          </div>
          <div className="me-3 mb-2">
            <span className="badge bg-primary">●</span> Cliniques
          </div>
          <div className="me-3 mb-2">
            <span className="badge bg-success">●</span> Pharmacies
          </div>
          <div className="mb-2">
            <span className="badge bg-purple">●</span> Dentistes
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthMap;