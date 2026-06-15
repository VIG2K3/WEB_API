import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { tripService } from "./services/tripService";
import type { ForecastDay, Place, Trip, TripStop } from "./types/trip";
import { getCategoryColor, getImageForTrip } from "./services/imageService";
import "./styles/AddTripModal.css";

type TabType = "Overview" | "Weather" | "Attractions" | "Budget";
type StopCategory = "all" | "tourism" | "restaurant" | "hotel" | "beach";

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
  onDelete?: () => void;
  source?: "home" | "mytrips";
  onOpenExplorer?: (place: any) => void;
}

const MAX_BUDGET = 10000;

const CATEGORY_OPTIONS = [
  { key: "all", label: "🌟 All Places" },
  { key: "tourism", label: "🏛️ Attractions" },
  { key: "restaurant", label: "🍜 Restaurants" },
  { key: "hotel", label: "🏨 Hotels" },
  { key: "beach", label: "🏖️ Beaches" },
] as const;

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


const PLACE_OPTIONS: Record<StopCategory, TripStop[]> = {
  all: [
    ...FAMOUS_PLACES_FRONTEND.tourism,
    ...FAMOUS_PLACES_FRONTEND.restaurant,
    ...FAMOUS_PLACES_FRONTEND.hotel,
    ...FAMOUS_PLACES_FRONTEND.beach,
  ].map((place) => ({ ...place, category: "tourism" })),
  tourism: FAMOUS_PLACES_FRONTEND.tourism.map((place) => ({ ...place, category: "tourism" })),
  restaurant: FAMOUS_PLACES_FRONTEND.restaurant.map((place) => ({ ...place, category: "restaurant" })),
  hotel: FAMOUS_PLACES_FRONTEND.hotel.map((place) => ({ ...place, category: "hotel" })),
  beach: FAMOUS_PLACES_FRONTEND.beach.map((place) => ({ ...place, category: "beach" })),
};

function notifyTripChanged(tripId?: string) {
  window.dispatchEvent(new CustomEvent("trip-budget-updated", { detail: { tripId } }));
  window.dispatchEvent(new CustomEvent("trips-updated", { detail: { tripId } }));
  window.dispatchEvent(new CustomEvent("trip-deleted", { detail: { tripId } }));
}

export default function TripDetail({
  trip,
  onBack,
  onDelete,
  source = "mytrips",
  onOpenExplorer,
}: TripDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);

  const [tripData, setTripData] = useState<Trip>(trip);
  const [currentWeather, setCurrentWeather] = useState(trip.weather);
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([]);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const [budgetTotal, setBudgetTotal] = useState<number>(trip.budget?.total || 0);
  const [budgetItems, setBudgetItems] = useState<Array<{ label: string; amount: number }>>(trip.budget?.items || []);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  const [poisByCategory, setPoisByCategory] = useState<Record<string, Place[]>>({
    tourism: [], restaurant: [], hotel: [], beach: [],
  });
  const [loadingPois, setLoadingPois] = useState(false);
  const [poisError, setPoisError] = useState<string | null>(null);

  const [editDestination, setEditDestination] = useState(`${trip.destination}, ${trip.country}`);
  const [editStartDate, setEditStartDate] = useState(trip.startDate);
  const [editEndDate, setEditEndDate] = useState(trip.endDate);
  const [editNotes, setEditNotes] = useState(trip.notes);
  const [editBudgetTotal, setEditBudgetTotal] = useState<number | "">(trip.budget?.total || "");
  const [editStops, setEditStops] = useState<TripStop[]>(getStopsFromTrip(trip));
  const [editTripType, setEditTripType] = useState<"single" | "multi">(
    getStopsFromTrip(trip).length > 1 ? "multi" : "single"
  );
  const [selectedCategory, setSelectedCategory] = useState<StopCategory>("all");
  const [selectedPlaceName, setSelectedPlaceName] = useState("");

  const todayISO = new Date().toISOString().split("T")[0];

  const tabs: TabType[] = ["Overview", "Weather", "Attractions", "Budget"];
  const routeStops = getStopsFromTrip(tripData);
  const computedStatus = tripData.status || getStatusFromDates(tripData.startDate, tripData.endDate);
  const spent = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = budgetTotal - spent;

  function getStopsFromTrip(t: Trip): TripStop[] {
    if (t.stops && t.stops.length > 0) return t.stops;
    return [{ name: t.destination, address: t.address || "Penang, Malaysia", lat: t.lat, lon: t.lon, category: t.type || t.category || "tourism" }];
  }

  function getStatusFromDates(start: string, end: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateValue = start ? new Date(start) : null;
    const endDateValue = end ? new Date(end) : null;
    if (startDateValue) startDateValue.setHours(0, 0, 0, 0);
    if (endDateValue) endDateValue.setHours(0, 0, 0, 0);
    if (!startDateValue && !endDateValue) return "upcoming";
    if (startDateValue && today < startDateValue) return "upcoming";
    if (endDateValue && today > endDateValue) return "completed";
    return "ongoing";
  }

  function formatHeaderDate(start: string, end: string, fallback = "Flexible dates") {
    if (!start || !end) return fallback;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return fallback;
    const startFmt = s.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const endFmt = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${startFmt} – ${endFmt}`;
  }

  const toWeatherEmoji = (code: string) => {
    const map: Record<string, string> = {
      "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
      "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
      "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
      "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
      "50d": "🌫️", "50n": "🌫️",
    };
    return map[code] || "🌡️";
  };

  const refreshWeather = async () => {
    setRefreshingWeather(true);
    setLoadingForecast(true);
    try {
      const resp = await fetch(`/api/trips/${tripData._id}/weather?force=true`);
      if (!resp.ok) throw new Error("Failed to fetch weather");
      const body = await resp.json();
      const current = body.current || body;
      const daily = body.daily || [];
      const updatedWeather = {
        temp: current.temp, condition: current.condition, humidity: current.humidity,
        wind: current.wind, feelsLike: current.feelsLike, icon: toWeatherEmoji(current.icon || ""),
      };
      setCurrentWeather(updatedWeather);
      setTripData((prev) => ({ ...prev, weather: updatedWeather }));
      setForecastDays(daily.map((d: any) => ({
        date: d.date, temp: d.temp, condition: d.condition, humidity: d.humidity,
        wind: d.wind, feelsLike: d.feelsLike, icon: toWeatherEmoji(d.icon || ""),
      })));
    } catch (error) {
      console.error("Failed to refresh weather:", error);
    } finally {
      setRefreshingWeather(false);
      setLoadingForecast(false);
    }
  };

  const haversineKm = (lat1: number, lon1: number, lat2?: number, lon2?: number) => {
    if (lat2 == null || lon2 == null) return Infinity;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  };

  const fetchNearbyPOIs = async () => {
    setLoadingPois(true);
    setPoisError(null);
    try {
      let lat = tripData.lat;
      let lon = tripData.lon;
      if ((!lat || !lon) && tripData.destination) {
        const resp = await fetch(`/api/search/geocode?q=${encodeURIComponent(tripData.destination)}`);
        if (resp.ok) { const body = await resp.json(); lat = body.lat; lon = body.lon; }
      }
      if (!lat || !lon) throw new Error("Could not determine trip coordinates for nearby places.");
      const categories = ["tourism", "restaurant", "hotel", "beach"];
      const results: Record<string, Place[]> = { tourism: [], restaurant: [], hotel: [], beach: [] };
      await Promise.all(categories.map(async (cat) => {
        try {
          const r = await fetch(`/api/search/places?category=${cat}&lat=${lat}&lon=${lon}`);
          if (!r.ok) throw new Error("Places fetch failed");
          const body = await r.json();
          const places = (body.places || []).map((p: any) => ({ ...p, distanceKm: haversineKm(lat!, lon!, p.lat, p.lon) }));
          places.sort((a: any, b: any) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
          results[cat] = places.filter((p: any) => p.distanceKm <= 12).slice(0, 8);
        } catch { results[cat] = []; }
      }));
      setPoisByCategory(results);
    } catch (err: any) {
      setPoisError(err.message || String(err));
    } finally {
      setLoadingPois(false);
    }
  };

  const addSelectedStop = () => {
    const selected = PLACE_OPTIONS[selectedCategory].find((p) => p.name === selectedPlaceName);
    if (!selected) { alert("Please choose a place first."); return; }
    if (editStops.some((s) => s.name === selected.name)) { alert("This place is already in your route."); return; }
    setEditStops((prev) => [...prev, selected]);
    setSelectedPlaceName("");
  };

  const removeEditStop = (index: number) => {
    if (index === 0) return;
    setEditStops((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTrip = async () => {
    if (!editStartDate) {
      alert("Please select a start date.");
      return;
    }

    if (!editEndDate) {
      alert("Please select an end date.");
      return;
    }

    if (new Date(editEndDate) < new Date(editStartDate)) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    const finalBudgetTotal = editBudgetTotal === "" ? 0 : Number(editBudgetTotal);

    if (Number.isNaN(finalBudgetTotal) || finalBudgetTotal < 0) {
      alert("Please enter a valid budget amount.");
      return;
    }

    if (finalBudgetTotal > MAX_BUDGET) {
      alert("Budget cannot exceed RM 10,000.");
      return;
    }

    try {
      const parts = editDestination.split(",").map((s) => s.trim()).filter(Boolean);
      const destination = parts[0] || tripData.destination;
      const country = parts.slice(1).join(", ") || tripData.country || "Penang, Malaysia";
      const newStatus = getStatusFromDates(editStartDate, editEndDate);
      const finalStops = editTripType === "multi"
        ? (editStops.length > 0 ? editStops : routeStops)
        : [editStops[0] || routeStops[0]];
      const tripType = editTripType;
      const updatedTrip = await tripService.updateTrip(tripData._id, {
        destination: tripType === "multi" && !destination.includes("Multi-Stop Trip") ? `${destination} Multi-Stop Trip` : destination,
        country, startDate: editStartDate, endDate: editEndDate,
        dates: editStartDate && editEndDate ? `${editStartDate} to ${editEndDate}` : "Flexible dates",
        notes: editNotes, preferences: tripData.preferences || "", status: newStatus,
        budget: { total: finalBudgetTotal, items: budgetItems },
        tripType, stops: finalStops,
      });
      setTripData(updatedTrip);
      setBudgetTotal(finalBudgetTotal);
      setEditStops(getStopsFromTrip(updatedTrip));
      setShowEditPanel(false);
      notifyTripChanged(tripData._id);
    } catch (err) {
      console.error("Failed to update trip:", err);
      alert("Failed to update trip. Please try again.");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fresh = await tripService.getTripById(trip._id);
        if (fresh && mounted) {
          setTripData(fresh);
          setEditDestination(`${fresh.destination}, ${fresh.country}`);
          setEditStartDate(fresh.startDate);
          setEditEndDate(fresh.endDate);
          setEditNotes(fresh.notes);
          setBudgetTotal(fresh.budget?.total || 0);
          setEditBudgetTotal(fresh.budget?.total || "");
          setBudgetItems(fresh.budget?.items || []);
          const freshStops = getStopsFromTrip(fresh);
          setEditStops(freshStops);
          setEditTripType(freshStops.length > 1 ? "multi" : "single");
        }
      } catch (err) { console.warn("Could not fetch fresh trip:", err); }
      if (mounted) refreshWeather();
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip._id]);

  useEffect(() => {
    if (!showEditPanel) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showEditPanel]);

  useEffect(() => {
    if (activeTab === "Attractions") fetchNearbyPOIs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tripData._id]);

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div style={styles.layout}>
        <div style={styles.detailColumn}>

          {/* Top Bar */}
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={onBack}>
              ← BACK
            </button>
            <div style={styles.actionBtns}>
            {computedStatus !== "completed" && (
            <button style={styles.editBtn} onClick={() => setShowEditPanel(true)}>Edit Trip</button>
          )}
          <button style={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
        </div>
          </div>

          {/* Trip Header */}
          <div style={styles.tripHeader}>
            <h1 style={styles.tripTitle}>{tripData.destination}, {tripData.country}</h1>
            <p style={styles.tripDates}>{formatHeaderDate(tripData.startDate, tripData.endDate, tripData.dates)}</p>
            <div style={styles.badgeRow}>
              <span style={{ ...styles.statusBadge, background: computedStatus === "upcoming" ? "#3e84f6" : computedStatus === "ongoing" ? "#22c55e" : "#a6a6a6" }}>
                {computedStatus}
              </span>
              {tripData.tripType === "multi" && <span style={styles.multiTripBadge}>🧭 {routeStops.length} Stops</span>}
              {tripData.category && <span style={{ ...styles.categoryBadge, background: getCategoryColor(tripData.category) }}>{tripData.category}</span>}
            </div>
          </div>

          {/* Hero Image */}
          <div style={styles.heroWrap}>
            <img src={getImageForTrip(tripData)} alt={tripData.destination} style={styles.heroImg} />
            <div style={styles.heroOverlay} />
          </div>

          {/* Tab Bar */}
          <div style={styles.tabBar}>
            {tabs.map((tab) => (
              <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }} onClick={() => setActiveTab(tab)}>
                {tab}
                {activeTab === tab && <div style={styles.tabUnderline} />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>

            {activeTab === "Overview" && (
              <div style={styles.newOverviewGrid}>
                <div style={styles.summaryCard}>
                  <h3 style={styles.summaryTitle}>Trip Summary</h3>
                  <div style={styles.summaryGrid}>
                    <SummaryBox label="Start Date" value={tripData.startDate || "Flexible"} />
                    <SummaryBox label="End Date" value={tripData.endDate || "Flexible"} />
                    <SummaryBox label="Status" value={computedStatus} />
                    <SummaryBox label="Stops" value={String(routeStops.length)} />
                    <SummaryBox label="Budget" value={`RM ${budgetTotal.toLocaleString()}`} />
                    <SummaryBox label="Remaining" value={`RM ${remaining.toLocaleString()}`} />
                  </div>
                  <div style={styles.notesCard}><h4>Notes</h4><p>{tripData.notes || "No notes added yet."}</p></div>
                  {tripData.preferences && (
                    <div style={styles.prefChips}>
                      {tripData.preferences.split(",").map((p) => <span key={p.trim()} style={styles.prefChip}>{p.trim()}</span>)}
                    </div>
                  )}
                </div>

                <div style={styles.routeCard}>
                  <div style={styles.routeHeaderRow}>
                    <div>
                      <h3 style={styles.summaryTitle}>Route Plan</h3>
                      <p style={styles.routeSub}>Your saved itinerary in order.</p>
                    </div>
                    <span style={styles.routeCount}>{routeStops.length} stops</span>
                  </div>
                  <div style={styles.timelineList}>
                    {routeStops.map((stop, index) => (
                      <div key={`${stop.name}-${index}`} style={styles.routeStopCard}>
                        <div style={styles.routeNumber}>{index + 1}</div>
                        <div style={styles.routeStopInfo}>
                          <h3>{stop.name}</h3>
                          <p>{stop.address || "Penang, Malaysia"}</p>
                          {onOpenExplorer && <button style={styles.routeMapBtn} onClick={() => onOpenExplorer(stop)}>🗺️ View on Map</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Weather" && (
              <div style={styles.infoCard}>
                <div style={styles.cardHeaderRow}>
                  <h3 style={styles.cardTitle}>Weather Forecast</h3>
                  <button onClick={refreshWeather} disabled={refreshingWeather} style={styles.refreshBtn}>
                    {refreshingWeather ? "🔄 Loading..." : "🔄 Refresh"}
                  </button>
                </div>
                <div style={styles.weatherMain}>
                  <span style={styles.weatherEmoji}>{currentWeather.icon}</span>
                  <div>
                    <div style={styles.weatherTemp}>{currentWeather.temp}</div>
                    <div style={styles.weatherCond}>{currentWeather.condition}</div>
                  </div>
                </div>
                <div style={styles.weatherDetails}>
                  <WeatherRow label="Humidity" value={currentWeather.humidity} />
                  <WeatherRow label="Wind" value={currentWeather.wind} />
                  <WeatherRow label="Feels like" value={currentWeather.feelsLike} />
                </div>
                {forecastDays.length > 0 && (
                  <div style={styles.forecastSection}>
                    <h4 style={styles.forecastTitle}>5-Day Forecast</h4>
                    <div style={styles.forecastGrid}>
                      {forecastDays.map((day, idx) => (
                        <div key={idx} style={styles.forecastCard}>
                          <div style={styles.forecastDate}>{new Date(day.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</div>
                          <div style={styles.forecastEmoji}>{day.icon}</div>
                          <div style={styles.forecastTemp}>{day.temp}</div>
                          <div style={styles.forecastCondition}>{day.condition}</div>
                          <div style={styles.forecastSmall}>💧 {day.humidity}</div>
                          <div style={styles.forecastSmall}>💨 {day.wind}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {loadingForecast && !forecastDays.length && <div style={styles.centerMuted}>Loading forecast...</div>}
              </div>
            )}

            {activeTab === "Attractions" && (
              <div style={styles.placesStack}>
                {loadingPois && <div style={styles.centerMuted}>Loading nearby places…</div>}
                {poisError && <div style={styles.errorText}>{poisError}</div>}
                {!loadingPois && !poisError && [
                  { key: "tourism", label: "🏛️ Attractions" },
                  { key: "restaurant", label: "🍜 Restaurants" },
                  { key: "hotel", label: "🏨 Hotels" },
                  { key: "beach", label: "🏖️ Beaches" },
                ].map(({ key, label }) => (
                  <div key={key} style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>{label}</h3>
                    {poisByCategory[key]?.length === 0 ? (
                      <p style={styles.mutedText}>No nearby places found.</p>
                    ) : (
                      <div style={styles.poiList}>
                        {poisByCategory[key]?.map((place, i) => (
                          <div key={place.id || i} style={styles.poiRow}>
                            <div style={styles.poiInfo}>
                              <strong>{place.name}</strong>
                              {place.desc && <span>{place.desc}</span>}
                              <small>📍 {place.address}</small>
                            </div>
                            <div style={styles.poiActions}>
                              {place.distanceKm != null && place.distanceKm !== Infinity && (
                                <span style={styles.distancePill}>{place.distanceKm} km</span>
                              )}
                              {onOpenExplorer && place.lat && place.lon && (
                                <button onClick={() => onOpenExplorer(place)} style={styles.routeMapBtn}>🗺️ View on Map</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Budget" && (
              <div style={styles.budgetContainer}>
                <div style={styles.budgetSummaryGrid}>
                  <BudgetCard title="💰 Total Budget" value={`RM ${budgetTotal.toLocaleString()}`} background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                  <BudgetCard title="💸 Total Spent" value={`RM ${spent.toLocaleString()}`} background="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
                  <BudgetCard title="💚 Remaining" value={`RM ${remaining.toLocaleString()}`} background="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
                </div>
                {budgetTotal > 0 && (
                  <div style={styles.progressSection}>
                    <div style={styles.progressLabel}>
                      <span>Budget Used</span>
                      <strong>{Math.min((spent / budgetTotal) * 100, 100).toFixed(1)}%</strong>
                    </div>
                    <div style={styles.progressBarTrack}>
                      <div style={{ ...styles.progressBarFill, width: `${Math.min((spent / budgetTotal) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                <div style={styles.quickAddSection}>
                  <h4 style={styles.sectionSubtitle}>➕ Add Expense</h4>
                  <div style={styles.quickAddRow}>
                    <input
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      maxLength={50}
                      placeholder="e.g. Hotel, food, entry ticket"
                      style={{ ...styles.textInput, flex: 2 }}
                    />
                    <input
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      type="number"
                      min="0.01"
                      max={MAX_BUDGET}
                      step="0.01"
                      placeholder="Amount"
                      style={{ ...styles.textInput, flex: 1 }}
                    />
                    <button
                      style={styles.addBtn}
                      onClick={async () => {
                        const label = newItemLabel.trim();
                        const amount = parseFloat(newItemAmount);

                        if (!label) {
                          alert("Please enter an expense name.");
                          return;
                        }

                        if (label.length > 51) {
                          alert("Expense name cannot exceed 50 characters.");
                          return;
                        }

                        if (!newItemAmount || Number.isNaN(amount) || amount <= 0) {
                          alert("Please enter a valid amount.");
                          return;
                        }

                        if (amount > MAX_BUDGET) {
                          alert("Expense amount cannot exceed RM 10,000.");
                          return;
                        }

                        const newItem = { label, amount };
                        const updated = [...budgetItems, newItem];

                        setBudgetItems(updated);
                        setNewItemLabel("");
                        setNewItemAmount("");

                        await tripService.updateTrip(tripData._id, {
                          budget: { total: budgetTotal, items: updated },
                        });

                        notifyTripChanged(tripData._id);
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div style={styles.expensesList}>
                  <h4 style={styles.sectionSubtitle}>📋 Expense Breakdown</h4>
                  {budgetItems.length === 0 ? (
                    <div style={styles.emptyExpenses}>No expenses added yet.</div>
                  ) : budgetItems.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} style={styles.expenseItem}>
                      <span>{item.label}</span>
                      <div style={styles.expenseRight}>
                        <strong>RM {item.amount.toLocaleString()}</strong>
                        <button style={styles.deleteExpenseBtn} onClick={async () => {
                          const updated = budgetItems.filter((_, i) => i !== idx);
                          setBudgetItems(updated);
                          await tripService.updateTrip(tripData._id, { budget: { total: budgetTotal, items: updated } });
                          notifyTripChanged(tripData._id);
                        }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Trip Modal ── */}
      {showEditPanel && (
        <div className="modal-overlay add-trip-fullscreen-overlay" onClick={() => setShowEditPanel(false)}>
          <style>{`
            .add-trip-fullscreen-overlay {
              position: fixed !important;
              inset: 0 !important;
              width: 100vw !important;
              height: 100dvh !important;
              padding: 0 !important;
              display: block !important;
              overflow: hidden !important;
              z-index: 99999 !important;
              background: rgba(15, 23, 42, 0.45) !important;
            }

            .add-trip-fullscreen-panel {
              width: 100vw !important;
              height: 100dvh !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              border-radius: 0 !important;
              overflow-y: scroll !important;
              overflow-x: hidden !important;
              background: #fff !important;
              padding-bottom: 260px !important;
              box-sizing: border-box !important;
              overscroll-behavior: contain !important;
            }

            .add-trip-fullscreen-panel .modal-header {
              position: sticky;
              top: 0;
              z-index: 5;
              background: #fff;
            }

            .add-trip-fullscreen-panel .trip-form {
              max-width: 1280px;
              margin: 0 auto;
              padding-bottom: 260px !important;
            }

            .add-trip-fullscreen-panel .form-actions {
              margin-bottom: 160px !important;
              padding-bottom: 80px !important;
            }

            .edit-bottom-scroll-space {
              height: 220px;
              flex-shrink: 0;
            }
          `}</style>

          <div className="modal-content wide-modal add-trip-fullscreen-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">Edit Trip Plan</p>
                <h2>📍 Update Itinerary</h2>
              </div>
              <button className="modal-close" onClick={() => setShowEditPanel(false)}>✕</button>
            </div>

            <form
              className="trip-form"
              onSubmit={(e) => {
                e.preventDefault();
                updateTrip();
              }}
            >
              <div className="form-group full-row">
                <label>Trip Type</label>

                <div className="trip-type-row">
                  <button
                    type="button"
                    className={`trip-type-btn ${editTripType === "single" ? "active" : ""}`}
                    onClick={() => {
                      setEditTripType("single");
                      setEditStops((prev) => [prev[0] || routeStops[0]]);
                    }}
                  >
                    <span>📍</span>
                    <div>
                      <strong>Single Trip</strong>
                      <small>Save this one place</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`trip-type-btn ${editTripType === "multi" ? "active" : ""}`}
                    onClick={() => setEditTripType("multi")}
                  >
                    <span>🧭</span>
                    <div>
                      <strong>Multi-Stop</strong>
                      <small>Choose several places</small>
                    </div>
                  </button>
                </div>
              </div>

              <div className={editTripType === "multi" ? "trip-layout" : "single-layout"}>
                <div className="left-form">
                  <div className="form-group">
                    <label>Destination</label>
                    <input
                      value={editDestination}
                      onChange={(e) => setEditDestination(e.target.value)}
                      placeholder="e.g. Kek Lok Si Temple, Penang, Malaysia"
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={editStartDate}
                      min={todayISO}
                      onChange={(e) => {
                        setEditStartDate(e.target.value);
                        if (editEndDate && e.target.value > editEndDate) setEditEndDate("");
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={editEndDate}
                      min={editStartDate || todayISO}
                      onChange={(e) => setEditEndDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <div className="status-display">
                      {getStatusFromDates(editStartDate, editEndDate) === "upcoming"
                        ? "📅 Upcoming"
                        : getStatusFromDates(editStartDate, editEndDate) === "ongoing"
                        ? "🔄 Ongoing"
                        : "✅ Completed"}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Total Budget (RM)</label>
                    <input
                      type="number"
                      min={0}
                      max={MAX_BUDGET}
                      placeholder="e.g. 1500"
                      value={editBudgetTotal}
                      onChange={(e) =>
                        setEditBudgetTotal(e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add notes, activities, reminders, or travel plans..."
                      rows={5}
                    />
                  </div>
                </div>

                {editTripType === "multi" && (
                  <div className="multi-stop-box">
                    <div className="multi-stop-header">
                      <h3>Plan your route</h3>
                      <p>Choose from all hardcoded Penang places, including attractions, restaurants, hotels, and beaches.</p>
                    </div>

                    <div className="route-preview-card">
                      {editStops.map((stop, index) => (
                        <div className="route-stop" key={`${stop.name}-${index}`}>
                          <div className="route-number">{index + 1}</div>

                          <div className="route-info">
                            <strong>{stop.name}</strong>
                            <span>{stop.address || "Penang, Malaysia"}</span>
                          </div>

                          {index !== 0 && (
                            <button
                              type="button"
                              className="remove-stop-btn"
                              onClick={() => removeEditStop(index)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="choose-stop-box">
                      <label>Choose Next Stop</label>

                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value as StopCategory);
                          setSelectedPlaceName("");
                        }}
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.key} value={cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedPlaceName}
                        onChange={(e) => setSelectedPlaceName(e.target.value)}
                      >
                        <option value="">Select a place</option>
                        {PLACE_OPTIONS[selectedCategory].map((p) => (
                          <option key={`${p.category}-${p.name}`} value={p.name}>
                            {p.name} — {p.category}
                          </option>
                        ))}
                      </select>

                      <button type="button" className="add-stop-btn" onClick={addSelectedStop}>
                        + Add Selected Place
                      </button>
                    </div>

                    <p className="multi-stop-hint">
                      Example: Attraction → Restaurant → Hotel. This saves as one trip card.
                    </p>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditPanel(false)}>
                  Cancel
                </button>

                <button type="submit" className="btn-submit">
                  Update Trip
                </button>
              </div>

              <div className="edit-bottom-scroll-space" aria-hidden="true" />
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Trip?</h3>
            <p style={styles.modalText}>Are you sure you want to delete <strong>{tripData.destination}</strong>? This cannot be undone.</p>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                style={{
                  ...styles.deleteConfirmBtn,
                  opacity: deletingTrip ? 0.7 : 1,
                  cursor: deletingTrip ? "not-allowed" : "pointer",
                }}
                disabled={deletingTrip}
                onClick={async () => {
                  if (deletingTrip) return;

                  try {
                    setDeletingTrip(true);
                    await tripService.deleteTrip(tripData._id);

                    // Tell parent pages / notification components to update immediately
                    notifyTripChanged(tripData._id);

                    setShowDeleteConfirm(false);
                    onDelete?.();
                    onBack();
                  } catch (err) {
                    console.error("Failed to delete trip:", err);
                    alert("Failed to delete trip. Please try again.");
                  } finally {
                    setDeletingTrip(false);
                  }
                }}
              >
                {deletingTrip ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WeatherRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.weatherRow}>
      <span style={styles.weatherLabel}>{label}</span>
      <span style={styles.weatherVal}>{value}</span>
    </div>
  );
}

function BudgetCard({ title, value, background }: { title: string; value: string; background: string }) {
  return (
    <div style={{ ...styles.budgetSummaryCard, background }}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    color: "#111",
    animation: "fadeSlideUp 0.4s ease both",
  },
  layout: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "40px 48px 80px",
    display: "flex",
    flexDirection: "row",
    gap: 28,
    alignItems: "flex-start",
  },
  detailColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    minWidth: 0,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#555",
  },
  actionBtns: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  editBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    color: "#3e84f6",
    background: "#eef4ff",
    fontSize: 13,
    fontWeight: 700,
  },
  deleteBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    color: "#e74c3c",
    background: "#fff5f5",
    fontSize: 13,
    fontWeight: 700,
  },
  tripHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tripTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 30,
    fontWeight: 800,
    color: "#111",
  },
  tripDates: {
    fontSize: 13,
    color: "#a6a6a6",
    fontWeight: 500,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  multiTripBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 20,
    background: "#111827",
  },
  heroWrap: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    height: 260,
  },
  heroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 60%)",
  },
  tabBar: {
    display: "flex",
    borderBottom: "1.5px solid #e5e7eb",
  },
  tab: {
    position: "relative",
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    color: "#777",
  },
  tabActive: {
    color: "#3e84f6",
    fontWeight: 800,
  },
  tabUnderline: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 3,
    background: "#3e84f6",
    borderRadius: 2,
  },
  tabContent: {
    flex: 1,
  },
  newOverviewGrid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 28,
    marginTop: 26,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
  },
  routeCard: {
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 20,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  summaryItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  notesCard: {
    marginTop: 22,
    background: "#f8fafc",
    borderRadius: 18,
    padding: 18,
  },
  routeHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  routeSub: {
    fontSize: 13,
    color: "#64748b",
  },
  routeCount: {
    background: "#eef4ff",
    color: "#2563eb",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12,
    fontWeight: 800,
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  routeStopCard: {
    display: "flex",
    gap: 18,
    padding: 20,
    borderRadius: 20,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  routeNumber: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#3e84f6",
    color: "#fff",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  routeStopInfo: { flex: 1 },
  routeMapBtn: {
    marginTop: 12,
    background: "#eef4ff",
    color: "#2563eb",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 800,
    fontSize: 12,
  },
  infoCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 24,
    border: "1px solid #f0f0f0",
    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
    marginTop: 18,
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: "#111",
  },
  refreshBtn: {
    padding: "7px 13px",
    borderRadius: 9,
    fontSize: 12,
    background: "#eef4ff",
    color: "#3e84f6",
    fontWeight: 800,
  },
  weatherMain: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
  },
  weatherEmoji: { fontSize: 42 },
  weatherTemp: { fontSize: 28, fontWeight: 900, color: "#111" },
  weatherCond: { fontSize: 13, color: "#888", marginTop: 2 },
  weatherDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 18,
  },
  weatherRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherLabel: { fontSize: 13, color: "#a6a6a6", fontWeight: 600 },
  weatherVal: { fontSize: 14, fontWeight: 800, color: "#333" },
  forecastSection: { marginTop: 24 },
  forecastTitle: { fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 12 },
  forecastGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
  },
  forecastCard: {
    background: "linear-gradient(135deg, #eef4ff 0%, #f5f0ff 100%)",
    borderRadius: 16,
    padding: "16px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    border: "1px solid #e8eaed",
    textAlign: "center",
  },
  forecastDate: { fontSize: 11, fontWeight: 800, color: "#3e84f6", textTransform: "uppercase", letterSpacing: 0.5 },
  forecastEmoji: { fontSize: 30 },
  forecastTemp: { fontSize: 16, fontWeight: 800, color: "#111" },
  forecastCondition: { fontSize: 11, color: "#888", fontWeight: 600 },
  forecastSmall: { fontSize: 11, color: "#6b7280", fontWeight: 600 },
  centerMuted: { textAlign: "center", padding: 28, color: "#999" },
  placesStack: { display: "flex", flexDirection: "column", gap: 16 },
  errorText: { textAlign: "center", padding: 24, color: "#e74c3c", fontSize: 13 },
  mutedText: { fontSize: 13, color: "#aaa" },
  poiList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 },
  poiRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 14,
    background: "#f8f9fc",
    borderRadius: 14,
    border: "1px solid #eee",
    gap: 12,
  },
  poiInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  poiActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  distancePill: {
    fontSize: 11,
    fontWeight: 800,
    color: "#3e84f6",
    background: "#eef4ff",
    borderRadius: 99,
    padding: "3px 9px",
  },

  // ── Edit Modal ──
editOverlay: {
  position: "fixed",
  inset: 0,
  background: "#fff",
  zIndex: 300,
  display: "block",
  overflowY: "auto",
  animation: "fadeIn 0.2s ease both",
},

editPanel: {
  width: "100vw",
  height: "100dvh",
  overflowY: "scroll",
  padding: "0 0 260px",
},
  editHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "0 auto 28px",
    paddingBottom: 20,
    borderBottom: "1.5px solid #f1f5f9",
    maxWidth: 1280,
  },
  editEyebrow: {
    color: "#3e84f6",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  editTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 24,
    fontWeight: 900,
    color: "#111",
  },
  closeEditBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    color: "#888",
    background: "#f5f7fa",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  editTwoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 500px",
    gap: 34,
    maxWidth: 1280,
    margin: "0 auto",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  textInput: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111",
    outline: "none",
    background: "#fafafa",
    width: "100%",
    transition: "border-color 0.15s ease",
  },
  textArea: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111",
    outline: "none",
    background: "#fafafa",
    resize: "vertical",
    lineHeight: 1.5,
    width: "100%",
  },
  dateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  dateInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111",
    outline: "none",
    background: "#fafafa",
  },
  statusPreview: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fafafa",
    color: "#111",
    fontSize: 14,
    minHeight: 46,
    display: "flex",
    alignItems: "center",
  },
  routeEditPanel: {
    background: "#f8fafc",
    border: "1.5px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  routeEditTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#111",
  },
  editRoutePreview: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 16,
    padding: 10,
    maxHeight: 220,
    overflowY: "auto",
  },
  editRouteStop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
    borderBottom: "1px solid #f1f5f9",
  },
  editRouteInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
    fontSize: 13,
  },
  chooseStopBox: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  selectInput: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    fontSize: 14,
    outline: "none",
    color: "#111",
  },
  addSelectedBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
  },
  removeStopBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: 900,
    flexShrink: 0,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnRow: {
  position: "sticky",
  bottom: 0,
  background: "#fff",
  padding: "24px 0",
  borderTop: "1px solid #e5e7eb",
  zIndex: 10,
},
  cancelBtn: {
    padding: "12px 28px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    fontWeight: 800,
    color: "#555",
    background: "#fff",
  },
  updateBtn: {
    padding: "12px 32px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
    background: "#3e84f6",
    boxShadow: "0 4px 14px rgba(62,132,246,0.35)",
  },

  // ── Delete Modal ──
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 400,
    animation: "fadeIn 0.2s ease both",
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    padding: 32,
    maxWidth: 400,
    width: "90%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
  },
  modalText: { fontSize: 14, color: "#555", lineHeight: 1.6 },
  modalBtns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 8,
  },
  deleteConfirmBtn: {
    padding: "12px 0",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    background: "#e74c3c",
  },

  // ── Budget ──
  budgetContainer: { display: "flex", flexDirection: "column", gap: 20, marginTop: 18 },
  budgetSummaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  budgetSummaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: "18px 20px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  progressSection: { background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #eee" },
  progressLabel: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 10 },
  progressBarTrack: { background: "#f0f0f0", borderRadius: 99, height: 9, overflow: "hidden" },
  progressBarFill: { height: "100%", background: "#3e84f6", borderRadius: 99, transition: "width 0.4s ease" },
  quickAddSection: { background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #eee" },
  sectionSubtitle: { fontSize: 15, fontWeight: 800, color: "#333", marginBottom: 12 },
  quickAddRow: { display: "flex", gap: 10 },
  addBtn: { padding: "12px 20px", borderRadius: 12, background: "#3e84f6", color: "#fff", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" },
  expensesList: { background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #eee" },
  emptyExpenses: { textAlign: "center", padding: 30, color: "#aaa", background: "#f8f9fc", borderRadius: 12 },
  expenseItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  expenseRight: { display: "flex", alignItems: "center", gap: 12 },
  deleteExpenseBtn: { fontSize: 14, color: "#dc2626", fontWeight: 900 },
  prefChips: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 },
  prefChip: { fontSize: 12, fontWeight: 700, color: "#3e84f6", background: "#eef4ff", borderRadius: 20, padding: "6px 12px" },
};