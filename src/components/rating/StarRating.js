import React, { useState } from 'react';

const StarRating = ({ rating, setRating, readOnly = false, size = 32 }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating" style={{ display: 'flex', gap: '5px' }}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;

        return (
          <label key={index} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
            {!readOnly && (
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                onClick={() => setRating(ratingValue)}
                style={{ display: 'none' }}
              />
            )}
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={ratingValue <= (hover || rating) ? "#fbbf24" : "#e2e8f0"}
              onMouseEnter={() => !readOnly && setHover(ratingValue)}
              onMouseLeave={() => !readOnly && setHover(0)}
              style={{
                transition: "fill 0.2s, transform 0.2s",
                transform: ratingValue <= (hover || rating) ? "scale(1.1)" : "scale(1)",
                filter: ratingValue <= (hover || rating) ? "drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))" : "none"
              }}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;
