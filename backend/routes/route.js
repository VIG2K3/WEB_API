require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

// ── Geoapify Routing API Key from .env ────────────────────────────────────────
const ROUTING_API_KEY = process.env.ROUTING_API_KEY;

// ── GET /api/route?fromLat=&fromLon=&toLat=&toLon=&mode=drive ─────────────────
router.get('/', async (req, res) => {
  const { fromLat, fromLon, toLat, toLon, mode } = req.query;

  if (!fromLat || !fromLon || !toLat || !toLon) {
    return res.status(400).json({
      error: 'fromLat, fromLon, toLat, toLon are all required'
    });
  }

  const fLat = parseFloat(fromLat);
  const fLon = parseFloat(fromLon);
  const tLat = parseFloat(toLat);
  const tLon = parseFloat(toLon);

  if ([fLat, fLon, tLat, tLon].some(isNaN)) {
    return res.status(400).json({ error: 'Coordinates must be valid numbers' });
  }

  // ── Map travel mode to Geoapify mode ─────────────────────────────────────
  const geoapifyMode = getGeoapifyMode(mode);

  try {
    // CONNECTION: https://api.geoapify.com/v1/routing
    const response = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${fLat},${fLon}|${tLat},${tLon}`,
        mode:      geoapifyMode,                  // ← drive / walk / bicycle
        details:   'instruction_details',
        format:    'geojson',
        apiKey:    ROUTING_API_KEY,               // ← Routing API key
      },
      timeout: 10000,
    });

    const features = response.data.features;
    if (!features || features.length === 0) {
      return res.status(404).json({ error: 'No route found between these points' });
    }

    const route = features[0];
    const props = route.properties;

    // Extract distance and duration
    const distKm  = (props.distance / 1000).toFixed(1);
    const durMin  = Math.round(props.time / 60);

    // Extract route coordinates for drawing the line on map
    const coordinates = route.geometry.coordinates.map(c => ({
      lat: c[1],
      lon: c[0],
    }));

    res.json({
      success:     true,
      distanceKm:  parseFloat(distKm),
      durationMin: durMin,
      mode:        geoapifyMode,
      coordinates,
    });

  } catch (err) {
    console.error('Geoapify routing error:', err.response?.data || err.message);
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Routing timed out. Please try again.' });
    }
    res.status(502).json({ error: 'Routing failed. Try again.' });
  }
});

// ── Map frontend mode → Geoapify mode string ─────────────────────────────────
function getGeoapifyMode(mode) {
  const modes = {
    drive:   'drive',
    walk:    'walk',
    bicycle: 'bicycle',
  };
  return modes[mode] || 'drive';
}

module.exports = router;
