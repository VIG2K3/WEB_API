import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PenangExplorer.css';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const PENANG_CENTER = [5.3521, 100.3003] as [number, number];
const PENANG_BOUNDS = [[5.1956, 100.1594], [5.5354, 100.5049]] as [[number, number], [number, number]];

// ── Geoapify API Keys ─────────────────────────────────────────────────────────
const MAPTILES_KEY  = '0175ce7fba314872aa38c2313d753da9';
const ROUTING_KEY   = '38684479917a422ea7a4fb68c792ac57';
const GEOCODING_KEY = '1869c27597b74d26a0f69ca40cd61a55';

// ── Map Style URLs ────────────────────────────────────────────────────────────
const MAP_STYLES = {
  street:    `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${MAPTILES_KEY}`,
  dark:      `https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${MAPTILES_KEY}`,
  satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
};

const MAP_ATTRIBUTIONS = {
  street:    '© Geoapify | © OpenStreetMap contributors',
  dark:      '© Geoapify | © OpenStreetMap contributors',
  satellite: '© Esri, Maxar, Earthstar Geographics',
};

const CATEGORIES = [
  { key: 'tourism',    label: 'Attractions', emoji: '🏛️' },
  { key: 'restaurant', label: 'Restaurants', emoji: '🍜' },
  { key: 'hotel',      label: 'Hotels',      emoji: '🏨' },
  { key: 'beach',      label: 'Beaches',     emoji: '🏖️' },
];

const TRAVEL_MODES = [
  { key: 'drive',   label: 'Drive', emoji: '🚗' },
  { key: 'walk',    label: 'Walk',  emoji: '🚶' },
  { key: 'bicycle', label: 'Cycle', emoji: '🚴' },
];

// ── CUSTOM MARKER ICONS ───────────────────────────────────────────────────────
function makeIcon(emoji: string, color: string) {
  return L.divIcon({
    html: `<div style="
      background:${color};width:36px;height:36px;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2px solid #fff;">
      <span style="transform:rotate(45deg);font-size:16px">${emoji}</span>
    </div>`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -40],
  });
}

const ICONS: Record<string, L.DivIcon> = {
  tourism:    makeIcon('🏛️', '#0d9488'),
  restaurant: makeIcon('🍜', '#f59e0b'),
  hotel:      makeIcon('🏨', '#6366f1'),
  beach:      makeIcon('🏖️', '#06b6d4'),
  user:       makeIcon('📍', '#ef4444'),
  start:      makeIcon('🟢', '#22c55e'),
  end:        makeIcon('🏁', '#ef4444'),
};

// ── MAP HELPER COMPONENTS ─────────────────────────────────────────────────────

function ResetView({ trigger }: { trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger) map.setView(PENANG_CENTER, 12, { animate: true });
  }, [trigger, map]);
  return null;
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lon]));
    map.fitBounds(bounds.pad(0.15));
  }, [places, map]);
  return null;
}

function FlyToPlace({
  place,
  markerRefs,
}: {
  place: Place | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!place) return;
    map.flyTo([place.lat, place.lon], 16, { animate: true, duration: 1 });
    const key = place.id || place.name;
    setTimeout(() => {
      const marker = markerRefs.current[key];
      if (marker) marker.openPopup();
    }, 1100);
  }, [place, map, markerRefs]);
  return null;
}

function MapStyleUpdater({ styleUrl, attribution }: { styleUrl: string; attribution: string }) {
  const map = useMap();
  const tileRef = useRef<L.TileLayer | null>(null);
  useEffect(() => {
    if (tileRef.current) map.removeLayer(tileRef.current);
    const newTile = L.tileLayer(styleUrl, { attribution, maxZoom: 20, crossOrigin: true });
    newTile.setZIndex(1);
    newTile.addTo(map);
    tileRef.current = newTile;
  }, [styleUrl, map, attribution]);
  return null;
}

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface Place {
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
  website?: string;
}

interface RouteInfo {
  distKm: number;
  durMin: number;
}

interface LatLon {
  lat: number;
  lon: number;
}

interface PenangExplorerProps {
  onBack: () => void;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PenangExplorer({ onBack }: PenangExplorerProps) {
  const [places,        setPlaces]        = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [category,      setCategory]      = useState<string>('tourism');
  const [searchQuery,   setSearchQuery]   = useState<string>('');
  const [loading,       setLoading]       = useState<boolean>(false);
  const [error,         setError]         = useState<string>('');
  const [toast,         setToast]         = useState<string>('');
  const [mapStyle,      setMapStyle]      = useState<string>('street');
  const [resetView,     setResetView]     = useState<number>(0);

  // Route state
  const [fromText,       setFromText]       = useState<string>('');
  const [toText,         setToText]         = useState<string>('');
  const [travelMode,     setTravelMode]     = useState<string>('drive');
  const [routeCoords,    setRouteCoords]    = useState<[number, number][]>([]);
  const [routeInfo,      setRouteInfo]      = useState<RouteInfo | null>(null);
  const [routeEndpoints, setRouteEndpoints] = useState<{ from: LatLon; to: LatLon } | null>(null);

  const [userLocation, setUserLocation] = useState<LatLon | null>(null);

  const markerRefs  = useRef<Record<string, L.Marker>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchByCategory('tourism');
    // Fixed location: INTI International College Penang, Bukit Jambul
    setUserLocation({ lat: 5.3366, lon: 100.2832 });
  }, []);

  // ── SEARCH ────────────────────────────────────────────────────────────────
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current ?? undefined);
    if (!val.trim()) return;
    debounceRef.current = setTimeout(() => fetchSearch(val), 600);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      clearTimeout(debounceRef.current ?? undefined);
      fetchSearch(searchQuery);
    }
  };

  const fetchSearch = async (q: string) => {
    setLoading(true); setError(''); setPlaces([]);
    try {
      const res = await axios.get(`/api/search/places?q=${encodeURIComponent(q)}`);
      setPlaces(res.data.places);
      if (!res.data.places.length) setError('No results found in Penang.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fetchByCategory = async (cat: string) => {
    setLoading(true); setError(''); setPlaces([]); setCategory(cat);
    try {
      const res = await axios.get(`/api/search/places?category=${cat}`);
      setPlaces(res.data.places);
      if (!res.data.places.length) setError('No results found in Penang.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load places.');
    } finally { setLoading(false); }
  };

  // ── ROUTING ───────────────────────────────────────────────────────────────
  const geocode = async (text: string): Promise<LatLon> => {
    if (text.toLowerCase() === 'my location' && userLocation) return userLocation;
    try {
      const res = await axios.get(`/api/search/geocode?q=${encodeURIComponent(text)}`);
      return { lat: res.data.lat, lon: res.data.lon };
    } catch {
      const res = await axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: {
          text:   text + ' Penang Malaysia',
          lang:   'en',
          limit:  1,
          format: 'json',
          filter: 'rect:100.1594,5.1956,100.5049,5.5354',
          apiKey: GEOCODING_KEY,
        },
      });
      const result = res.data.results?.[0];
      if (!result) throw new Error('Location not found');
      return { lat: result.lat, lon: result.lon };
    }
  };

  const callRoutingAPI = async (
    fromLat: number, fromLon: number,
    toLat: number,   toLon: number,
    mode: string,
  ) => {
    const geoapifyMode = ({ drive: 'drive', walk: 'walk', bicycle: 'bicycle' } as Record<string, string>)[mode] || 'drive';
    const res = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${fromLat},${fromLon}|${toLat},${toLon}`,
        mode:      geoapifyMode,
        details:   'instruction_details',
        format:    'geojson',
        apiKey:    ROUTING_KEY,
      },
      timeout: 10000,
    });

    const features = res.data.features;
    if (!features || !features.length) throw new Error('No route found');

    const route  = features[0];
    const props  = route.properties;
    const distKm = (props.distance / 1000).toFixed(1);
    const durMin = Math.round(props.time / 60);

    let coordinates: [number, number][] = [];
    if (route.geometry.type === 'MultiLineString') {
      coordinates = route.geometry.coordinates.flat().map((c: number[]) => [c[1], c[0]] as [number, number]);
    } else {
      coordinates = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }

    return { distKm: parseFloat(distKm), durMin, coordinates };
  };

  const getRoute = async () => {
    if (!fromText.trim() || !toText.trim()) {
      showToast('Please enter both starting point and destination.'); return;
    }
    try {
      showToast('Finding route…');
      const [from, to] = await Promise.all([geocode(fromText), geocode(toText)]);
      const result = await callRoutingAPI(from.lat, from.lon, to.lat, to.lon, travelMode);
      setRouteCoords(result.coordinates);
      setRouteInfo({ distKm: result.distKm, durMin: result.durMin });
      setRouteEndpoints({ from, to });
      showToast(`Route: ${result.distKm} km, ~${result.durMin} min`);
    } catch (err: any) {
      showToast('Routing failed. Check your locations and try again.');
      console.error('Route error:', err.message);
    }
  };

  const routeToPlace = async (place: Place) => {
    setToText(place.name);
    if (userLocation) {
      setFromText('My Location');
      try {
        const result = await callRoutingAPI(userLocation.lat, userLocation.lon, place.lat, place.lon, travelMode);
        setRouteCoords(result.coordinates);
        setRouteInfo({ distKm: result.distKm, durMin: result.durMin });
        setRouteEndpoints({ from: userLocation, to: place });
        showToast(`Route: ${result.distKm} km, ~${result.durMin} min`);
      } catch {
        showToast('Routing failed. Try again.');
      }
    } else {
      showToast('Enter your starting point and click Get Route.');
    }
  };

  const clearRoute = () => {
    setRouteCoords([]); setRouteInfo(null); setRouteEndpoints(null);
  };

  // ── RESET ALL ─────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setSearchQuery('');
    setPlaces([]);
    setSelectedPlace(null);
    setError('');
    setToast('');
    setFromText('');
    setToText('');
    setTravelMode('drive');
    setRouteCoords([]);
    setRouteInfo(null);
    setRouteEndpoints(null);
    setMapStyle('street');
    setResetView(v => v + 1);
    fetchByCategory('tourism');
  };

  // ── TOAST ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const modeEmoji: Record<string, string> = { drive: '🚗', walk: '🚶', bicycle: '🚴' };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#555',
              background: 'none', border: 'none', cursor: 'pointer', marginRight: 12,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div className="logo-icon">🗺️</div>
          <div className="logo-text">Penang <span>Explorer</span></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="style-switcher">
            <button className={`style-btn ${mapStyle === 'street'    ? 'active' : ''}`} onClick={() => setMapStyle('street')}>🗺️ Street</button>
            <button className={`style-btn ${mapStyle === 'dark'      ? 'active' : ''}`} onClick={() => setMapStyle('dark')}>🌙 Dark</button>
            <button className={`style-btn ${mapStyle === 'satellite' ? 'active' : ''}`} onClick={() => setMapStyle('satellite')}>🛰️ Satellite</button>
          </div>
          <div className="header-badge">📍 Penang Island & Mainland</div>
        </div>
      </header>

      <div className="main">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-inner">

            <div className="section-label">Search Places</div>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="e.g. Penang Hill, Char Kway Teow…"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <div className="cat-tabs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className={`cat-btn ${category === cat.key && !searchQuery ? 'active' : ''}`}
                  onClick={() => { setSearchQuery(''); fetchByCategory(cat.key); }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* ROUTE SECTION */}
            <div className="route-section">
              <div className="section-label" style={{ color: '#0f766e', marginBottom: 12 }}>🧭 Get Directions</div>

              <div className="route-input">
                <div className="route-dot start" />
                <input type="text" placeholder="Starting point (or 'My Location')"
                  value={fromText} onChange={e => setFromText(e.target.value)} />
              </div>

              <div className="route-input">
                <div className="route-dot end" />
                <input type="text" placeholder="Destination"
                  value={toText} onChange={e => setToText(e.target.value)} />
              </div>

              <div className="travel-mode">
                {TRAVEL_MODES.map(m => (
                  <button key={m.key}
                    className={`mode-btn ${travelMode === m.key ? 'active' : ''}`}
                    onClick={() => setTravelMode(m.key)}>
                    {m.emoji}<span>{m.label}</span>
                  </button>
                ))}
              </div>

              <button className="route-btn" onClick={getRoute}>Get Route</button>

              {routeInfo && (
                <>
                  <div className="route-info">
                    {modeEmoji[travelMode]} <strong>{routeInfo.distKm} km</strong> &nbsp;•&nbsp; ~{routeInfo.durMin} min
                  </div>
                  <button className="clear-route-btn" onClick={clearRoute}>✕ Clear Route</button>
                </>
              )}
            </div>

            <div className="divider" />

            <div className="results-header">
              <div className="section-label" style={{ margin: 0 }}>Results</div>
              {places.length > 0 && <div className="results-count">{places.length} found</div>}
            </div>

            {loading && <div className="loading"><div className="spinner" />Searching in Penang…</div>}
            {error && !loading && <div className="empty-state"><div className="empty-icon">😕</div>{error}</div>}
            {!loading && !error && places.length === 0 && (
              <div className="empty-state"><div className="empty-icon">🌴</div>Search or select a category to explore Penang.</div>
            )}

            {!loading && places.map((place, i) => (
              <div
                key={place.id || i}
                className={`place-card ${selectedPlace?.id === place.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlace(place)}
              >
                <div className="place-type">{place.type || category}</div>
                <div className="place-name">{place.name}</div>
                {place.desc && <div className="place-desc">"{place.desc}"</div>}
                <div className="place-addr">📍 {place.address}</div>
                {place.cuisine      && <div className="place-tag">🍽️ {place.cuisine}</div>}
                {place.opening_hours && <div className="place-tag">🕐 {place.opening_hours}</div>}
                <div className="card-actions">
                  <button className="card-btn btn-route"
                    onClick={e => { e.stopPropagation(); routeToPlace(place); }}>
                    🧭 Route
                  </button>
                </div>
              </div>
            ))}

          </div>
        </aside>

        {/* MAP */}
        <div className="map-wrapper">
          <button className="reset-view-btn" onClick={handleRefresh} title="Reset everything">
            🔄 Refresh
          </button>

          <MapContainer
            center={PENANG_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            maxBounds={PENANG_BOUNDS}
            maxBoundsViscosity={0.8}
          >
            <MapStyleUpdater
              styleUrl={(MAP_STYLES as Record<string, string>)[mapStyle]}
              attribution={(MAP_ATTRIBUTIONS as Record<string, string>)[mapStyle]}
            />
            <FitBounds places={places} />
            <FlyToPlace place={selectedPlace} markerRefs={markerRefs} />
            <ResetView trigger={resetView} />

            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lon]} icon={ICONS.user}>
                <Popup><b>📍 You are here</b></Popup>
              </Marker>
            )}

            {places.map((place, i) => (
              <Marker
                key={place.id || i}
                position={[place.lat, place.lon]}
                icon={ICONS[category] || ICONS.tourism}
                ref={(el: L.Marker | null) => {
                  if (el) markerRefs.current[place.id || place.name] = el;
                }}
              >
                <Popup>
                  <div className="popup-title">{place.name}</div>
                  <div className="popup-type">{place.type || category}</div>
                  {place.desc    && <div className="popup-desc">"{place.desc}"</div>}
                  <div className="popup-addr">📍 {place.address}</div>
                  {place.phone   && <div className="popup-detail">📞 {place.phone}</div>}
                  {place.website && (
                    <div className="popup-detail">
                      🌐 <a href={place.website} target="_blank" rel="noreferrer">Website</a>
                    </div>
                  )}
                  <button className="popup-route-btn" onClick={() => routeToPlace(place)}>
                    🧭 Get Directions
                  </button>
                </Popup>
              </Marker>
            ))}

            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} color="#0d9488" weight={5} opacity={0.85} />
            )}

            {routeEndpoints && (
              <>
                <Marker position={[routeEndpoints.from.lat, routeEndpoints.from.lon]} icon={ICONS.start}>
                  <Popup>🟢 Starting Point</Popup>
                </Marker>
                <Marker position={[routeEndpoints.to.lat, routeEndpoints.to.lon]} icon={ICONS.end}>
                  <Popup>🏁 Destination</Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
