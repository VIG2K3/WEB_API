import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { tripService } from './services/tripService';
import type { Trip, Place, Attraction } from './types/trip';
import AddTripModal from './components/AddTripModal';
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

// ── HARDCODED PENANG PLACES FOR LOCAL SEARCH SUGGESTIONS ──────────────────────
const FAMOUS_PLACES_FRONTEND = {
  tourism: [
    { name: 'Penang War Museum',            address: 'Bukit Batu Maung, Bayan Lepas',            lat: 5.2872, lon: 100.2726 },
    { name: 'Kek Lok Si Temple',            address: 'Air Itam, 11500 Penang',                   lat: 5.3997, lon: 100.2728 },
    { name: 'Penang Hill (Bukit Bendera)',  address: 'Bukit Bendera, 11300 Penang',              lat: 5.4208, lon: 100.2698 },
    { name: 'Fort Cornwallis',              address: 'Lebuh Light, George Town',                 lat: 5.4199, lon: 100.3401 },
    { name: 'Cheong Fatt Tze Mansion',      address: '14 Leith Street, George Town',             lat: 5.4193, lon: 100.3318 },
    { name: 'Penang Museum & Art Gallery',  address: '39 Farquhar Street, George Town',          lat: 5.4176, lon: 100.3364 },
    { name: 'Khoo Kongsi',                  address: 'Cannon Square, George Town',               lat: 5.4146, lon: 100.3326 },
    { name: 'Pinang Peranakan Mansion',     address: '29 Church Street, George Town',            lat: 5.4182, lon: 100.3369 },
    { name: 'Armenian Street Murals',       address: 'Armenian Street, George Town',             lat: 5.4172, lon: 100.3347 },
    { name: 'Clan Jetties (Chew Jetty)',    address: 'Pengkalan Weld, George Town',              lat: 5.4112, lon: 100.3392 },
    { name: 'Penang Butterfly Farm',        address: 'Jalan Teluk Bahang, 11050 Penang',         lat: 5.4629, lon: 100.2106 },
    { name: 'Penang National Park',         address: 'Teluk Bahang, 11050 Penang',               lat: 5.4699, lon: 100.2010 },
    { name: 'Botanical Garden',             address: 'Jalan Kebun Bunga, 10350 Penang',          lat: 5.4330, lon: 100.2930 },
    { name: 'Entopia Butterfly Farm',       address: 'Jalan Teluk Bahang, 11050 Penang',         lat: 5.4625, lon: 100.2095 },
    { name: 'Escape Theme Park',            address: '828 Jalan Teluk Bahang, 11050 Penang',     lat: 5.4600, lon: 100.2080 },
    { name: 'Masjid Kapitan Keling',        address: 'Jalan Masjid Kapitan Keling, George Town', lat: 5.4165, lon: 100.3355 },
    { name: 'Penang Bridge',                address: 'Lebuhraya Jelutong, 11600 Penang',         lat: 5.3525, lon: 100.3650 },
    { name: 'Spice Garden',                 address: 'Jalan Teluk Bahang, 11050 Penang',         lat: 5.4610, lon: 100.2070 },
    { name: 'Sri Mahamariamman Temple',     address: 'Jalan Masjid Kapitan Keling, George Town', lat: 5.4170, lon: 100.3360 },
    { name: 'St George Church',             address: 'Lebuh Farquhar, George Town',              lat: 5.4190, lon: 100.3390 },
    { name: 'Straits Quay',                 address: 'Persiaran Seri Tanjung, 10470 Penang',     lat: 5.4521, lon: 100.3058 },
    { name: 'The Habitat Penang Hill',      address: 'Bukit Bendera, 11300 Penang',              lat: 5.4210, lon: 100.2690 },
    { name: 'Time Tunnel Museum',           address: 'Jalan Kampung Benggali, George Town',      lat: 5.4215, lon: 100.3355 },
    { name: 'Toys Museum',                  address: 'Jalan Ariffin, George Town',               lat: 5.4205, lon: 100.3345 },
    { name: 'Upside Down Museum',           address: 'Jalan Sultan Ahmad Shah, George Town',     lat: 5.4230, lon: 100.3360 },
    { name: 'War Museum',                   address: 'Bukit Batu Maung, Bayan Lepas',            lat: 5.2872, lon: 100.2726 },
  ],
  restaurant: [
    { name: 'Gurney Drive Hawker Centre',     address: 'Persiaran Gurney, 10250 Penang',         lat: 5.4378, lon: 100.3103 },
    { name: 'Penang Road Famous Cendol',      address: 'Jalan Penang, George Town',              lat: 5.4185, lon: 100.3328 },
    { name: 'Sri Ananda Bahwan',              address: '55 Jalan Penang, George Town',           lat: 5.4183, lon: 100.3319 },
    { name: 'Hameediyah Restaurant',          address: '164A Campbell Street, George Town',      lat: 5.4193, lon: 100.3322 },
    { name: 'Eden Seafood Village',           address: 'Jalan Tanjung Bungah, 11200 Penang',     lat: 5.4535, lon: 100.2965 },
    { name: 'Lorong Abu Siti Hawker',         address: 'Lorong Abu Siti, George Town',           lat: 5.4220, lon: 100.3180 },
    { name: 'Padang Brown Hawker Centre',     address: 'Jalan Brown, George Town',               lat: 5.4230, lon: 100.3220 },
    { name: 'Restoran Kapitan',               address: 'Jalan Penang, George Town',              lat: 5.4181, lon: 100.3321 },
    { name: 'Tek Sen Restaurant',             address: 'Lebuh Carnarvon, George Town',           lat: 5.4145, lon: 100.3335 },
    { name: 'Kedai Kopi Swee Kong',           address: 'Kampung Baru, 11700 Penang',             lat: 5.3890, lon: 100.3050 },
    { name: 'Restoran Farlim Jaya',           address: 'Taman Farlim, 11500 Penang',             lat: 5.3980, lon: 100.3060 },
    { name: 'Wai Kee Noodles Jelutong',       address: 'Jelutong, 11600 Penang',                 lat: 5.3820, lon: 100.3200 },
    { name: 'Bayan Baru Hawker Centre',       address: 'Bayan Baru, 11950 Penang',               lat: 5.3330, lon: 100.2930 },
    { name: 'Restoran Balik Pulau Laksa',     address: 'Balik Pulau, 11000 Penang',              lat: 5.3450, lon: 100.2340 },
    { name: 'Relau Seafood Restaurant',       address: 'Relau, 11900 Penang',                    lat: 5.3280, lon: 100.2800 },
    { name: 'Gelugor Char Koay Teow',         address: 'Gelugor, 11700 Penang',                  lat: 5.3560, lon: 100.3050 },
  ],
  hotel: [
    { name: 'Eastern & Oriental Hotel',      address: '10 Lebuh Farquhar, George Town',         lat: 5.4196, lon: 100.3388 },
    { name: 'Hard Rock Hotel Penang',        address: 'Jalan Batu Ferringhi, 11100 Penang',      lat: 5.4662, lon: 100.2513 },
    { name: 'Shangri-La Rasa Sayang Resort', address: 'Jalan Batu Ferringhi, 11100 Penang',      lat: 5.4675, lon: 100.2524 },
    { name: 'Penang Marriott Hotel',         address: 'Persiaran Gurney, 10250 Penang',          lat: 5.4374, lon: 100.3108 },
    { name: 'Hotel Jen Penang',              address: 'Magazine Road, George Town',              lat: 5.4241, lon: 100.3282 },
    { name: 'Bayview Hotel Georgetown',      address: 'Lebuh Farquhar, George Town',             lat: 5.4200, lon: 100.3370 },
    { name: 'Copthorne Orchid Hotel',        address: 'Lebuh Farquhar, George Town',             lat: 5.4190, lon: 100.3380 },
    { name: 'G Hotel Kelawai',               address: 'Persiaran Gurney, 10250 Penang',          lat: 5.4354, lon: 100.3093 },
    { name: 'G Hotel Gurney',                address: 'Persiaran Gurney, 10250 Penang',          lat: 5.4370, lon: 100.3100 },
    { name: 'Golden Sands Resort',           address: 'Jalan Batu Ferringhi, 11100 Penang',      lat: 5.4678, lon: 100.2485 },
    { name: 'Lone Pine Hotel',               address: 'Jalan Batu Ferringhi, 11100 Penang',      lat: 5.4665, lon: 100.2500 },
    { name: 'Parkroyal Penang Resort',       address: 'Jalan Batu Ferringhi, 11100 Penang',      lat: 5.4672, lon: 100.2490 },
    { name: 'Sunway Hotel Georgetown',       address: 'Lebuh Kinta, George Town',                lat: 5.4150, lon: 100.3300 },
    { name: 'Wembley Hotel Penang',          address: 'Jalan Magazine, George Town',             lat: 5.4210, lon: 100.3250 },
    { name: 'Farlim Guest House',            address: 'Taman Farlim, 11500 Penang',              lat: 5.3985, lon: 100.3065 },
    { name: 'Jelutong Budget Hotel',         address: 'Jelutong, 11600 Penang',                  lat: 5.3825, lon: 100.3205 },
    { name: 'Balik Pulau Homestay',          address: 'Balik Pulau, 11000 Penang',               lat: 5.3455, lon: 100.2345 },
  ],
  beach: [
    { name: 'Batu Ferringhi Beach',   address: 'Jalan Batu Ferringhi, 11100 Penang',         lat: 5.4671, lon: 100.2481 },
    { name: 'Tanjung Bungah Beach',   address: 'Jalan Tanjung Bungah, 11200 Penang',         lat: 5.4534, lon: 100.2960 },
    { name: 'Monkey Beach',           address: 'Penang National Park, Teluk Bahang',         lat: 5.4731, lon: 100.2024 },
    { name: 'Kerachut Beach',         address: 'Penang National Park, Teluk Bahang',         lat: 5.4742, lon: 100.1969 },
    { name: 'Miami Beach',            address: 'Tanjung Bungah, 11200 Penang',               lat: 5.4550, lon: 100.2930 },
    { name: 'Pantai Pasir Panjang',   address: 'Teluk Bahang, 11050 Penang',                 lat: 5.4715, lon: 100.2005 },
    { name: 'Teluk Bahang Beach',     address: 'Teluk Bahang, 11050 Penang',                 lat: 5.4650, lon: 100.2150 },
  ],
};

// Flat list of all frontend known places for geocode lookup
const ALL_KNOWN_PLACES_FRONTEND = [
  ...FAMOUS_PLACES_FRONTEND.tourism,
  ...FAMOUS_PLACES_FRONTEND.restaurant,
  ...FAMOUS_PLACES_FRONTEND.hotel,
  ...FAMOUS_PLACES_FRONTEND.beach,
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
    if (!place.lat || !place.lon) return;
    
    map.flyTo([place.lat, place.lon], 16, { animate: true, duration: 1 });
    
    const key = place.id || place.name;
    setTimeout(() => {
      const marker = markerRefs.current[key];
      if (marker) marker.openPopup();
    }, 1500);
  }, [place, map, markerRefs]);
  return null;
}

function FlyToLocation({ location }: { location: LatLon | null }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lon], 14, { animate: true, duration: 1.2 });
  }, [location, map]);
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
  onTripAdded?: () => void;
  focusPlace?: any;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PenangExplorer({ onBack, onTripAdded, focusPlace }: PenangExplorerProps) {
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
  const [savingTrip,     setSavingTrip]     = useState<boolean>(false);
  const [locating,       setLocating]       = useState<boolean>(false);

  const [userLocation, setUserLocation] = useState<LatLon | null>(null);

  // Add Trip Modal state
  const [isAddTripModalOpen,   setIsAddTripModalOpen]   = useState<boolean>(false);
  const [selectedPlaceForTrip, setSelectedPlaceForTrip] = useState<Place | null>(null);

  const markerRefs  = useRef<Record<string, L.Marker>>({});
  const watchIdRef  = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchByCategory('tourism');
    requestUserLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── FOCUS PLACE HANDLER ───────────────────────────────────────────────────
  useEffect(() => {
    if (!focusPlace) return;
    if (!focusPlace.lat || !focusPlace.lon) return;
    
    // Clear any existing route
    setFromText('');
    setToText('');
    setRouteCoords([]);
    setRouteInfo(null);
    setRouteEndpoints(null);
    
    // Determine category from place type
    const categoryMap: Record<string, string> = {
  // Tourism
  '🏛️ Tourist Attraction': 'tourism',
  '🏛️ War Museum':          'tourism',
  '🏛️ Temple':              'tourism',
  '🏛️ Nature Attraction':   'tourism',
  '🏛️ Historic Fort':       'tourism',
  '🏛️ Heritage Mansion':    'tourism',
  '🏛️ Museum':              'tourism',
  '🏛️ Clan House':          'tourism',
  '🏛️ Heritage Site':       'tourism',
  '🏛️ Street Art':          'tourism',
  '🏛️ National Park':       'tourism',
  '🏛️ Landmark':            'tourism',
  '🏛️ Marina':              'tourism',
  '🏛️ Heritage Church':     'tourism',
  '🏛️ Hindu Temple':        'tourism',
  '🌿 Spice Garden':         'tourism',
  '🌿 Botanical Garden':     'tourism',
  '🌿 Eco Attraction':       'tourism',
  '🎡 Theme Park':           'tourism',
  '🕌 Mosque':               'tourism',
  'Attraction':              'tourism',
  'tourism':                 'tourism',

  // Restaurants — covers ALL your restaurant types
  '🍜 Restaurant':           'restaurant',
  '🍜 Hawker Centre':        'restaurant',
  '🍜 Night Market':         'restaurant',
  '🍜 Night Hawker Street':  'restaurant',
  '🍜 Char Kway Teow':       'restaurant',
  '🍜 Chinese Restaurant':   'restaurant',
  '🍜 Thai Restaurant':      'restaurant',
  '🍜 Nyonya Food':          'restaurant',
  '🍜 Noodle Shop':          'restaurant',
  '🍜 Local Restaurant':     'restaurant',
  '🍜 Kopitiam':             'restaurant',
  '🍜 Laksa':                'restaurant',
  '🍛 Indian Vegetarian':    'restaurant',
  '🍛 Nasi Kandar':          'restaurant',
  '🍛 Indian Muslim':        'restaurant',
  '🍧 Cendol Stall':         'restaurant',
  '🍧 Cendol & Desserts':    'restaurant',
  '🍲 Sup Hameed':           'restaurant',
  '🦞 Seafood Restaurant':   'restaurant',
  '🦞 Seafood':              'restaurant',
  '☕ Old School Kopitiam':   'restaurant',
  'Restaurant':              'restaurant',
  'restaurant':              'restaurant',

  // Hotels — covers ALL your hotel types
  '🏨 5-Star Heritage Hotel': 'hotel',
  '🏨 5-Star Resort':         'hotel',
  '🏨 5-Star Hotel':          'hotel',
  '🏨 5-Star Boutique Hotel': 'hotel',
  '🏨 4-Star Hotel':          'hotel',
  '🏨 4-Star Resort':         'hotel',
  '🏨 3-Star Hotel':          'hotel',
  '🏨 Boutique Beach Hotel':  'hotel',
  '🏨 Budget Inn':            'hotel',
  '🏨 Budget Hotel':          'hotel',
  '🏨 Guesthouse':            'hotel',
  '🏨 Inn':                   'hotel',
  '🏨 Resort':                'hotel',
  '🏨 Homestay':              'hotel',
  '🏨 Hotel':                 'hotel',
  'Hotel':                    'hotel',
  'hotel':                    'hotel',

  // Beaches
  '🏖️ Beach':                'beach',
  'Beach':                   'beach',
  'beach':                   'beach',
};
    
    let categoryToFetch = 'tourism';
    if (focusPlace.type) {
      categoryToFetch = categoryMap[focusPlace.type] || 'tourism';
    } else if (focusPlace.category) {
      categoryToFetch = categoryMap[focusPlace.category] || 'tourism';
    }
    
    setCategory(categoryToFetch);
    
    const fetchAndSelect = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search/places?category=${categoryToFetch}`);
        const fetchedPlaces = res.data.places || [];
        
        // Merge fetched places with frontend known places
        let allPlaces = [...fetchedPlaces];
        
        if (categoryToFetch === 'hotel') {
          const frontendHotels = FAMOUS_PLACES_FRONTEND.hotel || [];
          frontendHotels.forEach(hotel => {
            const exists = allPlaces.some(p => p.name === hotel.name);
            if (!exists) {
              allPlaces.push({
                id: `frontend_${hotel.name.replace(/\s/g, '_')}`,
                name: hotel.name,
                lat: hotel.lat,
                lon: hotel.lon,
                address: hotel.address,
                type: 'hotel',
                desc: '',
              } as Place);
            }
          });
        } else if (categoryToFetch === 'restaurant') {
          const frontendRestaurants = FAMOUS_PLACES_FRONTEND.restaurant || [];
          frontendRestaurants.forEach(restaurant => {
            const exists = allPlaces.some(p => p.name === restaurant.name);
            if (!exists) {
              allPlaces.push({
                id: `frontend_${restaurant.name.replace(/\s/g, '_')}`,
                name: restaurant.name,
                lat: restaurant.lat,
                lon: restaurant.lon,
                address: restaurant.address,
                type: 'restaurant',
                desc: '',
              } as Place);
            }
          });
        } else if (categoryToFetch === 'tourism') {
          const frontendTourism = FAMOUS_PLACES_FRONTEND.tourism || [];
          frontendTourism.forEach(attraction => {
            const exists = allPlaces.some(p => p.name === attraction.name);
            if (!exists) {
              allPlaces.push({
                id: `frontend_${attraction.name.replace(/\s/g, '_')}`,
                name: attraction.name,
                lat: attraction.lat,
                lon: attraction.lon,
                address: attraction.address,
                type: 'tourism',
                desc: '',
              } as Place);
            }
          });
        } else if (categoryToFetch === 'beach') {
          const frontendBeaches = FAMOUS_PLACES_FRONTEND.beach || [];
          frontendBeaches.forEach(beach => {
            const exists = allPlaces.some(p => p.name === beach.name);
            if (!exists) {
              allPlaces.push({
                id: `frontend_${beach.name.replace(/\s/g, '_')}`,
                name: beach.name,
                lat: beach.lat,
                lon: beach.lon,
                address: beach.address,
                type: 'beach',
                desc: '',
              } as Place);
            }
          });
        }
        
        setPlaces(allPlaces);
        
        // Find matching place in merged list
        const matchedPlace = allPlaces.find(
          (p: Place) => p.name === focusPlace.name || 
                        p.name.toLowerCase().includes(focusPlace.name.toLowerCase()) ||
                        focusPlace.name.toLowerCase().includes(p.name.toLowerCase())
        );
        
        if (matchedPlace) {
          setSelectedPlace(matchedPlace);
        } else {
          setSelectedPlace(focusPlace);
        }
      } catch (err) {
        console.error('Failed to fetch places:', err);
        setSelectedPlace(focusPlace);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndSelect();
  }, [focusPlace]);

  // ── SEARCH ────────────────────────────────────────────────────────────────
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

  // ── GEOLOCATION ───────────────────────────────────────────────────────────
  const handlePositionSuccess = (position: GeolocationPosition) => {
    setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
    showToast('Location updated.');
    setLocating(false);
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    const message =
      error.code === 1 ? 'Location permission denied.' :
      error.code === 2 ? 'Unable to determine location.' :
      error.code === 3 ? 'Location request timed out.' :
                        'Geolocation failed.';
    showToast(message);
    setLocating(false);
  };

  function requestUserLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by browser.');
      return;
    }
    setLocating(true);
    const id = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      timeout:            15000,
      maximumAge:         10000,
    });
    watchIdRef.current = id;
  }

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

    // Check currently loaded places first
    const loadedMatch =
      places.find(p => p.name.toLowerCase() === text.toLowerCase()) ||
      places.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
    if (loadedMatch) return { lat: loadedMatch.lat, lon: loadedMatch.lon };

    // Check frontend known places list
    const knownMatch =
      ALL_KNOWN_PLACES_FRONTEND.find(p => p.name.toLowerCase() === text.toLowerCase()) ||
      ALL_KNOWN_PLACES_FRONTEND.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
    if (knownMatch) return { lat: knownMatch.lat, lon: knownMatch.lon };

    // Try backend geocode endpoint
    try {
      const res = await axios.get(`/api/search/geocode?q=${encodeURIComponent(text)}`);
      return { lat: res.data.lat, lon: res.data.lon };
    } catch {
      // Last resort: Geoapify direct
      const res = await axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: {
          text:   text + ' Penang Malaysia',
          lang:   'en',
          limit:  1,
          format: 'json',
          bias:   'proximity:100.3003,5.3521',
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
    toLat:   number, toLon:   number,
    mode:    string,
  ) => {
    const geoapifyMode = ({ drive: 'drive', walk: 'walk', bicycle: 'bicycle' } as Record<string, string>)[mode] || 'drive';

    const attempt = async (m: string) => {
      const res = await axios.get('https://api.geoapify.com/v1/routing', {
        params: {
          waypoints: `${fromLat},${fromLon}|${toLat},${toLon}`,
          mode:      m,
          details:   'instruction_details',
          format:    'geojson',
          apiKey:    ROUTING_KEY,
        },
        timeout: 10000,
      });
      const features = res.data.features;
      if (!features || !features.length) throw new Error('No route found');
      return features;
    };

    let features;
    try {
      features = await attempt(geoapifyMode);
    } catch {
      if (geoapifyMode !== 'drive') {
        showToast(`No ${geoapifyMode} route available — showing drive route instead.`);
        features = await attempt('drive');
      } else {
        throw new Error('No route found');
      }
    }

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
      showToast('Please enter both starting point and destination.');
      return;
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
        const result = await callRoutingAPI(
          userLocation.lat, userLocation.lon,
          place.lat, place.lon,
          travelMode,
        );
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

  // ── TRIPS ─────────────────────────────────────────────────────────────────
  const findNearbyAttractions = (place: Place): Attraction[] => {
    const others = places
      .filter(p => p.id !== place.id && p.lat && p.lon)
      .map(p => ({
        place,
        distance: Math.hypot(p.lat - place.lat, p.lon - place.lon) * 111,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6)
      .map(({ place, distance }) => ({
        name:     place.name,
        image:    'https://placehold.co/120x90?text=Nearby',
        distance: `${Math.round(distance)} km`,
      }));

    return others.length
      ? others
      : [{ name: 'Explore nearby places', image: 'https://placehold.co/120x90?text=Explore', distance: 'Nearby' }];
  };

  const makeTripFromPlace = (place: Place): Omit<Trip, '_id'> => ({
    destination: place.name,
    country:     'Penang, Malaysia',
    dates:       'Flexible dates',
    startDate:   '',
    endDate:     '',
    image:       'https://placehold.co/640x480?text=Penang+Trip',
    address:     place.address || '',
    description: place.desc    || '',
    type:        place.type    || '',
    lat:         place.lat,
    lon:         place.lon,
    weather: { temp: 'N/A', condition: 'Planned', humidity: '', wind: '', feelsLike: '', icon: '📍' },
    attractions: findNearbyAttractions(place),
    notes:       `Saved from Penang Explorer: ${place.name}`,
    preferences: '',
    status:      'upcoming',
  });

  const addTrip = (place: Place) => {
    setSelectedPlaceForTrip(place);
    setIsAddTripModalOpen(true);
  };

  const handleAddTripSubmit = async (tripData: Omit<Trip, '_id'>) => {
    if (!selectedPlaceForTrip) return;
    const placeTrip = makeTripFromPlace(selectedPlaceForTrip);
    const payload: Omit<Trip, '_id'> = {
      ...placeTrip,
      ...tripData,
      address:     selectedPlaceForTrip.address || placeTrip.address,
      description: selectedPlaceForTrip.desc    || placeTrip.description,
      type:        selectedPlaceForTrip.type     || placeTrip.type,
      lat:         selectedPlaceForTrip.lat,
      lon:         selectedPlaceForTrip.lon,
      attractions: findNearbyAttractions(selectedPlaceForTrip),
      dates:       tripData.startDate && tripData.endDate
                     ? `${tripData.startDate} to ${tripData.endDate}`
                     : placeTrip.dates,
      status:      tripData.status || placeTrip.status,
    };
    setSavingTrip(true);
    try {
      await tripService.createTrip(payload);
      showToast('Trip saved to My Trips! 🎉');
      setIsAddTripModalOpen(false);
      setSelectedPlaceForTrip(null);
      onTripAdded?.();
    } catch (err) {
      console.error('Failed to save trip:', err);
      showToast('Unable to save trip. Please try again.');
    } finally {
      setSavingTrip(false);
    }
  };

  // ── RESET ─────────────────────────────────────────────────────────────────
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
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#555',
            background: 'none', border: 'none', cursor: 'pointer', marginRight: 12,
          }}>
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
            <button className={`style-btn ${mapStyle === 'street' ? 'active' : ''}`} onClick={() => setMapStyle('street')}>🗺️ Street</button>
            <button className={`style-btn ${mapStyle === 'dark' ? 'active' : ''}`} onClick={() => setMapStyle('dark')}>🌙 Dark</button>
            <button className={`style-btn ${mapStyle === 'satellite' ? 'active' : ''}`} onClick={() => setMapStyle('satellite')}>🛰️ Satellite</button>
          </div>
          <div className="header-badge">📍 Penang Island & Mainland</div>
        </div>
      </header>

      <div className="main">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-inner">
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
                <input type="text" placeholder="Starting point (or 'My Location')" value={fromText} onChange={e => setFromText(e.target.value)} />
              </div>
              <div className="route-input">
                <div className="route-dot end" />
                <input type="text" placeholder="Destination" value={toText} onChange={e => { setToText(e.target.value); if (e.target.value.trim()) fetchSearch(e.target.value); }} />
              </div>
              <div className="travel-mode">
                {TRAVEL_MODES.map(m => (
                  <button key={m.key} className={`mode-btn ${travelMode === m.key ? 'active' : ''}`} onClick={() => setTravelMode(m.key)}>
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
              <div key={place.id || i} className={`place-card ${selectedPlace?.id === place.id ? 'selected' : ''}`} onClick={() => setSelectedPlace(place)}>
                <div className="place-type">{place.type || category}</div>
                <div className="place-name">{place.name}</div>
                {place.desc && <div className="place-desc">"{place.desc}"</div>}
                <div className="place-addr">📍 {place.address}</div>
                {place.cuisine && <div className="place-tag">🍽️ {place.cuisine}</div>}
                {place.opening_hours && <div className="place-tag">🕐 {place.opening_hours}</div>}
                <div className="card-actions">
                  <button className="card-btn btn-route" onClick={e => { e.stopPropagation(); routeToPlace(place); }}>🧭 Route</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAP */}
        <div className="map-wrapper">
          <button className="reset-view-btn" onClick={handleRefresh} title="Reset everything">🔄 Refresh</button>
          <button className="locate-me-btn" onClick={requestUserLocation} disabled={locating} title="Locate me">
            {locating ? '📍 Locating…' : '📍 Locate Me'}
          </button>

          <MapContainer center={PENANG_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} maxBounds={PENANG_BOUNDS} maxBoundsViscosity={0.8}>
            <MapStyleUpdater styleUrl={(MAP_STYLES as Record<string, string>)[mapStyle]} attribution={(MAP_ATTRIBUTIONS as Record<string, string>)[mapStyle]} />
            <FitBounds places={places} />
            <FlyToPlace place={selectedPlace} markerRefs={markerRefs} />
            <FlyToLocation location={userLocation} />
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
                  {place.desc && <div className="popup-desc">"{place.desc}"</div>}
                  <div className="popup-addr">📍 {place.address}</div>
                  {place.phone && <div className="popup-detail">📞 {place.phone}</div>}
                  <button className="popup-route-btn" onClick={e => { e.stopPropagation(); routeToPlace(place); }}>🧭 Get Directions</button>
                  <button className="popup-addtrip-btn" onClick={e => { e.stopPropagation(); addTrip(place); }} disabled={savingTrip}>➕ Add Trip</button>
                </Popup>
              </Marker>
            ))}

            {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#0d9488" weight={5} opacity={0.85} />}

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

      {isAddTripModalOpen && selectedPlaceForTrip && (
        <AddTripModal
          place={selectedPlaceForTrip}
          onClose={() => { setIsAddTripModalOpen(false); setSelectedPlaceForTrip(null); }}
          onSubmit={handleAddTripSubmit}
          loading={savingTrip}
        />
      )}
    </div>
  );
}