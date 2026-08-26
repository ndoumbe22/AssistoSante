import React, { useState, useEffect, useRef } from "react";

function Dentistes() {
  const [dentistes, setDentistes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Mock data since the API doesn't exist
    const mockDentistes = [
      {
        id: 1,
        nom: "Dr. Ndiaye",
        adresse: "Rue Georges Pompidou, Dakar",
        telephone: "+221 33 111 22 33",
        email: "ndiaye@dentiste.sn",
        cabinet: "Cabinet dentaire du Bel-Air",
      },
      {
        id: 2,
        nom: "Dr. Diop",
        adresse: "Avenue Léopold Sédar Senghor, Dakar",
        telephone: "+221 33 444 55 66",
        email: "diop@dentiste.sn",
        cabinet: "Clinique dentaire de Dakar",
      },
      {
        id: 3,
        nom: "Dr. Fall",
        adresse: "Avenue Malick Sy, Dakar",
        telephone: "+221 33 777 88 99",
        email: "fall@dentiste.sn",
        cabinet: "Centre dentaire Pasteur",
      },
    ];
    setDentistes(mockDentistes);
  }, []);

  // Ensure dentistes is an array before filtering
  const filteredDentistes = Array.isArray(dentistes) 
    ? dentistes.filter(
        (dentiste) =>
          dentiste.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dentiste.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dentiste.cabinet &&
            dentiste.cabinet.toLowerCase().includes(searchTerm.toLowerCase()))
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
          const searchInput = document.getElementById("search-map-dentistes");
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
          .querySelectorAll("#table-dentistes tbody tr")
          .forEach((row) => {
            row.style.display = row.innerText.toLowerCase().includes(filter)
              ? ""
              : "none";
          });
      };

      const searchInput = document.getElementById("search-dentistes");
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
      <h2 className="mb-4">Liste des Dentistes</h2>

      <input
        type="text"
        id="search-dentistes"
        className="form-control w-50 mb-3"
        placeholder="Rechercher un dentiste..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="row">
        <div className="col-lg-7">
          <table className="table table-bordered" id="table-dentistes">
            <thead className="table-primary">
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Cabinet</th>
                <th>Téléphone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredDentistes.length > 0 ? (
                filteredDentistes.map((dentiste) => (
                  <tr key={dentiste.id}>
                    <td>{dentiste.nom}</td>
                    <td>{dentiste.adresse}</td>
                    <td>{dentiste.cabinet || "-"}</td>
                    <td>{dentiste.telephone || "-"}</td>
                    <td>{dentiste.email || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Aucun dentiste trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="col-lg-4">
          <img
            src="/images/dentiste.jpg"
            className="rounded shadow mb-3"
            style={{ width: "520px", height: "300px" }}
            alt="Dentiste"
          />
          <input
            type="text"
            id="search-map-dentistes"
            className="form-control mb-2 w-75"
            placeholder="Localiser un dentiste"
          />
          <div
            ref={mapContainerRef}
            id="map-dentistes"
            style={{ height: "260px", width: "520px", borderRadius: "10px" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Dentistes;
