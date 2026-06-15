import React, { useState } from "react";
import { Place, Trip, TripStop } from "../types/trip";
import "../styles/AddTripModal.css";

interface AddTripModalProps {
  place: Place;
  onClose: () => void;
  onSubmit: (tripData: Omit<Trip, "_id">) => void;
  loading?: boolean;
}

type TripType = "single" | "multi";
type StopCategory = "all" | "tourism" | "restaurant" | "hotel" | "beach";
type RealStopCategory = Exclude<StopCategory, "all">;

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

const toStops = (category: RealStopCategory): TripStop[] =>
  FAMOUS_PLACES_FRONTEND[category].map((place) => ({
    ...place,
    category,
  }));

const PLACE_OPTIONS: Record<RealStopCategory, TripStop[]> = {
  tourism: toStops("tourism"),
  restaurant: toStops("restaurant"),
  hotel: toStops("hotel"),
  beach: toStops("beach"),
};

const ALL_PLACE_OPTIONS: TripStop[] = [
  ...PLACE_OPTIONS.tourism,
  ...PLACE_OPTIONS.restaurant,
  ...PLACE_OPTIONS.hotel,
  ...PLACE_OPTIONS.beach,
];

export default function AddTripModal({ place, onClose, onSubmit, loading = false }: AddTripModalProps) {
  const [tripType, setTripType] = useState<TripType>("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");

  const [stops, setStops] = useState<TripStop[]>([
    {
      name: place.name,
      address: place.address || "Penang, Malaysia",
      lat: place.lat,
      lon: place.lon,
      category: place.type || "tourism",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<StopCategory>("all");
  const [selectedPlaceName, setSelectedPlaceName] = useState("");

  const todayISO = new Date().toISOString().split("T")[0];

  const getStatus = () => {
    if (!startDate) return "upcoming";

    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (today < start) return "upcoming";
    if (end && today > end) return "completed";
    return "ongoing";
  };

  const selectedStatus = getStatus();

  const getAvailableStops = () => {
    return selectedCategory === "all"
      ? ALL_PLACE_OPTIONS
      : PLACE_OPTIONS[selectedCategory];
  };

  const addSelectedStop = () => {
    const selectedPlace = getAvailableStops().find(
      (p) => p.name === selectedPlaceName
    );

    if (!selectedPlace) {
      alert("Please choose a place first.");
      return;
    }

    const alreadyAdded = stops.some((s) => s.name === selectedPlace.name);
    if (alreadyAdded) {
      alert("This place is already added.");
      return;
    }

    setStops((prev) => [...prev, selectedPlace]);
    setSelectedPlaceName("");
  };

  const removeStop = (index: number) => {
    if (index === 0) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      alert("End date cannot be before start date.");
      return;
    }

    if (tripType === "multi" && stops.length < 2) {
      alert("Please add at least one more stop.");
      return;
    }

    const finalBudgetTotal = parseFloat(budgetTotal);

    if (budgetTotal && (Number.isNaN(finalBudgetTotal) || finalBudgetTotal < 0)) {
      alert("Please enter a valid budget amount.");
      return;
    }

    if (finalBudgetTotal > MAX_BUDGET) {
      alert("Budget cannot exceed RM 10,000.");
      return;
    }

    const tripStops = tripType === "multi" ? stops : [stops[0]];

    const tripData: Omit<Trip, "_id"> = {
      destination: tripType === "multi" ? `${place.name} Multi-Stop Trip` : place.name,
      country: "Penang, Malaysia",
      dates: startDate && endDate ? `${startDate} to ${endDate}` : "Flexible dates",
      startDate,
      endDate,
      image: "https://placehold.co/640x480?text=Penang+Trip",
      address: place.address || "",
      description: place.desc || "",
      type: place.type || "",
      lat: place.lat,
      lon: place.lon,
      weather: {
        temp: "N/A",
        condition: "Upcoming",
        humidity: "N/A",
        wind: "N/A",
        feelsLike: "N/A",
        icon: "🌤️",
      },
      attractions: [],
      notes,
      preferences: "",
      status: selectedStatus,
      favourited: false,
      tripType,
      stops: tripStops,
      budget: {
        total: finalBudgetTotal || 0,
        items: [],
      },
    };

    onSubmit(tripData);
  };

  return (
    <div className="modal-overlay add-trip-fullscreen-overlay" onClick={onClose}>
      <style>{`
        .add-trip-fullscreen-overlay {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          padding: 0 !important;
          display: block !important;
          overflow: hidden !important;
          z-index: 9999 !important;
          background: rgba(15, 23, 42, 0.45) !important;
        }

        .add-trip-fullscreen-panel {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
          margin: 0 !important;
          border-radius: 0 !important;
          overflow-y: auto !important;
          background: #fff !important;
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
        }
      `}</style>
      <div className="modal-content wide-modal add-trip-fullscreen-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Create Trip</p>
            <h2>📍 {place.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-group full-row">
            <label>Trip Type</label>

            <div className="trip-type-row">
              <button
                type="button"
                className={`trip-type-btn ${tripType === "single" ? "active" : ""}`}
                onClick={() => setTripType("single")}
              >
                <span>📍</span>
                <div>
                  <strong>Single Trip</strong>
                  <small>Save this one place</small>
                </div>
              </button>

              <button
                type="button"
                className={`trip-type-btn ${tripType === "multi" ? "active" : ""}`}
                onClick={() => setTripType("multi")}
              >
                <span>🧭</span>
                <div>
                  <strong>Multi-Stop</strong>
                  <small>Choose several places</small>
                </div>
              </button>
            </div>
          </div>

          <div className={tripType === "multi" ? "trip-layout" : "single-layout"}>
            <div className="left-form">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayISO}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate("");
                  }}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayISO}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="status-display">
                  {selectedStatus === "upcoming"
                    ? "📅 Upcoming"
                    : selectedStatus === "ongoing"
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
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, activities, reminders, or travel plans..."
                  rows={5}
                />
              </div>
            </div>

            {tripType === "multi" && (
              <div className="multi-stop-box">
                <div className="multi-stop-header">
                  <h3>Plan your route</h3>
                  <p>Choose from all hardcoded Penang places, including attractions, restaurants, hotels, and beaches.</p>
                </div>

                <div className="route-preview-card">
                  {stops.map((stop, index) => (
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
                          onClick={() => removeStop(index)}
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
                    {getAvailableStops().map((p) => (
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
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Saving..." : tripType === "multi" ? "Save Multi-Stop Trip" : "Save Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}