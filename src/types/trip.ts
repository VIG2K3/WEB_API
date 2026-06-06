// src/types/trip.ts
// Centralized TypeScript types for trip-related data structures

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type?: string;
  desc?: string;
  address: string;
  cuisine?: string;
  opening_hours?: string;
  phone?: string;
  distanceKm?: number;
}

export interface Weather {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  feelsLike: string;
  icon: string;
}

export interface Attraction {
  name: string;
  image: string;
  distance: string;
}

// Category type for image selection
export type TripCategory = 'Attraction' | 'Beaches' | 'Hotels' | 'Restaurants';

export interface Trip {
  city: string | undefined;
  _id: string;
  destination: string;
  country: string;
  dates: string;
  startDate: string;
  endDate: string;
  image?: string;           // Made optional - will be auto-assigned
  category?: TripCategory;  // Added for image categorization
  address?: string;
  description?: string;
  type?: string;
  lat?: number;
  lon?: number;
  weather: Weather;
  attractions: Attraction[];
  notes: string;
  preferences: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  budget?: {
    total: number;
    items: Array<{ label: string; amount: number }>;
  };
}

export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  feelsLike: string;
  icon: string;
}

export interface ForecastDay {
  date: string;
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  feelsLike: string;
  icon: string;
}