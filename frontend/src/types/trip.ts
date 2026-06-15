// src/types/trip.ts

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

export interface TripStop {
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
  category?: string;
}

export type TripCategory = "Attraction" | "Beaches" | "Hotels" | "Restaurants";
export type TripStatus = "upcoming" | "ongoing" | "completed";

export interface Trip {
  _id: string;
  city?: string;
  destination: string;
  country: string;
  dates: string;
  startDate: string;
  endDate: string;
  image?: string;
  category?: TripCategory;
  address?: string;
  description?: string;
  type?: string;
  lat?: number;
  lon?: number;
  weather: Weather;
  attractions: Attraction[];
  notes: string;
  preferences: string;
  status: TripStatus;

  // Favourites
  favourited?: boolean;
  isFavouriteOnly?: boolean;

  // Multi-stop trips
  tripType?: "single" | "multi";
  stops?: TripStop[];

  budget?: {
    total: number;
    items: Array<{
      label: string;
      amount: number;
    }>;
  };
}

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