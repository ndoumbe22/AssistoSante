import React, { useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

function RatingComponent({ 
  initialRating = 0, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showText = true 
}) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleClick = (value) => {
    if (readonly) return;
    setRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (readonly) return;
    setHover(value);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHover(0);
  };

  const renderStars = () => {
    const stars = [];
    const currentRating = hover || rating;
    
    // Ensure currentRating is between 0 and 5
    const clampedRating = Math.max(0, Math.min(5, currentRating));
    
    for (let i = 1; i <= 5; i++) {
      let icon;
      if (clampedRating >= i) {
        icon = <FaStar data-testid={`star-${i}-full`} />;
      } else if (clampedRating >= i - 0.5) {
        icon = <FaStarHalfAlt data-testid={`star-${i}-half`} />;
      } else {
        icon = <FaRegStar data-testid={`star-${i}-empty`} />;
      }
      
      stars.push(
        <span
          key={i}
          data-testid={`star-${i}`}
          onClick={() => handleClick(i)}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: readonly ? "default" : "pointer",
            color: "#ffc107",
            fontSize: size === "sm" ? "0.8rem" : size === "lg" ? "1.5rem" : "1rem",
            marginRight: "2px"
          }}
        >
          {icon}
        </span>
      );
    }
    
    return stars;
  };

  const getRatingText = () => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Très bon";
    if (rating >= 3.0) return "Bon";
    if (rating >= 2.0) return "Moyen";
    if (rating >= 1.0) return "Médiocre";
    return "Aucune note";
  };

  const getRatingDescription = () => {
    return `${rating.toFixed(1)} sur 5 (${getRatingText()})`;
  };

  return (
    <div className="d-flex align-items-center">
      <div data-testid="rating-stars">{renderStars()}</div>
      {showText && (
        <span className="ms-2" style={{ fontSize: size === "sm" ? "0.8rem" : "0.9rem" }} data-testid="rating-text">
          {getRatingDescription()}
        </span>
      )}
    </div>
  );
}

export default RatingComponent;