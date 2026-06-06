const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const fetch = require('node-fetch');

// Simple in-memory cache for weather per tripId
const weatherCache = new Map(); // tripId -> { ts: number, data: any }
const WEATHER_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const iconCodeToEmoji = (code) => {
  const map = {
    '01d': '☀️','01n':'🌙','02d':'⛅','02n':'☁️','03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
    '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️','11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️','50d':'🌫️','50n':'🌫️'
  };
  return map[code] || '🌡️';
};

const normalizeTrip = (trip) => {
  const data = trip && typeof trip.toObject === 'function' ? trip.toObject({ virtuals: true }) : { ...trip };
  if (!data.destination && data.city) {
    data.destination = data.city;
  }
  return data;
};

// GET /api/trips/:id/weather - return current + 5-day forecast (cached)
router.get('/:id/weather', async (req, res) => {
  try {
    const tripId = req.params.id;
    const now = Date.now();
    const forceRefresh = req.query.force === 'true';

    // Check cache
    const cached = weatherCache.get(tripId);
    if (!forceRefresh && cached && (now - cached.ts) < WEATHER_CACHE_TTL_MS) {
      return res.json({ fromCache: true, ...cached.data });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    let lat = trip.lat;
    let lon = trip.lon;

    const destinationName = trip.destination || trip.city;

    // Geocode if no coords
    if ((!lat || !lon) && OPENWEATHER_KEY) {
      const q = `${destinationName}${trip.country ? ',' + trip.country : ''}`;
      const geoRes = await fetch(`${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_KEY}`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (Array.isArray(geo) && geo.length > 0) {
          lat = geo[0].lat;
          lon = geo[0].lon;
          try { await Trip.findByIdAndUpdate(tripId, { lat, lon }); } catch(e){}
        }
      }
    }

    if (!lat || !lon) {
      return res.json({ fromCache: false, current: trip.weather, daily: [] });
    }

    if (!OPENWEATHER_KEY) return res.status(500).json({ error: 'Server missing OPENWEATHER_API_KEY' });

    // Fetch current weather
    const currentRes = await fetch(`${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`);
    if (!currentRes.ok) throw new Error('Current weather fetch failed');
    const currentData = await currentRes.json();

    const current = {
      temp: `${Math.round(currentData.main.temp)}°C`,
      condition: currentData.weather?.[0]?.main || 'Unknown',
      humidity: `${currentData.main.humidity}%`,
      wind: `${Math.round((currentData.wind?.speed ?? 0) * 3.6)} km/h`,
      feelsLike: `${Math.round(currentData.main.feels_like)}°C`,
      icon: iconCodeToEmoji(currentData.weather?.[0]?.icon || '')
    };

    // Fetch 5-day forecast (every 3 hours → get one per day)
    const forecastRes = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`);
    if (!forecastRes.ok) throw new Error('Forecast fetch failed');
    const forecastData = await forecastRes.json();

    // Get one entry per day (at noon)
    const seen = new Set();
    const daily = forecastData.list
      .filter(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!seen.has(date)) { seen.add(date); return true; }
        return false;
      })
      .slice(0, 5)
      .map(item => ({
        date: item.dt_txt.split(' ')[0],
        temp: `${Math.round(item.main.temp)}°C`,
        condition: item.weather?.[0]?.main || 'Unknown',
        humidity: `${item.main.humidity}%`,
        wind: `${Math.round((item.wind?.speed ?? 0) * 3.6)} km/h`,
        feelsLike: `${Math.round(item.main.feels_like)}°C`,
        icon: iconCodeToEmoji(item.weather?.[0]?.icon || '')
      }));

    const payload = { current, daily };
    weatherCache.set(tripId, { ts: now, data: payload });
    res.json({ fromCache: false, ...payload });

  } catch (err) {
    console.error('Weather endpoint error:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const trips = await Trip.find({ status: 'upcoming' });
    res.json(trips.map(normalizeTrip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming trips" });
  }
});

router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips.map(normalizeTrip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(normalizeTrip(trip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

const deriveTripStatus = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (!start && !end) return 'upcoming';
  if (start && !end) {
    if (today < start) return 'upcoming';
    if (today > start) return 'completed';
    return 'ongoing';
  }
  if (!start && end) {
    if (today > end) return 'completed';
    return 'upcoming';
  }
  if (today < start) return 'upcoming';
  if (today > end) return 'completed';
  return 'ongoing';
};

router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.status = deriveTripStatus(payload.startDate, payload.endDate);

    // If lat/lon not provided, try to geocode using OpenWeatherMap
    if ((!payload.lat || !payload.lon) && OPENWEATHER_KEY) {
      try {
        const destinationName = payload.destination || payload.city;
        const q = `${destinationName}${payload.country ? ',' + payload.country : ''}`;
        const geoRes = await fetch(`${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_KEY}`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (Array.isArray(geo) && geo.length > 0) {
            payload.lat = geo[0].lat;
            payload.lon = geo[0].lon;
          }
        }
      } catch (gerr) {
        console.warn('Geocoding failed on server:', gerr.message || gerr);
      }
    }

    const trip = new Trip(payload);
    await trip.save();
    res.status(201).json(normalizeTrip(trip));
  } catch (err) {
    res.status(500).json({ error: "Failed to create trip" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.status(404).json({ error: "Trip not found" });

    const updateData = { ...req.body };

    // If status is explicitly provided in the request (e.g. manual "completed"),
    // trust it and skip auto-derive. Otherwise recalculate from dates.
    if (!req.body.status) {
      const startDate = req.body.startDate ?? existingTrip.startDate;
      const endDate = req.body.endDate ?? existingTrip.endDate;
      updateData.status = deriveTripStatus(startDate, endDate);
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(normalizeTrip(trip));
  } catch (err) {
    res.status(500).json({ error: "Failed to update trip" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json({ message: "Trip deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

module.exports = router;
