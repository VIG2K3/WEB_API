// src/services/tripService.ts
// Centralized API calls related to trips (your own backend)

import { Trip, TripCategory } from '../types/trip';
import { getImageForTrip, determineCategory } from './imageService';

// Your backend API URL
const API_BASE = '/api';

const formatWeatherTemp = (value: unknown) => {
  if (typeof value === 'number') return `${Math.round(value)}°C`;
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return 'N/A';
};

const getWeatherIcon = (code: string | undefined) => {
  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  if (!code) return '🌡️';
  return iconMap[code] ?? code;
};

const normalizeWeather = (current: any) => ({
  temp: formatWeatherTemp(current?.temp),
  condition: current?.condition || 'Unknown',
  humidity: current?.humidity || 'N/A',
  wind: current?.wind || 'N/A',
  feelsLike: current?.feelsLike || 'N/A',
  icon: getWeatherIcon(current?.icon),
});

export const tripService = {
  // ========== BASIC CRUD OPERATIONS ==========

  // Get all trips
  getAllTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips`);
    if (!response.ok) throw new Error('Failed to fetch trips');
    const trips = await response.json();
    
    // Ensure each trip has an image and category (for backward compatibility)
    return trips.map((trip: Trip) => ({
      ...trip,
      image: trip.image || getImageForTrip(trip),
      category: trip.category || determineCategory(trip.destination)
    }));
  },

  // Get upcoming trips only
  getUpcomingTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips/upcoming`);
    if (!response.ok) throw new Error('Failed to fetch upcoming trips');
    const trips = await response.json();
    
    // Ensure each trip has an image and category
    return trips.map((trip: Trip) => ({
      ...trip,
      image: trip.image || getImageForTrip(trip),
      category: trip.category || determineCategory(trip.destination)
    }));
  },

  // Get single trip by ID
  getTripById: async (id: string): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`);
    if (!response.ok) throw new Error('Failed to fetch trip');
    const trip = await response.json();
    
    // Ensure trip has an image and category
    return {
      ...trip,
      image: trip.image || getImageForTrip(trip),
      category: trip.category || determineCategory(trip.destination)
    };
  },

  // Create new trip (UPDATED to auto-assign category and image)
  createTrip: async (tripData: Omit<Trip, '_id'>): Promise<Trip> => {
    // Auto-determine category if not provided
    const category = tripData.category || determineCategory(tripData.destination || '');
    
    // Create trip data without image first (to get ID from backend)
    const tripWithoutImage = { ...tripData, category };
    
    const response = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripWithoutImage),
    });
    
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Failed to create trip (${response.status})`);
    }
    
    const createdTrip = payload as Trip;
    
    // Now assign image based on the created trip ID
    const image = getImageForTrip({ 
      _id: createdTrip._id, 
      destination: createdTrip.destination,
      category 
    });
    
    // Update the trip with the image
    const updatedTrip = { ...createdTrip, image };
    
    // Save the image to the backend
    await tripService.updateTrip(createdTrip._id, { image });
    
    return updatedTrip;
  },

  // Update trip
  updateTrip: async (id: string, tripData: Partial<Trip>): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });
    if (!response.ok) throw new Error('Failed to update trip');
    const updatedTrip = await response.json();
    
    // Ensure updated trip has image
    return {
      ...updatedTrip,
      image: updatedTrip.image || getImageForTrip(updatedTrip),
    };
  },

  // Update trip status
  updateTripStatus: async (id: string, status: Trip['status']): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update trip status');
    const updatedTrip = await response.json();
    
    return {
      ...updatedTrip,
      image: updatedTrip.image || getImageForTrip(updatedTrip),
    };
  },

  // Delete trip
  deleteTrip: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete trip');
  },

  // ========== WEATHER-ENHANCED METHODS ==========

  // Get trip with REAL weather from OpenWeatherMap
  getTripWithWeather: async (id: string): Promise<Trip> => {
    const trip = await tripService.getTripById(id);
    try {
      const resp = await fetch(`/api/trips/${id}/weather`);
      if (resp.ok) {
        const body = await resp.json();
        const current = body.current || body;
        return { 
          ...trip, 
          weather: normalizeWeather(current),
          image: trip.image || getImageForTrip(trip),
        };
      }
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    }
    return trip;
  },

  // Get all trips with real weather data
  getAllTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getAllTrips();
    // Fetch weather for each trip from backend in parallel (cached server-side)
    const results = await Promise.all(trips.map(async (t) => {
      try {
        const r = await fetch(`/api/trips/${t._id}/weather`);
        if (r.ok) {
          const b = await r.json();
          const current = b.current || b;
          return { 
            ...t, 
            weather: normalizeWeather(current),
            image: t.image || getImageForTrip(t),
          };
        }
      } catch (err) {
        console.warn('Weather fetch failed for', t._id, err);
      }
      return {
        ...t,
        image: t.image || getImageForTrip(t),
      };
    }));
    return results;
  },

  // Get upcoming trips with real weather
  getUpcomingTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getUpcomingTrips();
    const results = await Promise.all(trips.map(async (t) => {
      try {
        const r = await fetch(`/api/trips/${t._id}/weather`);
        if (r.ok) {
          const b = await r.json();
          const current = b.current || b;
          return { 
            ...t, 
            weather: normalizeWeather(current),
            image: t.image || getImageForTrip(t),
          };
        }
      } catch (err) {
        console.warn('Weather fetch failed for', t._id, err);
      }
      return {
        ...t,
        image: t.image || getImageForTrip(t),
      };
    }));
    return results;
  },

  // Refresh weather for a specific trip
  refreshWeather: async (trip: Trip): Promise<Trip> => {
    try {
      const r = await fetch(`/api/trips/${trip._id}/weather?force=true`);
      if (r.ok) {
        const b = await r.json();
        const current = b.current || b;
        return { 
          ...trip, 
          weather: normalizeWeather(current),
          image: trip.image || getImageForTrip(trip),
        };
      }
      return trip;
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      return trip;
    }
  },
  
  // ========== NEW: IMAGE MANAGEMENT METHODS ==========
  
  // Regenerate image for a specific trip (useful if user wants to change image)
  regenerateTripImage: async (tripId: string): Promise<Trip> => {
    const trip = await tripService.getTripById(tripId);
    const category = trip.category || determineCategory(trip.destination);
    
    // Get a new random image for this category
    const { getRandomImageForTrip } = await import('./imageService');
    const newImage = getRandomImageForTrip(category);
    
    // Update the trip with new image
    const updatedTrip = await tripService.updateTrip(tripId, { image: newImage });
    return updatedTrip;
  },
  
  // Migrate all existing trips to have images (run once)
  migrateAllTripsImages: async (): Promise<void> => {
    const trips = await tripService.getAllTrips();
    for (const trip of trips) {
      if (!trip.image) {
        const image = getImageForTrip(trip);
        await tripService.updateTrip(trip._id, { image });
        console.log(`✅ Added image to trip: ${trip.destination}`);
      }
      if (!trip.category) {
        const category = determineCategory(trip.destination);
        await tripService.updateTrip(trip._id, { category });
        console.log(`✅ Added category to trip: ${trip.destination} -> ${category}`);
      }
    }
    console.log(`🎉 Migration complete! Processed ${trips.length} trips.`);
  }
};