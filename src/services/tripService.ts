// src/services/tripService.ts
// Centralized API calls related to trips (your own backend)

import { Trip } from '../types/trip';
import { weatherService, WeatherData } from './weatherServices';

// Your backend API URL
const API_BASE = 'http://localhost:5000/api';

export const tripService = {
  // ========== BASIC CRUD OPERATIONS ==========

  // Get all trips
  getAllTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips`);
    if (!response.ok) throw new Error('Failed to fetch trips');
    return response.json();
  },

  // Get upcoming trips only
  getUpcomingTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips/upcoming`);
    if (!response.ok) throw new Error('Failed to fetch upcoming trips');
    return response.json();
  },

  // Get single trip by ID
  getTripById: async (id: string): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`);
    if (!response.ok) throw new Error('Failed to fetch trip');
    return response.json();
  },

  // Create new trip
  createTrip: async (tripData: Omit<Trip, '_id'>): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });
    if (!response.ok) throw new Error('Failed to create trip');
    return response.json();
  },

  // Update trip
  updateTrip: async (id: string, tripData: Partial<Trip>): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });
    if (!response.ok) throw new Error('Failed to update trip');
    return response.json();
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
    
    // Get real weather for the trip's city
    const weather = await weatherService.getCurrentWeather(trip.city, trip.country);
    
    return {
      ...trip,
      weather
    };
  },

  // Get all trips with real weather data
  getAllTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getAllTrips();
    
    // Get weather for all unique cities
    const cities = [...new Set(trips.map(trip => trip.city))];
    const weatherData = await weatherService.getMultipleWeather(cities);
    
    // Update each trip with its weather
    return trips.map(trip => ({
      ...trip,
      weather: weatherData[trip.city] || trip.weather
    }));
  },

  // Get upcoming trips with real weather
  getUpcomingTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getUpcomingTrips();
    
    // Add weather to each trip
    const tripsWithWeather = await Promise.all(
      trips.map(async (trip) => {
        try {
          const weather = await weatherService.getCurrentWeather(trip.city, trip.country);
          return { ...trip, weather };
        } catch (error) {
          console.error(`Weather failed for ${trip.city}:`, error);
          return trip; // Keep existing weather as fallback
        }
      })
    );
    
    return tripsWithWeather;
  },

  // Refresh weather for a specific trip
  refreshWeather: async (trip: Trip): Promise<Trip> => {
    try {
      const newWeather = await weatherService.getCurrentWeather(trip.city, trip.country);
      return { ...trip, weather: newWeather };
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      return trip;
    }
  }
};