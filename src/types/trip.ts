// src/types/trip.ts
// Centralized TypeScript types for trip-related data structures

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

export interface Trip {
  _id: string;
  city: string;
  country: string;
  dates: string;
  startDate: string;
  endDate: string;
  image: string;
  weather: Weather;
  attractions: Attraction[];
  notes: string;
  preferences: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export type TripStatus = 'upcoming' | 'ongoing' | 'completed';