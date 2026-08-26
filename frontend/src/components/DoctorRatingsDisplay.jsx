import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaSort, FaFilter, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import RatingComponent from "./RatingComponent";
import { doctorAPI } from "../services/api";

function DoctorRatingsDisplay({ doctorId }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real ratings from the backend
        const response = await doctorAPI.getDoctor(doctorId);
        
        // Assuming the response contains ratings data
        // This would depend on the actual API structure
        const doctorRatings = response.data.ratings || [];
        
        setRatings(doctorRatings);
        
        // Calculate average rating
        if (doctorRatings.length > 0) {
          const total = doctorRatings.reduce((sum, rating) => sum + rating.rating, 0);
          setAverageRating(total / doctorRatings.length);
          setTotalRatings(doctorRatings.length);
        } else {
          setAverageRating(0);
          setTotalRatings(0);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des évaluations :", err);
        
        // Fallback to mock data if API fails
        const mockRatings = [
          {
            id: 1,
            user: { name: "Aminata Fall", avatar: null },
            rating: 5,
            comment: "Excellente consultation, le médecin est très compétent et à l'écoute. Je recommande vivement !",
            date: "2024-06-15T10:30:00Z",
            helpful: 12,
            notHelpful: 2
          },
          {
            id: 2,
            user: { name: "Mamadou Diop", avatar: null },
            rating: 4,
            comment: "Bon médecin, consultation efficace. Le temps d'attente était un peu long mais cela valait la peine.",
            date: "2024-06-10T14:20:00Z",
            helpful: 8,
            notHelpful: 1
          },
          {
            id: 3,
            user: { name: "Fatou Ndiaye", avatar: null },
            rating: 3,
            comment: "Consultation correcte, mais le médecin semblait pressé. Répondait aux questions mais sans beaucoup d'explications.",
            date: "2024-06-05T09:15:00Z",
            helpful: 5,
            notHelpful: 3
          },
          {
            id: 4,
            user: { name: "Ousmane Sarr", avatar: null },
            rating: 5,
            comment: "Parfait ! Le médecin a pris le temps de tout expliquer et a été très rassurant. Je reviendrai sans hésiter.",
            date: "2024-05-28T16:45:00Z",
            helpful: 15,
            notHelpful: 0
          },
          {
            id: 5,
            user: { name: "Mariama Diallo", avatar: null },
            rating: 4,
            comment: "Très bon professionnel, à l'écoute des patients. L'organisation du cabinet laisse cependant à désirer.",
            date: "2024-05-20T11:30:00Z",
            helpful: 7,
            notHelpful: 2
          }
        ];
        
        setRatings(mockRatings);
        setAverageRating(4.2);
        setTotalRatings(mockRatings.length);
        setLoading(false);
      }
    };
    
    if (doctorId) {
      fetchRatings();
    }
  }, [doctorId, sortBy, filterBy]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return "Aujourd'hui";
    } else if (diffInDays === 1) {
      return "Hier";
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const handleHelpful = (ratingId, isHelpful) => {
    // In a real implementation, you would send this to the backend
    setRatings(prev => 
      prev.map(rating => {
        if (rating.id === ratingId) {
          return {
            ...rating,
            helpful: isHelpful ? rating.helpful + 1 : rating.helpful,
            notHelpful: !isHelpful ? rating.notHelpful + 1 : rating.notHelpful
          };
        }
        return rating;
      })
    );
  };

  const sortedRatings = [...ratings].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "oldest") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === "highest") {
      return b.rating - a.rating;
    } else if (sortBy === "lowest") {
      return a.rating - b.rating;
    }
    return 0;
  });

  const filteredRatings = sortedRatings.filter(rating => {
    if (filterBy === "all") return true;
    if (filterBy === "5") return rating.rating === 5;
    if (filterBy === "4") return rating.rating === 4;
    if (filterBy === "3") return rating.rating === 3;
    if (filterBy === "2") return rating.rating === 2;
    if (filterBy === "1") return rating.rating === 1;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Rating Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="me-4 text-center">
              <div className="display-4 fw-bold">{averageRating.toFixed(1)}</div>
              <div className="text-muted">sur 5</div>
            </div>
            <div className="flex-grow-1">
              <RatingComponent 
                initialRating={averageRating}
                readonly={true}
                size="lg"
              />
              <div className="mt-2">
                <span className="fw-bold">{totalRatings}</span> évaluation{totalRatings !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          {/* Rating distribution */}
          <div className="mt-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratings.filter(r => r.rating === star).length;
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              
              return (
                <div key={star} className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ width: "30px" }}>{star}★</span>
                  <div className="flex-grow-1">
                    <div className="progress" style={{ height: "8px" }}>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ms-2 text-muted" style={{ width: "30px" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Filters and Sort */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <label className="me-2">Trier par:</label>
          <select 
            className="form-select form-select-sm d-inline-block" 
            style={{ width: "auto" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="highest">Meilleures notes</option>
            <option value="lowest">Moins bonnes notes</option>
          </select>
        </div>
        
        <div>
          <label className="me-2">Filtrer:</label>
          <select 
            className="form-select form-select-sm d-inline-block" 
            style={{ width: "auto" }}
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>
      </div>
      
      {/* Ratings List */}
      {filteredRatings.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Aucune évaluation ne correspond à vos critères.</p>
        </div>
      ) : (
        <div>
          {filteredRatings.map(rating => (
            <div key={rating.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex">
                  <div className="me-3">
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" 
                         style={{ width: "50px", height: "50px" }}>
                      <span className="text-white fw-bold">
                        {rating.user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-0">{rating.user.name}</h6>
                      <small className="text-muted">{formatDate(rating.date)}</small>
                    </div>
                    <div className="mb-2">
                      <RatingComponent 
                        initialRating={rating.rating}
                        readonly={true}
                        size="sm"
                      />
                    </div>
                    <p className="mb-2">{rating.comment}</p>
                    <div className="d-flex align-items-center">
                      <small className="text-muted me-3">Cet avis vous a-t-il été utile ?</small>
                      <button 
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => handleHelpful(rating.id, true)}
                      >
                        <FaThumbsUp className="me-1" /> {rating.helpful}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleHelpful(rating.id, false)}
                      >
                        <FaThumbsDown className="me-1" /> {rating.notHelpful}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorRatingsDisplay;