import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import TripDetail from "./TripDetail";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trip {
  _id: string;
  city: string;
  country: string;
  dates: string;
  startDate: string;
  endDate: string;
  image: string;
  weather: {
    temp: string;
    condition: string;
    humidity: string;
    wind: string;
    feelsLike: string;
    icon: string;
  };
  attractions: { name: string; image: string; distance: string }[];
  notes: string;
  preferences: string;
  status: string;
}

interface MyTripsProps {
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyTrips({ onBack }: MyTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const filters = ["All", "Upcoming", "Ongoing", "Completed"];

  useEffect(() => {
    fetch("http://localhost:5000/api/trips")
      .then((res) => res.json())
      .then((data: Trip[]) => {
        setTrips(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch trips:", err);
        setLoading(false);
      });
  }, []);

  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === "All") return true;
    return trip.status.toLowerCase() === activeFilter.toLowerCase();
  });

  // ── If a trip is selected, show TripDetail ──
  if (selectedTrip !== null) {
    const tripData = trips.find((t) => t._id === selectedTrip);
    if (!tripData) return null;
    return <TripDetail trip={tripData} onBack={() => setSelectedTrip(null)} />;
  }

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main style={styles.main}>

        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <button style={styles.backBtn} onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Homepage
            </button>
            <h1 style={styles.pageTitle}>My Trips</h1>
            <p style={styles.pageSub}>{trips.length} trip{trips.length !== 1 ? "s" : ""} planned</p>
          </div>
          <button style={styles.newTripBtn}>+ New Trip</button>
        </div>

        {/* Filters */}
        <div style={styles.filterRow}>
          {filters.map((f) => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                ...(activeFilter === f ? styles.filterBtnActive : {}),
              }}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading trips...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTrips.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🗺️</span>
            <p style={styles.emptyTitle}>No trips found</p>
            <p style={styles.emptyText}>
              {activeFilter === "All"
                ? "You haven't planned any trips yet."
                : `No ${activeFilter.toLowerCase()} trips.`}
            </p>
          </div>
        )}

        {/* Trips Grid */}
        {!loading && filteredTrips.length > 0 && (
          <div style={styles.tripsGrid}>
            {filteredTrips.map((trip) => (
              <div
                key={trip._id}
                style={{
                  ...styles.tripCard,
                  ...(hoveredCard === trip._id ? styles.tripCardHovered : {}),
                }}
                onMouseEnter={() => setHoveredCard(trip._id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedTrip(trip._id)}
              >
                {/* Image */}
                <div style={styles.cardImageWrap}>
                  <img src={trip.image} alt={trip.city} style={styles.cardImage} />
                  <div style={styles.cardImageOverlay} />
                  <span style={{
                    ...styles.statusBadge,
                    background: trip.status === "upcoming" ? "#3e84f6"
                      : trip.status === "ongoing" ? "#22c55e"
                      : "#a6a6a6",
                  }}>
                    {trip.status}
                  </span>
                </div>

                {/* Body */}
                <div style={styles.cardBody}>
                  <h3 style={styles.cardCity}>{trip.city}, {trip.country}</h3>
                  <p style={styles.cardDates}>{trip.dates}</p>
                  <div style={styles.cardWeather}>
                    <span style={styles.cardWeatherIcon}>{trip.weather.icon}</span>
                    <span style={styles.cardWeatherTemp}>{trip.weather.temp}</span>
                    <span style={styles.cardWeatherCond}>{trip.weather.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  root: { fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f7fa" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "48px 48px 80px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeSlideUp 0.4s ease both" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  backBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 10 },
  pageTitle: { fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#111" },
  pageSub: { fontSize: 14, color: "#a6a6a6", marginTop: 4 },
  newTripBtn: { padding: "10px 22px", borderRadius: 12, background: "#3e84f6", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" },
  filterRow: { display: "flex", gap: 8 },
  filterBtn: { padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, color: "#555", background: "#fff", border: "1.5px solid #e8eaed", cursor: "pointer" },
  filterBtnActive: { background: "#3e84f6", color: "#fff", borderColor: "#3e84f6" },
  tripsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  tripCard: { background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
  tripCardHovered: { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(62,132,246,0.15)" },
  cardImageWrap: { position: "relative", height: 180, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImageOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" },
  statusBadge: { position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" },
  cardBody: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6 },
  cardCity: { fontSize: 15, fontWeight: 700, color: "#111" },
  cardDates: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  cardWeather: { display: "flex", alignItems: "center", gap: 6, background: "#f8f9fb", borderRadius: 10, padding: "7px 12px", marginTop: 4 },
  cardWeatherIcon: { fontSize: 16 },
  cardWeatherTemp: { fontWeight: 700, fontSize: 14, color: "#111" },
  cardWeatherCond: { fontSize: 12, color: "#a6a6a6" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#333" },
  emptyText: { fontSize: 14, color: "#a6a6a6" },
};
