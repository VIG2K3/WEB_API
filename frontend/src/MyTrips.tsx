import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import TripDetail from "./TripDetail";
import { tripService } from "./services/tripService";
import type { Trip } from "./types/trip";
import { getImageForTrip } from "./services/imageService";

interface MyTripsProps {
  onBack: () => void;
  onTripDeleted?: (id: string) => void;
  onOpenExplorer?: (place: any) => void;
}

export default function MyTrips({ onBack, onTripDeleted, onOpenExplorer }: MyTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filters = ["All", "Upcoming", "Ongoing", "Completed"];

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripService.getAllTripsWithWeather();
      setTrips(data.filter((trip) => !trip.isFavouriteOnly));
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTripStatus = (trip: Trip) => {
    return trip.status || "upcoming";
  };

  const filteredTrips = trips.filter((trip) => {
    if (trip.isFavouriteOnly) return false;
    if (activeFilter === "All") return true;
    return getTripStatus(trip).toLowerCase() === activeFilter.toLowerCase();
  });

  const handleDelete = async (tripId: string) => {
    if (!window.confirm("Delete this trip?")) return;
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
      onTripDeleted?.(tripId);
      setOpenMenuId(null);
      window.dispatchEvent(new CustomEvent("trip-budget-updated"));
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  const handleViewMap = (trip: Trip) => {
    const firstStop = trip.stops?.[0];

    const focusPlace = {
      name: firstStop?.name || trip.destination,
      address: firstStop?.address || trip.address || "Penang, Malaysia",
      lat: firstStop?.lat || trip.lat,
      lon: firstStop?.lon || trip.lon,
      category: firstStop?.category || trip.category || trip.type || "tourism",
      type: firstStop?.category || trip.type || trip.category || "tourism",
    };

    if (!focusPlace.lat || !focusPlace.lon) {
      alert("Map location is not available for this trip.");
      return;
    }

    setOpenMenuId(null);
    onOpenExplorer?.(focusPlace);
  };

const handleMarkCompleted = async (trip: Trip, e: React.MouseEvent) => {
  e.stopPropagation();
  const confirmComplete = window.confirm(
    `Are you sure you want to mark "${trip.destination}" as completed?`
  );
  if (!confirmComplete) return;
  try {
    // Single combined update — prevents second call from overwriting status
    await tripService.updateTrip(trip._id, {
      status: "completed",
      budget: { total: trip.budget?.total || 0, items: [] },
    });

    setTrips((prev) =>
      prev.map((t) =>
        t._id === trip._id
          ? { ...t, status: "completed", budget: { total: t.budget?.total || 0, items: [] } }
          : t
      )
    );

    window.dispatchEvent(new CustomEvent("trip-budget-updated"));
    setTimeout(() => alert("Trip marked as completed successfully!"), 0);
  } catch (err) {
    console.error("Failed to mark completed:", err);
    alert("Failed to mark trip as completed.");
  }
};

  if (selectedTrip) {
    return (
      <TripDetail
        trip={selectedTrip}
        onBack={() => setSelectedTrip(null)}
        onDelete={() => {
          setTrips((prev) => prev.filter((t) => t._id !== selectedTrip._id));
          onTripDeleted?.(selectedTrip._id);
          setSelectedTrip(null);
        }}
        source="mytrips"
        onOpenExplorer={onOpenExplorer}
      />
    );
  }

  return (
    <div style={styles.root} onClick={() => setOpenMenuId(null)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { background: #f0ede8; }
        button { font-family: inherit; cursor: pointer; border: none; }
        .trip-card:hover { transform: translateY(-3px); box-shadow: 0 16px 36px rgba(15,23,42,0.12) !important; }
        .complete-btn {
          transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .complete-btn:hover {
          background: #f0fdf4 !important;
          transform: translateY(-1px);
        }
      `}</style>

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <button style={styles.backBtn} onClick={onBack}>
              ← BACK
            </button>
            <h1 style={styles.pageTitle}>My Trips</h1>
            <p style={styles.pageSub}>
              {trips.length} trip{trips.length !== 1 ? "s" : ""} planned
            </p>
          </div>

          <button style={styles.addTripBtn} onClick={() => onOpenExplorer?.(null)}>
            + Add Trip
          </button>
        </div>

        <div style={styles.filterRow}>
          {filters.map((filter) => (
            <button
              key={filter}
              style={{
                ...styles.filterBtn,
                ...(activeFilter === filter ? styles.filterBtnActive : {}),
              }}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading && (
          <div style={styles.emptyState}>
            <p style={{ color: "#999" }}>Loading trips...</p>
          </div>
        )}

        {!loading && filteredTrips.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🗺️</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#374151" }}>
              No trips found
            </h3>
            <p style={{ color: "#9ca3af", marginTop: 6, fontSize: 14 }}>
              {activeFilter === "All"
                ? "Start planning your first Penang trip."
                : `No ${activeFilter.toLowerCase()} trips found.`}
            </p>
          </div>
        )}

        {!loading && filteredTrips.length > 0 && (
          <div style={styles.tripsGrid}>
            {filteredTrips.map((trip) => {
              const weather = trip.weather || {
                icon: "🌤️",
                temp: "N/A",
                condition: "Upcoming",
              };

              const status = getTripStatus(trip);

              const isMulti =
                trip.tripType === "multi" &&
                trip.stops &&
                trip.stops.length > 1;

              return (
                <div
                  key={trip._id}
                  className="trip-card"
                  style={styles.tripCard}
                  onClick={() => setSelectedTrip(trip)}
                >
                  {/* ── Image area ── */}
                  <div style={styles.cardImageWrap}>
                    <img
                      src={getImageForTrip(trip)}
                      alt={trip.destination}
                      style={styles.cardImage}
                    />
                    <div style={styles.cardOverlay} />

                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                          status === "upcoming"
                            ? "#3e84f6"
                            : status === "ongoing"
                            ? "#22c55e"
                            : "#6b7280",
                      }}
                    >
                      {status}
                    </span>

                    <div style={styles.topActions}>
                      <div style={{ position: "relative" }}>
                        <button
                          style={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === trip._id ? null : trip._id);
                          }}
                          title="More"
                        >
                          ⋮
                        </button>

                        {openMenuId === trip._id && (
                          <div
                            style={styles.dropdownMenu}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              style={styles.dropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewMap(trip);
                              }}
                            >
                              🗺 View Map
                            </button>
                            <button
                              style={styles.dropdownDelete}
                              onClick={() => handleDelete(trip._id)}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <span style={styles.categoryBadge}>
                      {trip.category || trip.type || "Attraction"}
                    </span>

                    {isMulti && (
                      <span style={styles.multiBadge}>
                        🧭 {trip.stops?.length || 0} Stops
                      </span>
                    )}
                  </div>

                  {/* ── Card body ── */}
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>
                      {trip.destination}, {trip.country}
                    </h3>

                    <p style={styles.cardAddress}>
                      {trip.address || "Penang, Malaysia"}
                    </p>

                    {trip.description && (
                      <p style={styles.cardDesc}>{trip.description}</p>
                    )}

                    <p style={styles.cardDates}>{trip.dates}</p>

                    <div style={styles.cardWeather}>
                      <span style={styles.weatherIcon}>{weather.icon}</span>
                      <strong style={{ fontSize: 13 }}>{weather.temp}</strong>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>
                        {weather.condition}
                      </span>
                    </div>

                    {isMulti ? (
                      <div style={styles.routePreview}>
                        <div style={styles.routePreviewHeader}>
                          <span>Route Preview</span>
                          <strong>{trip.stops?.length || 0} stops</strong>
                        </div>
                        <div style={styles.routeChips}>
                          {trip.stops?.slice(0, 3).map((stop, index) => (
                            <span key={`${stop.name}-${index}`} style={styles.routeChip}>
                              {index + 1}. {stop.name}
                            </span>
                          ))}
                          {(trip.stops?.length || 0) > 3 && (
                            <span style={styles.routeChip}>
                              +{(trip.stops?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : trip.attractions?.length ? (
                      <div style={styles.routeChips}>
                        {trip.attractions.slice(0, 2).map((a, index) => (
                          <span key={`${a.name}-${index}`} style={styles.routeChip}>
                            {a.name} · {a.distance}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* ── Footer ── */}
                    <div style={styles.cardFooter}>
                      {status !== "completed" ? (
                        <button
                          className="complete-btn"
                          style={styles.completedBtn}
                          onClick={(e) => handleMarkCompleted(trip, e)}
                        >
                          ✓ Mark as Completed
                        </button>
                      ) : (
                        <span style={styles.completedPill}>✅ Completed</span>
                      )}
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

const styles: Record<string, CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#f0ede8",
    fontFamily: "'DM Sans', sans-serif",
    color: "#111827",
  },
  main: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "36px 40px 80px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  backBtn: {
    color: "#3e84f6",
    fontWeight: 800,
    background: "transparent",
    padding: 0,
    marginBottom: 10,
    fontSize: 13,
  },
  pageTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 30,
    fontWeight: 900,
    margin: 0,
  },
  pageSub: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 4,
  },
  addTripBtn: {
    padding: "11px 20px",
    borderRadius: 12,
    background: "#3e84f6",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    boxShadow: "0 8px 20px rgba(62,132,246,0.25)",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    padding: "8px 18px",
    borderRadius: 999,
    background: "#fff",
    color: "#555",
    border: "1.5px solid #e5e7eb",
    fontWeight: 700,
    fontSize: 13,
    transition: "all 0.15s ease",
  },
  filterBtnActive: {
    background: "#3e84f6",
    color: "#fff",
    borderColor: "#3e84f6",
  },
  tripsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
  },
  tripCard: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 4px 18px rgba(15,23,42,0.07)",
    border: "1px solid rgba(226,232,240,0.8)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
  },
  cardImageWrap: {
    position: "relative",
    height: 185,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.36), rgba(0,0,0,0.02) 55%)",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: "5px 11px",
    borderRadius: 999,
    color: "#fff",
    fontWeight: 900,
    fontSize: 11,
    textTransform: "capitalize",
    boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
  },
  topActions: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 6,
    zIndex: 5,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "rgba(255,255,255,0.92)",
    color: "#111827",
    fontSize: 15,
    fontWeight: 900,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  },
  dropdownMenu: {
    position: "absolute",
    top: 38,
    right: 0,
    width: 152,
    background: "#fff",
    borderRadius: 12,
    padding: 6,
    boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
    border: "1px solid #e5e7eb",
    zIndex: 20,
  },
  dropdownItem: {
    width: "100%",
    textAlign: "left",
    padding: "9px 11px",
    borderRadius: 8,
    background: "#fff",
    color: "#374151",
    fontWeight: 700,
    fontSize: 13,
  },
  dropdownDelete: {
    width: "100%",
    textAlign: "left",
    padding: "9px 11px",
    borderRadius: 8,
    background: "#fff5f5",
    color: "#dc2626",
    fontWeight: 800,
    fontSize: 13,
  },
  categoryBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    padding: "5px 11px",
    borderRadius: 999,
    background: "#8b5cf6",
    color: "#fff",
    fontWeight: 900,
    fontSize: 11,
  },
  multiBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    padding: "5px 11px",
    borderRadius: 999,
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    fontSize: 11,
  },
  cardBody: {
    padding: "16px 18px 14px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  cardAddress: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 6,
  },
  cardDesc: {
    color: "#4b5563",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 8,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardDates: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
  },
  cardWeather: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#f8fafc",
    borderRadius: 12,
    padding: "8px 12px",
    color: "#6b7280",
    marginBottom: 10,
  },
  weatherIcon: {
    fontSize: 16,
  },
  routePreview: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    border: "1px solid #e5e7eb",
    marginBottom: 10,
  },
  routePreviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#3e84f6",
    fontSize: 11,
    fontWeight: 900,
    marginBottom: 8,
  },
  routeChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  routeChip: {
    padding: "5px 9px",
    borderRadius: 999,
    background: "#eef2f7",
    color: "#374151",
    fontWeight: 700,
    fontSize: 11,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    marginTop: "auto",
    paddingTop: 12,
    gap: 8,
  },
  // ── Matches Homepage pill style exactly ──
  completedBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 999,
    border: "2px solid #22c55e",
    background: "#ffffff",
    color: "#16a34a",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  completedPill: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#6b7280",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
    display: "inline-block",
  },
  viewDetailsBtn: {
    color: "#3e84f6",
    fontWeight: 800,
    background: "transparent",
    fontSize: 12,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  emptyState: {
    minHeight: 260,
    background: "#fff",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
    boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
};