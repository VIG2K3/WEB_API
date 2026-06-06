import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import TripDetail from "./TripDetail";
import { tripService } from "./services/tripService";
import type { Trip } from "./types/trip";
import { getImageForTrip } from './services/imageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyTripsProps {
  onBack: () => void;
  onTripDeleted?: (id: string) => void;
  onOpenExplorer?: (place: any) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyTrips({ onBack, onTripDeleted, onOpenExplorer }: MyTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [flashingTripId, setFlashingTripId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filters = ["All", "Upcoming", "Ongoing", "Completed"];

  // Helper to get category colors for badges
  const getCategoryColor = (category: string): string => {
    const colors = {
      'Attraction': '#8b5cf6',
      'Beaches': '#06b6d4',
      'Hotels': '#f59e0b',
      'Restaurants': '#ef4444'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await tripService.getAllTripsWithWeather();
        setTrips(data);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === "All") return true;
    return trip.status.toLowerCase() === activeFilter.toLowerCase();
  });

  // ── Mark a trip as completed ──
  const handleMarkCompleted = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    try {
      setFlashingTripId(tripId);
      await tripService.updateTripStatus(tripId, "completed");
      setTimeout(() => {
        setFlashingTripId(null);
        setTrips((prev) =>
          prev.map((t) => (t._id === tripId ? { ...t, status: "completed" } : t))
        );
      }, 800);
    } catch (err) {
      console.error("Failed to update trip status:", err);
      setFlashingTripId(null);
    }
  };

  // ── Delete a trip ──
  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== tripId) {
      // First click: ask for confirmation
      setConfirmDeleteId(tripId);
      return;
    }
    // Second click: confirmed, delete
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
      onTripDeleted?.(tripId);
    } catch (err) {
      console.error("Failed to delete trip:", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // ── If a trip is selected, show TripDetail ──
  if (selectedTrip !== null) {
    const tripData = trips.find((t) => t._id === selectedTrip);
    if (!tripData) return null;
    return (
      <TripDetail
        trip={tripData}
        onBack={() => setSelectedTrip(null)}
        onDelete={() => {
          setTrips((prev) => prev.filter((t) => t._id !== selectedTrip));
          onTripDeleted?.(selectedTrip);
          setSelectedTrip(null);
        }}
        onOpenExplorer={(place) => {
          onOpenExplorer?.(place);
        }}
      />
    );
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
        @keyframes flashGreen {
          0%   { background: #f0fdf4; color: #16a34a; border-color: #22c55e; }
          40%  { background: #22c55e; color: #fff; border-color: #22c55e; box-shadow: 0 0 12px rgba(34,197,94,0.5); }
          100% { background: #22c55e; color: #fff; border-color: #22c55e; }
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
            {filteredTrips.map((trip) => {
              const weather = trip.weather || { icon: '🌤️', temp: 'N/A', condition: 'Upcoming' };
              const isCompleted = trip.status === "completed";
              const isFlashing = flashingTripId === trip._id;
              const isConfirmingDelete = confirmDeleteId === trip._id;

              return (
                <div
                  key={trip._id}
                  style={{
                    ...styles.tripCard,
                    ...(hoveredCard === trip._id ? styles.tripCardHovered : {}),
                  }}
                  onMouseEnter={() => setHoveredCard(trip._id)}
                  onMouseLeave={() => {
                    setHoveredCard(null);
                    // Cancel pending delete confirm if user mouses away
                    if (confirmDeleteId === trip._id) setConfirmDeleteId(null);
                  }}
                  onClick={() => setSelectedTrip(trip._id)}
                >
                  {/* Image with TripImage component */}
                  <div style={styles.cardImageWrap}>
                    <img 
                      src={getImageForTrip(trip)} 
                      alt={trip.destination}
                      style={styles.cardImage}
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.currentTarget;
                        const category = trip.category || 'Attraction';
                        const colors: Record<string, string> = {
                          'Attraction': '#8b5cf6',
                          'Beaches': '#06b6d4',
                          'Hotels': '#f59e0b',
                          'Restaurants': '#ef4444'
                        };
                        const icons: Record<string, string> = {
                          'Attraction': '🏛️',
                          'Beaches': '🏖️',
                          'Hotels': '🏨',
                          'Restaurants': '🍽️'
                        };
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.style.cssText = `
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: ${colors[category]};
                            color: white;
                            font-size: 48px;
                          `;
                          fallback.innerHTML = icons[category];
                          parent.insertBefore(fallback, target);
                        }
                      }}
                    />
  <div style={styles.cardImageOverlay} />
                    
                    {/* Status Badge */}
                    <span style={{
                      ...styles.statusBadge,
                      background:
                        trip.status === "upcoming" ? "#3e84f6"
                        : trip.status === "ongoing" ? "#22c55e"
                        : "#a6a6a6",
                    }}>
                      {trip.status}
                    </span>
                    
                    {/* Category Badge */}
                    {trip.category && (
                      <span style={{
                        ...styles.categoryBadge,
                        background: getCategoryColor(trip.category),
                      }}>
                        {trip.category}
                      </span>
                    )}
                  </div>

                  {/* Body — flex column so action row always at bottom */}
                  <div style={styles.cardBody}>
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardCity}>{trip.destination}, {trip.country}</h3>
                      <p style={styles.cardAddress}>{trip.address || 'Penang, Malaysia'}</p>
                      {trip.description ? <p style={styles.cardDesc}>{trip.description}</p> : null}
                      <p style={styles.cardDates}>{trip.dates}</p>
                      <div style={styles.cardWeather}>
                        <span style={styles.cardWeatherIcon}>{weather.icon}</span>
                        <span style={styles.cardWeatherTemp}>{weather.temp}</span>
                        <span style={styles.cardWeatherCond}>{weather.condition}</span>
                      </div>
                      {trip.attractions?.length ? (
                        <div style={styles.cardAttractions}>
                          {trip.attractions.slice(0, 2).map((a, idx) => (
                            <span key={`${a.name}-${idx}`} style={styles.attractionChip}>
                              {a.name} · {a.distance}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Action row — always pinned to bottom, centered */}
                    <div style={styles.cardActions}>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkCompleted(e, trip._id)}
                          disabled={isFlashing}
                          style={{
                            ...styles.markCompletedBtn,
                            ...(isFlashing ? styles.markCompletedBtnFlashing : {}),
                          }}
                        >
                          ✓ Mark as Completed
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, trip._id)}
                        style={{
                          ...styles.deleteBtn,
                          ...(isConfirmingDelete ? styles.deleteBtnConfirm : {}),
                        }}
                      >
                        {isConfirmingDelete ? "Sure?" : "🗑 Delete Trip"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
  // Card uses flex column so body stretches full height
  tripCard: { background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease", display: "flex", flexDirection: "column" },
  tripCardHovered: { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(62,132,246,0.15)" },
  cardImageWrap: { position: "relative", height: 180, overflow: "hidden", flexShrink: 0 },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImageOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" },
  statusBadge: { position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" },
  // Category badge style
  categoryBadge: { 
    position: "absolute", 
    bottom: 10, 
    left: 10, 
    fontSize: 11, 
    fontWeight: 700, 
    color: "#fff", 
    padding: "4px 12px", 
    borderRadius: 20, 
    textTransform: "capitalize", 
    zIndex: 2, 
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)" 
  },
  // Body fills remaining height and pushes actions to bottom
  cardBody: { padding: "14px 16px 14px", display: "flex", flexDirection: "column", flex: 1 },
  cardContent: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  cardCity: { fontSize: 15, fontWeight: 700, color: "#111" },
  cardAddress: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginTop: 2 },
  cardDesc: { fontSize: 12, color: "#4b5563", lineHeight: 1.4, marginTop: 4 },
  cardAttractions: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  attractionChip: { fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 999, padding: "6px 10px" },
  cardDates: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  cardWeather: { display: "flex", alignItems: "center", gap: 6, background: "#f8f9fb", borderRadius: 10, padding: "7px 12px", marginTop: 4 },
  cardWeatherIcon: { fontSize: 16 },
  cardWeatherTemp: { fontWeight: 700, fontSize: 14, color: "#111" },
  cardWeatherCond: { fontSize: 12, color: "#a6a6a6" },
  // Action row: pinned at bottom, horizontally centered
  cardActions: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f3f4f6" },
  markCompletedBtn: { padding: "8px 16px", borderRadius: 999, border: "1.5px solid #22c55e", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.2s, color 0.2s, box-shadow 0.2s", whiteSpace: "nowrap" },
  markCompletedBtnFlashing: { animation: "flashGreen 0.8s ease forwards", cursor: "default" },
  deleteBtn: { padding: "8px 12px", borderRadius: 999, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  deleteBtnConfirm: { border: "1.5px solid #ef4444", background: "#fef2f2", color: "#dc2626" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#333" },
  emptyText: { fontSize: 14, color: "#a6a6a6" },
};