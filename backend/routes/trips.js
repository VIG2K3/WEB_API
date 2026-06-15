const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Trip = require("../models/Trip");
const User = require("../models/User");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment variables");

// ── Auth middleware ──
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ── Weather cache ──
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 1000 * 60 * 30;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const iconCodeToEmoji = (code) => {
  const map = {
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

  return map[code] || "🌡️";
};

const normalizeTrip = (trip) => {
  const data =
    trip && typeof trip.toObject === "function"
      ? trip.toObject({ virtuals: true })
      : { ...trip };

  if (!data.destination && data.city) data.destination = data.city;
  return data;
};


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildRoutePlanHtml(trip) {
  const stops = Array.isArray(trip.stops) && trip.stops.length > 0
    ? trip.stops
    : [
        {
          name: trip.destination,
          address: trip.address || trip.country || 'Penang, Malaysia',
          category: trip.type || trip.category || '',
        },
      ];

  if (!stops.length) {
    return '<p style="margin:6px 0;color:#777">No route plan added.</p>';
  }

  return `
    <div style="margin-top:12px">
      <p style="margin:0 0 8px;color:#1a1a2e"><strong>Route Plan:</strong></p>
      <div style="border-left:3px solid #3e84f6;padding-left:12px">
        ${stops
          .map((stop, index) => `
            <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
              <p style="margin:0;color:#111827">
                <strong>${index + 1}. ${escapeHtml(stop.name || 'Unnamed stop')}</strong>
              </p>
              <p style="margin:4px 0 0;color:#64748b;font-size:13px">
                ${escapeHtml(stop.address || 'Penang, Malaysia')}
              </p>
              ${stop.category ? `<p style="margin:4px 0 0;color:#3e84f6;font-size:12px">${escapeHtml(stop.category)}</p>` : ''}
            </div>
          `)
          .join('')}
      </div>
    </div>
  `;
}

const deriveTripStatus = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (!start && !end) return "upcoming";
  if (start && !end) return today < start ? "upcoming" : today > start ? "completed" : "ongoing";
  if (!start && end) return today > end ? "completed" : "upcoming";
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "ongoing";
};

// ── Weather route ──
router.get("/:id/weather", async (req, res) => {
  try {
    const tripId = req.params.id;
    const now = Date.now();
    const forceRefresh = req.query.force === "true";
    const cached = weatherCache.get(tripId);

    if (!forceRefresh && cached && now - cached.ts < WEATHER_CACHE_TTL_MS) {
      return res.json({ fromCache: true, ...cached.data });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    let lat = trip.lat;
    let lon = trip.lon;
    const destinationName = trip.destination || trip.city;

    if ((!lat || !lon) && OPENWEATHER_KEY) {
      const q = `${destinationName}${trip.country ? "," + trip.country : ""}`;
      const geoRes = await fetch(
        `${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_KEY}`
      );

      if (geoRes.ok) {
        const geo = await geoRes.json();

        if (Array.isArray(geo) && geo.length > 0) {
          lat = geo[0].lat;
          lon = geo[0].lon;

          try {
            await Trip.findByIdAndUpdate(tripId, { lat, lon });
          } catch {}
        }
      }
    }

    if (!lat || !lon) {
      return res.json({
        fromCache: false,
        current: trip.weather,
        daily: [],
      });
    }

    if (!OPENWEATHER_KEY) {
      return res.status(500).json({ error: "Server missing OPENWEATHER_API_KEY" });
    }

    const currentRes = await fetch(
      `${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`
    );

    if (!currentRes.ok) throw new Error("Current weather fetch failed");

    const currentData = await currentRes.json();

    const current = {
      temp: `${Math.round(currentData.main.temp)}°C`,
      condition: currentData.weather?.[0]?.main || "Unknown",
      humidity: `${currentData.main.humidity}%`,
      wind: `${Math.round((currentData.wind?.speed ?? 0) * 3.6)} km/h`,
      feelsLike: `${Math.round(currentData.main.feels_like)}°C`,
      icon: iconCodeToEmoji(currentData.weather?.[0]?.icon || ""),
    };

    const forecastRes = await fetch(
      `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`
    );

    if (!forecastRes.ok) throw new Error("Forecast fetch failed");

    const forecastData = await forecastRes.json();
    const seen = new Set();

    const daily = forecastData.list
      .filter((item) => {
        const d = item.dt_txt.split(" ")[0];

        if (!seen.has(d)) {
          seen.add(d);
          return true;
        }

        return false;
      })
      .slice(0, 5)
      .map((item) => ({
        date: item.dt_txt.split(" ")[0],
        temp: `${Math.round(item.main.temp)}°C`,
        condition: item.weather?.[0]?.main || "Unknown",
        humidity: `${item.main.humidity}%`,
        wind: `${Math.round((item.wind?.speed ?? 0) * 3.6)} km/h`,
        feelsLike: `${Math.round(item.main.feels_like)}°C`,
        icon: iconCodeToEmoji(item.weather?.[0]?.icon || ""),
      }));

    const payload = { current, daily };
    weatherCache.set(tripId, { ts: now, data: payload });

    res.json({ fromCache: false, ...payload });
  } catch (err) {
    console.error("Weather endpoint error:", err.message || err);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// ── All routes below require login ──
router.use(requireAuth);

// POST /api/trips/send-email-reminders
router.post("/send-email-reminders", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.email) {
      return res.status(404).json({ message: "User email not found" });
    }

    const today = new Date();

    const requestedTripIds = Array.isArray(req.body.tripIds)
  ? req.body.tripIds
  : [];

const tripFilter = {
  userId: req.user.id,
  isFavouriteOnly: { $ne: true },
  status: { $in: ["upcoming", "ongoing"] },
};

if (requestedTripIds.length > 0) {
  tripFilter._id = { $in: requestedTripIds };
}

const trips = await Trip.find(tripFilter);

    const reminderTrips = trips.filter((trip) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = trip.startDate ? new Date(trip.startDate) : null;
      const end = trip.endDate ? new Date(trip.endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      if (!start) return false;

      const diffDays = Math.ceil(
      (start.getTime() - today.getTime()) / 86400000
      );

      const startsSoon = diffDays >= 0 && diffDays <= 7;
      const isOngoing = start <= today && end && today <= end;

      return startsSoon || isOngoing;
    });

    if (reminderTrips.length === 0) {
      return res.json({
        message: "No upcoming trips to email.",
        count: 0,
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: "Email credentials are missing in .env",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const tripHtml = reminderTrips
      .map((trip) => {
        const routePlanHtml = buildRoutePlanHtml(trip);

        return `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:14px;background:#ffffff">
            <h3 style="margin:0 0 10px;color:#1a1a2e">${escapeHtml(trip.destination)}</h3>
            <p><strong>Country:</strong> ${escapeHtml(trip.country || "Penang, Malaysia")}</p>
            <p><strong>Start Date:</strong> ${escapeHtml(trip.startDate || "Not set")}</p>
            <p><strong>End Date:</strong> ${escapeHtml(trip.endDate || "Not set")}</p>
            <p><strong>Budget:</strong> RM ${Number(trip.budget?.total || 0).toLocaleString()}</p>
            <p><strong>Status:</strong> ${escapeHtml(trip.status || "upcoming")}</p>
            <p><strong>Notes:</strong> ${escapeHtml(trip.notes || "No notes added")}</p>
            ${routePlanHtml}
          </div>
        `;
      })
      .join("");

    await transporter.sendMail({
      from: `"Travel Smart Penang" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Upcoming Trip Reminder ✈️",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8fafc">
          <h2 style="color:#1a1a2e">Upcoming Trip Reminder ✈️</h2>
          <p style="color:#555">
            Here are your upcoming trips within the next 7 days:
          </p>
          ${tripHtml}
          <p style="color:#777;font-size:13px;margin-top:20px">
            Have a great trip! — Travel Smart Penang
          </p>
        </div>
      `,
    });

    res.json({
      message: "Email reminder sent successfully.",
      count: reminderTrips.length,
    });
  } catch (err) {
    console.error("Email reminder error:", err);
    res.status(500).json({
      message: "Failed to send email reminder.",
    });
  }
});

// GET /api/trips/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const filter = {
      userId: req.user.id,
      status: "upcoming",
    };

    const trips = await Trip.find(filter);
    res.json(trips.map(normalizeTrip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming trips" });
  }
});

// GET /api/trips
router.get("/", async (req, res) => {
  try {
    const filter = {
      userId: req.user.id,
    };

    const trips = await Trip.find(filter);
    res.json(trips.map(normalizeTrip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// GET /api/trips/favourites
router.get("/favourites", async (req, res) => {
  try {
    const filter = {
      userId: req.user.id,
      favourited: true,
    };

    const trips = await Trip.find(filter).sort({ updatedAt: -1 });
    res.json(trips.map(normalizeTrip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch favourites" });
  }
});

// GET /api/trips/:id
router.get("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId && trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(normalizeTrip(trip));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

// POST /api/trips
router.post("/", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      userId: req.user.id,
    };

    payload.status = deriveTripStatus(payload.startDate, payload.endDate);

    if ((!payload.lat || !payload.lon) && OPENWEATHER_KEY) {
      try {
        const q = `${payload.destination || payload.city}${payload.country ? "," + payload.country : ""}`;

        const geoRes = await fetch(
          `${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_KEY}`
        );

        if (geoRes.ok) {
          const geo = await geoRes.json();

          if (Array.isArray(geo) && geo.length > 0) {
            payload.lat = geo[0].lat;
            payload.lon = geo[0].lon;
          }
        }
      } catch (gerr) {
        console.warn("Geocoding failed:", gerr.message);
      }
    }

    const trip = new Trip(payload);
    await trip.save();

    res.status(201).json(normalizeTrip(trip));
  } catch (err) {
    console.error("Create trip error:", err);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

// PUT /api/trips/:id
router.put("/:id", async (req, res) => {
  try {
    const existingTrip = await Trip.findById(req.params.id);

    if (!existingTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (existingTrip.userId && existingTrip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updateData = { ...req.body };

    if (!req.body.status) {
      const startDate = req.body.startDate ?? existingTrip.startDate;
      const endDate = req.body.endDate ?? existingTrip.endDate;
      updateData.status = deriveTripStatus(startDate, endDate);
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json(normalizeTrip(trip));
  } catch (err) {
    res.status(500).json({ error: "Failed to update trip" });
  }
});

// DELETE /api/trips/:id
router.delete("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId && trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await trip.deleteOne();

    res.json({ message: "Trip deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

module.exports = router;