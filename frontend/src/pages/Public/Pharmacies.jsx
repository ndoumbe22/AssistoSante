import React, { useState, useEffect, useRef } from "react";
import { pharmacyAPI } from "../../services/api";

function Pharmacie() {
  const [pharmacies, setPharmacies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await pharmacyAPI.getPharmacies();
        // Ensure we're working with an array
        const pharmaciesData = Array.isArray(response.data) 
          ? response.data 
          : response.data.results || response.data.pharmacies || [];
        
        setPharmacies(pharmaciesData);
      } catch (error) {
        console.error("Error fetching pharmacies:", error);
        // Fallback to mock data if API fails
        const mockPharmacies = [
          {
            id: 1,
            nom: "Pharmacie du Bel-Air",
            adresse: "Rue Georges Pompidou, Dakar",
            telephone: "+221 33 111 22 33",
            email: "contact@pharmacie-belair.sn",
            ouvert_24h: true,
          },
          {
            id: 2,
            nom: "Pharmacie Centrale",
            adresse: "Avenue Léopold Sédar Senghor, Dakar",
            telephone: "+221 33 444 55 66",
            email: "info@pharmacie-centrale.sn",
            ouvert_24h: false,
          },
          {
            id: 3,
            nom: "Pharmacie Pasteur",
            adresse: "Avenue Malick Sy, Dakar",
            telephone: "+221 33 777 88 99",
            email: "contact@pharmacie-pasteur.sn",
            ouvert_24h: true,
          },
        ];
        setPharmacies(mockPharmacies);
      }
    };

    fetchPharmacies();
  }, []);

  // Ensure pharmacies is always an array before filtering
  const filteredPharmacies = Array.isArray(pharmacies) 
    ? pharmacies.filter(
        (pharmacie) =>
          pharmacie.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pharmacie.adresse.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Initialize map with proper cleanup
  useEffect(() => {
    let isMounted = true;

    // Initialize map
    const initMap = () => {
      // Clean up any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Check if the container exists and clean it
      if (mapContainerRef.current) {
        // Remove any existing Leaflet instance
        if (mapContainerRef.current._leaflet_id) {
          delete mapContainerRef.current._leaflet_id;
        }
        mapContainerRef.current.innerHTML = "";
      }

      // Check if Leaflet is available and container exists
      if (window.L && mapContainerRef.current) {
        try {
          // Create new map instance
          const map = window.L.map(mapContainerRef.current).setView(
            [14.6928, -17.4467],
            12
          );

          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          ).addTo(map);

          const marker = window.L.marker([14.6928, -17.4467]).addTo(map);

          // Store map instance for cleanup
          mapInstanceRef.current = map;

          // Add search functionality
          const searchInput = document.getElementById("search-map-pharmacies");
          if (searchInput) {
            const handleSearch = function (e) {
              if (!isMounted) return;
              let query = e.target.value;
              if (query) {
                fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query
                  )}`
                )
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.length > 0 && isMounted) {
                      let lat = parseFloat(data[0].lat);
                      let lon = parseFloat(data[0].lon);
                      map.setView([lat, lon], 14);
                      marker.setLatLng([lat, lon]);
                    } else {
                      alert("Aucun résultat trouvé.");
                    }
                  })
                  .catch((error) => {
                    console.error("Search error:", error);
                    if (isMounted) {
                      alert("Erreur lors de la recherche.");
                    }
                  });
              }
            };

            searchInput.addEventListener("change", handleSearch);

            // Return cleanup function for search listener
            return () => {
              searchInput.removeEventListener("change", handleSearch);
            };
          }
        } catch (error) {
          console.error("Map initialization error:", error);
        }
      }
    };

    // Load Leaflet CSS and JS dynamically if not already loaded
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        // Check if Leaflet CSS is already loaded
        if (!document.querySelector('link[href*="leaflet"]')) {
          const leafletCSS = document.createElement("link");
          leafletCSS.rel = "stylesheet";
          leafletCSS.href = "https://unpkg.com/leaflet@1.9.5/dist/leaflet.css";
          leafletCSS.onload = resolve;
          document.head.appendChild(leafletCSS);
        } else {
          resolve();
        }

        // Check if Leaflet JS is already loaded
        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.5/dist/leaflet.js";
          script.onload = () => {
            // Small delay to ensure Leaflet is fully initialized
            setTimeout(() => {
              if (isMounted) {
                const cleanup = initMap();
                resolve(cleanup);
              }
            }, 100);
          };
          document.head.appendChild(script);
        } else {
          // Small delay to ensure Leaflet is fully initialized
          setTimeout(() => {
            if (isMounted) {
              const cleanup = initMap();
              resolve(cleanup);
            }
          }, 100);
        }
      });
    };

    // Load Leaflet and initialize map
    loadLeaflet().then((cleanup) => {
      // Search functionality for table
      const handleTableSearch = (e) => {
        if (!isMounted) return;
        let filter = e.target.value.toLowerCase();
        document
          .querySelectorAll("#table-pharmacies tbody tr")
          .forEach((row) => {
            row.style.display = row.innerText.toLowerCase().includes(filter)
              ? ""
              : "none";
          });
      };

      const searchInput = document.getElementById("search-pharmacies");
      if (searchInput) {
        searchInput.addEventListener("keyup", handleTableSearch);

        // Return overall cleanup function
        return () => {
          isMounted = false;
          // Clean up map
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          // Clean up search listeners
          searchInput.removeEventListener("keyup", handleTableSearch);
          // Call any additional cleanup from initMap
          if (cleanup && typeof cleanup === "function") {
            cleanup();
          }
        };
      }
    });

    // Final cleanup
    return () => {
      isMounted = false;
      // Clean up map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Liste des Pharmacies</h2>

      <input
        type="text"
        id="search-pharmacies"
        className="form-control w-50 mb-3"
        placeholder="Rechercher une pharmacie..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="row">
        <div className="col-lg-7">
          <table className="table table-bordered" id="table-pharmacies">
            <thead className="table-primary">
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Ouvert 24h</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredPharmacies) && filteredPharmacies.length > 0 ? (
                filteredPharmacies.map((pharmacie) => (
                  <tr key={pharmacie.id}>
                    <td>{pharmacie.nom}</td>
                    <td>{pharmacie.adresse}</td>
                    <td>{pharmacie.telephone || "-"}</td>
                    <td>{pharmacie.email || "-"}</td>
                    <td>{pharmacie.ouvert_24h ? "Oui" : "Non"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Aucune pharmacie trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="col-lg-4">
          <img
            src="/images/pharmacie.jpg"
            className="rounded shadow mb-3"
            style={{ width: "520px", height: "300px" }}
            alt="Pharmacie"
          />
          <input
            type="text"
            id="search-map-pharmacies"
            className="form-control mb-2 w-75"
            placeholder="Localiser une pharmacie"
          />
          <div
            ref={mapContainerRef}
            id="map-pharmacies"
            style={{ height: "260px", width: "520px", borderRadius: "10px" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Pharmacie;
