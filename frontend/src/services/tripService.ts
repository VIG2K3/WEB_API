// src/services/tripService.ts

import { Trip, Place } from "../types/trip";
import { getImageForTrip, determineCategory } from "./imageService";

const API_BASE = "/api";

const handleUnauthorized = (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Your session has expired. Please login again.");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");

  return token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : {
        "Content-Type": "application/json",
      };
};

const formatWeatherTemp = (value: unknown) => {
  if (typeof value === "number") return `${Math.round(value)}°C`;
  if (typeof value === "string" && value.trim().length > 0) return value;
  return "N/A";
};

const getWeatherIcon = (code: string | undefined) => {
  const iconMap: Record<string, string> = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "⛅",
    "02n": "☁️",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };

  if (!code) return "🌡️";
  return iconMap[code] ?? code;
};

const normalizeWeather = (current: any) => ({
  temp: formatWeatherTemp(current?.temp),
  condition: current?.condition || "Unknown",
  humidity: current?.humidity || "N/A",
  wind: current?.wind || "N/A",
  feelsLike: current?.feelsLike || "N/A",
  icon: getWeatherIcon(current?.icon),
});

const withImageAndCategory = (trip: Trip): Trip => ({
  ...trip,
  image: trip.image || getImageForTrip(trip),
  category: trip.category || determineCategory(trip.destination),
});

export const tripService = {
  getAllTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips`, {
      headers: authHeaders(),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to fetch trips");

    const trips = await response.json();
    return trips.map(withImageAndCategory);
  },

  getUpcomingTrips: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips/upcoming`, {
      headers: authHeaders(),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to fetch upcoming trips");

    const trips = await response.json();
    return trips.map(withImageAndCategory);
  },

  getTripById: async (id: string): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      headers: authHeaders(),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to fetch trip");

    const trip = await response.json();
    return withImageAndCategory(trip);
  },

  createTrip: async (tripData: Omit<Trip, "_id">): Promise<Trip> => {
    const category =
      tripData.category || determineCategory(tripData.destination || "");

    const response = await fetch(`${API_BASE}/trips`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        ...tripData,
        category,
      }),
    });

    handleUnauthorized(response);

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          `Failed to create trip (${response.status})`
      );
    }

    const createdTrip = payload as Trip;

    const image = getImageForTrip({
      _id: createdTrip._id,
      destination: createdTrip.destination,
      category,
    } as Trip);

    try {
      await tripService.updateTrip(createdTrip._id, { image });
    } catch {
      // Trip is already created, so don't break if image update fails.
    }

    return {
      ...createdTrip,
      image,
      category,
    };
  },

  updateTrip: async (id: string, tripData: Partial<Trip>): Promise<Trip> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(tripData),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to update trip");

    const updatedTrip = await response.json();
    return withImageAndCategory(updatedTrip);
  },

  updateTripStatus: async (
    id: string,
    status: Trip["status"]
  ): Promise<Trip> => {
    return tripService.updateTrip(id, { status });
  },

  deleteTrip: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to delete trip");
  },

  getFavourites: async (): Promise<Trip[]> => {
    const response = await fetch(`${API_BASE}/trips/favourites`, {
      headers: authHeaders(),
    });

    handleUnauthorized(response);

    if (!response.ok) throw new Error("Failed to fetch favourites");

    const trips = await response.json();
    return trips.map(withImageAndCategory);
  },

  saveFavouritePlace: async (place: Place): Promise<Trip> => {
    const tripData: Omit<Trip, "_id"> = {
      destination: place.name,
      country: "Penang, Malaysia",
      dates: "Favourite place",
      startDate: "",
      endDate: "",
      image: "",
      category: determineCategory(place.name),
      address: place.address || "",
      description: place.desc || "",
      type: place.type || "",
      lat: place.lat,
      lon: place.lon,
      weather: {
        temp: "N/A",
        condition: "Favourite",
        humidity: "",
        wind: "",
        feelsLike: "",
        icon: "❤️",
      },
      attractions: [],
      notes: `Saved as favourite from Penang Explorer: ${place.name}`,
      preferences: "",
      status: "upcoming",
      favourited: true,
      isFavouriteOnly: true,
      tripType: "single",
      stops: [
        {
          name: place.name,
          address: place.address || "",
          lat: place.lat,
          lon: place.lon,
          category: place.type || "",
        },
      ],
    };

    return tripService.createTrip(tripData);
  },

  toggleFavourite: async (id: string, favourited: boolean): Promise<Trip> => {
    return tripService.updateTrip(id, { favourited });
  },

  getTripWithWeather: async (id: string): Promise<Trip> => {
    const trip = await tripService.getTripById(id);

    try {
      const response = await fetch(`/api/trips/${id}/weather`, {
        headers: authHeaders(),
      });

      handleUnauthorized(response);

      if (response.ok) {
        const body = await response.json();
        const current = body.current || body;

        return {
          ...trip,
          weather: normalizeWeather(current),
          image: trip.image || getImageForTrip(trip),
        };
      }
    } catch (err) {
      console.warn("Weather fetch failed:", err);
    }

    return trip;
  },

  getAllTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getAllTrips();

    return Promise.all(
      trips.map(async (trip) => {
        try {
          const response = await fetch(`/api/trips/${trip._id}/weather`, {
            headers: authHeaders(),
          });

          handleUnauthorized(response);

          if (response.ok) {
            const body = await response.json();
            const current = body.current || body;

            return {
              ...trip,
              weather: normalizeWeather(current),
              image: trip.image || getImageForTrip(trip),
            };
          }
        } catch (err) {
          console.warn("Weather fetch failed for", trip._id, err);
        }

        return {
          ...trip,
          image: trip.image || getImageForTrip(trip),
        };
      })
    );
  },

  getUpcomingTripsWithWeather: async (): Promise<Trip[]> => {
    const trips = await tripService.getUpcomingTrips();

    return Promise.all(
      trips.map(async (trip) => {
        try {
          const response = await fetch(`/api/trips/${trip._id}/weather`, {
            headers: authHeaders(),
          });

          handleUnauthorized(response);

          if (response.ok) {
            const body = await response.json();
            const current = body.current || body;

            return {
              ...trip,
              weather: normalizeWeather(current),
              image: trip.image || getImageForTrip(trip),
            };
          }
        } catch (err) {
          console.warn("Weather fetch failed for", trip._id, err);
        }

        return {
          ...trip,
          image: trip.image || getImageForTrip(trip),
        };
      })
    );
  },

  refreshWeather: async (trip: Trip): Promise<Trip> => {
    try {
      const response = await fetch(
        `/api/trips/${trip._id}/weather?force=true`,
        {
          headers: authHeaders(),
        }
      );

      handleUnauthorized(response);

      if (response.ok) {
        const body = await response.json();
        const current = body.current || body;

        return {
          ...trip,
          weather: normalizeWeather(current),
          image: trip.image || getImageForTrip(trip),
        };
      }
    } catch (error) {
      console.error("Failed to refresh weather:", error);
    }

    return trip;
  },

  regenerateTripImage: async (tripId: string): Promise<Trip> => {
    const trip = await tripService.getTripById(tripId);
    const category = trip.category || determineCategory(trip.destination);

    const { getRandomImageForTrip } = await import("./imageService");
    const newImage = getRandomImageForTrip(category);

    return tripService.updateTrip(tripId, { image: newImage });
  },

  migrateAllTripsImages: async (): Promise<void> => {
    const trips = await tripService.getAllTrips();

    for (const trip of trips) {
      if (!trip.image) {
        const image = getImageForTrip(trip);
        await tripService.updateTrip(trip._id, { image });
      }

      if (!trip.category) {
        const category = determineCategory(trip.destination);
        await tripService.updateTrip(trip._id, { category });
      }
    }
  },
};