import { useState, useEffect } from 'react';
import { Trip } from '../types/trip';
import { getImageForTrip } from '../services/imageService';

interface TripImageProps {
  trip: Trip;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const TripImage: React.FC<TripImageProps> = ({ 
  trip, 
  className, 
  style, 
  onClick 
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Get the image URL when trip changes
    const imageUrl = getImageForTrip(trip);
    setImageSrc(imageUrl);
    setHasError(false);
  }, [trip]);

  if (hasError || !imageSrc) {
    // Fallback: Show colored div with emoji based on category
    const categoryColors: Record<string, string> = {
      'Attraction': '#8b5cf6',
      'Beaches': '#06b6d4',
      'Hotels': '#f59e0b',
      'Restaurants': '#ef4444'
    };
    
    const categoryIcons: Record<string, string> = {
      'Attraction': '🏛️',
      'Beaches': '🏖️',
      'Hotels': '🏨',
      'Restaurants': '🍽️'
    };
    
    const category = trip.category || 'Attraction';
    const color = categoryColors[category] || '#6b7280';
    const icon = categoryIcons[category] || '🏝️';
    
    return (
      <div 
        className={className}
        style={{
          ...style,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
        }}
        onClick={onClick}
      >
        {icon}
      </div>
    );
  }
  
  return (
    <img
      src={imageSrc}
      alt={trip.destination}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};