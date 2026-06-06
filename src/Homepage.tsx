import { useState, useEffect } from "react";
import { CSSProperties } from "react";
import logo from "./assets/bg_remove_logo.png";

import TripDetail from "./TripDetail";
import MyTrips from "./MyTrips";
import SettingsProfile from "./SettingsProfile";
import PenangExplorer from "./PenangExplorer";
import { tripService } from "./services/tripService";
import type { Trip } from "./types/trip";
import { TripImage } from './components/TripImage';
import { getImageForTrip, determineCategory } from './services/imageService';
import SmartRecommendations from "./chatbot";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEATHER_DAYS = [
  { day: "Mon", icon: "☀️", hi: 33, lo: 26 },
  { day: "Tue", icon: "⛅", hi: 31, lo: 25 },
  { day: "Wed", icon: "🌧️", hi: 29, lo: 24 },
  { day: "Thu", icon: "🌦️", hi: 30, lo: 25 },
  { day: "Fri", icon: "☀️", hi: 34, lo: 27 },
];

interface Stat {
  label: string;
  value: number | string;
  icon: string;
  accent: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Homepage() {
  // ── Your original state ──
  const [explorerFocusPlace, setExplorerFocusPlace] = useState<any>(null);
  const [activeNav,          setActiveNav]          = useState<string>("Dashboard");
  const [hoveredCard,        setHoveredCard]        = useState<string | null>(null);
  const [trips,              setTrips]              = useState<Trip[]>([]);
  const [isLoading,          setIsLoading]          = useState<boolean>(true);
  const [selectedTrip,       setSelectedTrip]       = useState<string | null>(null);
  const [showMyTrips,        setShowMyTrips]        = useState<boolean>(false);
  const [showSettings,       setShowSettings]       = useState<boolean>(false);
  const [showPenangExplorer, setShowPenangExplorer] = useState<boolean>(false);
  const [showRecommendations,setShowRecommendations]= useState<boolean>(false);
  const [openMenuId,         setOpenMenuId]         = useState<string | null>(null);
  const [confirmDeleteId,    setConfirmDeleteId]    = useState<string | null>(null);
  const [activeTab,          setActiveTab]          = useState<"upcoming" | "completed">("upcoming");
  const [currentTime,        setCurrentTime]        = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  // ── Your original fetch ──
  const refreshUpcomingTrips = async () => {
    setIsLoading(true);
    try {
      const allTrips = await tripService.getAllTripsWithWeather();
      const upcomingTrips = allTrips.filter(t => !t.status || t.status === "upcoming" || t.status === "ongoing");
      setTrips(upcomingTrips);
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refreshUpcomingTrips(); }, []);

  useEffect(() => {
    if (trips.length > 0) {
      trips.forEach((trip, index) => {
        const determinedCat = determineCategory(trip.destination);
        const imageUrl = getImageForTrip(trip);
        console.log(`Trip ${index + 1}:`, { 'Destination': trip.destination, 'Detected Category': determinedCat, 'Image URL': imageUrl });
      });
    }
  }, [trips]);

  // ── Your original delete ──
  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== tripId) { setConfirmDeleteId(tripId); return; }
    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
    } catch (err) {
      console.error("Failed to delete trip:", err);
    } finally {
      setConfirmDeleteId(null);
      setOpenMenuId(null);
    }
  };

  const handleTripDeleted = (id: string) => {
    setTrips((prev) => prev.filter((trip) => trip._id !== id));
  };

  // ── Your original sub-page routing ──
  if (showSettings) {
    return <SettingsProfile onBack={() => { setShowSettings(false); setActiveNav("Dashboard"); }} />;
  }
  if (showPenangExplorer) {
    return (
      <PenangExplorer
        onBack={() => { setShowPenangExplorer(false); setActiveNav("Dashboard"); setExplorerFocusPlace(null); refreshUpcomingTrips(); }}
        onTripAdded={() => refreshUpcomingTrips()}
        focusPlace={explorerFocusPlace}
      />
    );
  }
  if (showRecommendations) {
    return (
      <div>
        <div style={{ padding: "12px 24px", background: "#fff", borderBottom: "1px solid #ece9e3", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => { setShowRecommendations(false); setActiveNav("Dashboard"); }}
            style={{ fontSize: 13, fontWeight: 600, color: "#6c63ff", background: "#6c63ff12", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <SmartRecommendations />
      </div>
    );
  }
  if (showMyTrips) {
    return (
      <MyTrips
        onBack={() => { setShowMyTrips(false); setActiveNav("Dashboard"); refreshUpcomingTrips(); }}
        onTripDeleted={handleTripDeleted}
        onOpenExplorer={(place) => {
          setShowMyTrips(false);
          setExplorerFocusPlace(place);
          setShowPenangExplorer(true);
          setActiveNav("Penang Explorer");
        }}
      />
    );
  }
  if (selectedTrip !== null) {
    const tripData = trips.find((t) => t._id === selectedTrip);
    if (!tripData) return null;
    return (
      <TripDetail
        trip={tripData}
        onBack={() => { setSelectedTrip(null); setActiveNav("Dashboard"); }}
        onDelete={() => { setTrips((prev) => prev.filter((t) => t._id !== selectedTrip)); setSelectedTrip(null); setActiveNav("Dashboard"); }}
        source="home"
        onOpenExplorer={(place) => { setSelectedTrip(null); setExplorerFocusPlace(place); setShowPenangExplorer(true); setActiveNav("Penang Explorer"); }}
      />
    );
  }

  // ── Derived ──
  const hour     = currentTime.getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 17 ? "Good Afternoon!" : "Good Evening!";
  const timeStr  = currentTime.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  const dateStr  = currentTime.toLocaleDateString("en-MY", { weekday: "long", month: "long", day: "numeric" });
  const filtered = trips.filter((t) => t.status === activeTab);

  const storedUser   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userName     = storedUser?.name || "Traveller";
  const avatarLetter = userName.charAt(0).toUpperCase();

  const stats: Stat[] = [
    { label: "Total Trips",   value: trips.length, icon: "✈️", accent: "#2a9d8f" },
    { label: "Spots Saved",   value: 0,            icon: "📍", accent: "#e76f51" },
    {
      label: "Days Explored",
      value: trips.reduce((acc, t) => {
        if (t.startDate && t.endDate)
          return acc + Math.ceil((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000);
        return acc;
      }, 0),
      icon: "🗓️", accent: "#6c63ff",
    },
    { label: "Favourites", value: 0, icon: "❤️", accent: "#e63946" },
  ];

  // ── VIGNEESH'S LAYOUT ──
  return (
    <div style={s.root} onClick={() => { setOpenMenuId(null); setConfirmDeleteId(null); }}>
      <style>{CSS}</style>

      {/* ── Navbar (Vigneesh's) ── */}
      <header data-navbar style={s.navbar}>
        <div style={s.navLogo}>
          <img src={logo} alt="TravelSmart" style={{ height: 42, width: "auto" }} />
          <div>
            <span style={s.logoT}>TRAVEL</span>
            <span style={s.logoS}>SMART</span>
          </div>
        </div>

        <nav style={s.navLinks}>
          {([
            { icon: "🏠", label: "Dashboard" },
            { icon: "✈️", label: "My Trips" },
            { icon: "🗺️", label: "Penang Explorer" },
          ] as const).map((item) => (
            <button
              key={item.label}
              className={`nav-btn ${activeNav === item.label ? "nav-btn-active" : ""}`}
              style={s.navBtn}
              onClick={() => {
                setActiveNav(item.label);
                if (item.label === "My Trips") setShowMyTrips(true);
                if (item.label === "Penang Explorer") setShowPenangExplorer(true);
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={s.navRight}>
          <button className="ai-pill" style={s.aiBtn} onClick={() => { setShowRecommendations(true); setActiveNav("AI Picks"); }}>
            <span style={{ fontSize: 11 }}>✦</span> Ask AI
          </button>
          <button style={s.avatarBtn} onClick={() => { setActiveNav("Settings"); setShowSettings(true); }}>
            <div style={s.avatar}>{avatarLetter}</div>
            <span style={s.avatarName}>{userName}</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={s.main}>
        <div style={s.pageBar}>
          <div>
            <h1 style={s.pageTitle}>{greeting}</h1>
            <p style={s.pageSub}>{dateStr} · {timeStr} (Penang, MY)</p>
          </div>
        </div>

        <div style={s.scroll}>

          {/* ── Hero Banner (Vigneesh's) ── */}
          <section style={s.hero}>
            <div style={s.heroOverlay} />
            <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=80" alt="Penang" style={s.heroImg} />
            <div style={s.heroContent}>
              <span style={s.heroBadge}>📍 Penang Island, Malaysia</span>
              <h2 style={s.heroHeading}>Your Smart<br /><span style={s.heroAccent}>Island Guide</span></h2>
              <p style={s.heroSub}>AI powered travel planning for Penang's best experiences</p>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button className="hero-btn-primary" style={s.heroBtnPrimary} onClick={() => { setShowMyTrips(true); setActiveNav("My Trips"); }}>
                  Plan My Trip
                </button>
                <button className="hero-btn-secondary" style={s.heroBtnSecondary} onClick={() => { setShowPenangExplorer(true); setActiveNav("Penang Explorer"); }}>
                  Explore Penang
                </button>
              </div>
            </div>

            {/* Weather overlay (Vigneesh's) */}
            <div style={s.weatherCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 36 }}>☀️</span>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>33°C</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>George Town</p>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>Feels like 36°C · Partly Cloudy</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                {WEATHER_DAYS.map((d) => (
                  <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{d.day}</p>
                    <span>{d.icon}</span>
                    <p style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{d.hi}°</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{d.lo}°</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Stats (Vigneesh's) ── */}
          <section style={s.statsRow}>
            {stats.map((st, i) => (
              <div key={i} className="stat-card" style={s.statCard}>
                <div style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: st.accent + "18" }}>
                  <span style={{ fontSize: 20 }}>{st.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 }}>{st.value}</p>
                  <p style={{ fontSize: 11.5, color: "#999", fontWeight: 500, marginTop: 3 }}>{st.label}</p>
                </div>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, borderRadius: "0 16px 16px 0", background: st.accent }} />
              </div>
            ))}
          </section>

          {/* ── Trips + Tips (Vigneesh's layout, your trip logic) ── */}
          <div style={{ display: "flex", gap: 20, animation: "fadeUp 0.5s 0.2s ease both" }}>
            <div style={{ flex: 1.2, minWidth: 0, display: "flex", flexDirection: "column" }}>

              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e", flex: 1 }}>My Trips</h2>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["upcoming", "completed"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-btn ${activeTab === tab ? "tab-active" : ""}`}
                      style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#999", background: "#f5f2ee" }}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <button style={{ fontSize: 12.5, color: "#6c63ff", fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#6c63ff12" }} onClick={() => { setShowMyTrips(true); setActiveNav("My Trips"); }}>
                  View All →
                </button>
              </div>

              {/* Trip cards — your original grid style */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
                {isLoading ? (
                  <div style={{ ...s.emptyState, gridColumn: "1/-1" }}>
                    <span style={{ fontSize: 32 }}>⏳</span>
                    <p style={{ marginTop: 8, color: "#888" }}>Loading trips…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ ...s.emptyState, gridColumn: "1/-1" }}>
                    <span style={{ fontSize: 40 }}>🗺️</span>
                    <p style={{ marginTop: 8, color: "#888" }}>No {activeTab} trips yet.</p>
                    <button className="hero-btn-primary" style={{ ...s.heroBtnPrimary, marginTop: 12, fontSize: 13, padding: "8px 20px" }} onClick={() => { setShowMyTrips(true); setActiveNav("My Trips"); }}>
                      Plan a Trip
                    </button>
                  </div>
                ) : (
                  filtered.slice(0, 3).map((trip) => (
                    <div
                      key={trip._id}
                      style={{
                        background: "#fff", borderRadius: 18, overflow: "hidden",
                        boxShadow: hoveredCard === trip._id ? "0 12px 32px rgba(108,99,255,0.15)" : "0 2px 8px rgba(0,0,0,0.07)",
                        border: "1px solid #f0f0f0",
                        transform: hoveredCard === trip._id ? "translateY(-4px)" : "none",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        cursor: "pointer", display: "flex", flexDirection: "column"
                      }}
                      onMouseEnter={() => setHoveredCard(trip._id)}
                      onMouseLeave={() => { setHoveredCard(null); if (confirmDeleteId === trip._id) setConfirmDeleteId(null); }}
                      onClick={() => setSelectedTrip(trip._id)}
                    >
                      {/* Image */}
                      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                        <TripImage trip={trip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" }} />
                        <span style={{
                          position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700,
                          color: "#fff", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize",
                          background: trip.status === "upcoming" ? "#3e84f6" : trip.status === "ongoing" ? "#22c55e" : "#a6a6a6",
                        }}>
                          {trip.status}
                        </span>
                        {trip.category && (
                          <span style={{
                            position: "absolute", bottom: 10, left: 10, fontSize: 11, fontWeight: 700,
                            color: "#fff", padding: "4px 12px", borderRadius: 20, textTransform: "capitalize",
                            zIndex: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            background: trip.category === "Attraction" ? "#8b5cf6" : trip.category === "Beaches" ? "#06b6d4" : trip.category === "Hotels" ? "#f59e0b" : "#ef4444",
                          }}>
                            {trip.category}
                          </span>
                        )}
                        {/* Delete menu */}
                        <div style={{ position: "absolute", top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            style={{ background: "rgba(255,255,255,0.85)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#333", backdropFilter: "blur(4px)" }}
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === trip._id ? null : trip._id); setConfirmDeleteId(null); }}
                          >⋮</button>
                          {openMenuId === trip._id && (
                            <div style={{ position: "absolute", top: 34, right: 0, background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #f0f0f0", zIndex: 10, minWidth: 160, overflow: "hidden" }}>
                              <button
                                style={{ display: "block", width: "100%", padding: "10px 14px", fontSize: 13, fontWeight: 500, textAlign: "left", cursor: "pointer", border: "none", fontFamily: "inherit", color: confirmDeleteId === trip._id ? "#dc2626" : "#374151", background: confirmDeleteId === trip._id ? "#fef2f2" : "none", fontWeight: confirmDeleteId === trip._id ? 600 : 500 }}
                                onClick={(e) => handleDeleteTrip(e, trip._id)}
                              >
                                {confirmDeleteId === trip._id ? "⚠️ Sure? Click again" : "🗑 Delete Trip"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{trip.destination}, {trip.country}</h3>
                          <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{trip.address || "Penang, Malaysia"}</p>
                          {trip.description ? <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.4 }}>{trip.description}</p> : null}
                          <p style={{ fontSize: 12, color: "#a6a6a6", fontWeight: 500 }}>{trip.dates}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8f9fb", borderRadius: 10, padding: "7px 12px" }}>
                            <span style={{ fontSize: 16 }}>{trip.weather?.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{trip.weather?.temp}</span>
                            <span style={{ fontSize: 12, color: "#a6a6a6" }}>{trip.weather?.condition}</span>
                          </div>
                          {trip.attractions?.length ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {trip.attractions.slice(0, 2).map((a, idx) => (
                                <span key={`${a.name}-${idx}`} style={{ fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 999, padding: "6px 10px" }}>
                                  {a.name} · {a.distance}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                          <button
                            type="button"
                            onClick={async (e) => { e.stopPropagation(); try { await tripService.updateTripStatus(trip._id, "completed"); setTrips((prev) => prev.map((t) => t._id === trip._id ? { ...t, status: "completed" } : t)); } catch (err) { console.error(err); } }}
                            style={{ padding: "8px 16px", borderRadius: 999, border: "1.5px solid #22c55e", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            ✓ Mark as Completed
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTrip(e, trip._id)}
                            style={{ padding: "8px 12px", borderRadius: 999, border: confirmDeleteId === trip._id ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb", background: confirmDeleteId === trip._id ? "#fef2f2" : "#fff", color: confirmDeleteId === trip._id ? "#dc2626" : "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            {confirmDeleteId === trip._id ? "Sure?" : "🗑 Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tips card (Vigneesh's) */}
              <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 100%)", borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Penang Travel Tips</h3>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Best time to visit: Nov–Feb for cooler weather",
                    "Rent a bicycle to explore George Town heritage streets",
                    "Try char kway teow at Lorong Selamat for the best in the city",
                    "Book Penang Hill trips early — cable car gets busy on weekends",
                  ].map((tip, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6c63ff", flexShrink: 0, marginTop: 5, display: "inline-block" }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── CSS (Vigneesh's) ─────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0ede8; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; }
  input  { font-family: inherit; border: none; outline: none; background: none; }
  header[data-navbar] { position: relative !important; }

  .nav-btn { display: flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 50px; font-size: 13.5px; font-weight: 500; color: #666; transition: all 0.18s ease; white-space: nowrap; }
  .nav-btn:hover { background: #f0ede8; color: #1a1a2e; }
  .nav-btn-active { background: #1a1a2e !important; color: #fff !important; }

  .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }

  .trip-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
  .trip-card:hover { transform: translateY(-3px); }

  .ai-pill { transition: all 0.2s ease; }
  .ai-pill:hover { opacity: 0.85; transform: scale(0.97); }

  .hero-btn-primary  { transition: all 0.2s ease; }
  .hero-btn-primary:hover  { opacity: 0.9; transform: translateY(-1px); }
  .hero-btn-secondary { transition: all 0.2s ease; }
  .hero-btn-secondary:hover { background: rgba(255,255,255,0.25) !important; }

  .trip-detail-btn:hover { color: #6c63ff !important; }
  .tab-btn { transition: all 0.15s ease; }
  .tab-active { background: #1a1a2e !important; color: #fff !important; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── Styles (Vigneesh's) ──────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  root:        { display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", background: "#f0ede8", color: "#1a1a2e" },
  navbar:      { display: "flex", alignItems: "center", gap: 8, padding: "0 28px", height: 60, background: "#fff", borderBottom: "1px solid #ece9e3", position: "sticky", top: 0, zIndex: 100, overflow: "visible" },
  navLogo:     { display: "flex", alignItems: "center", gap: 9, marginRight: 16, flexShrink: 0 },
  logoT:       { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "#1a1a2e" },
  logoS:       { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "#6c63ff" },
  navLinks:    { display: "flex", alignItems: "center", gap: 2, position: "absolute", left: "50%", transform: "translateX(-50%)" },
  navBtn:      { fontFamily: "'Outfit', sans-serif" },
  navRight:    { display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 },
  aiBtn:       { display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 20, background: "linear-gradient(135deg, #1a1a2e, #6c63ff)", color: "#fff", fontWeight: 600, fontSize: 13, flexShrink: 0 },
  avatarBtn:   { display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 20, background: "none", border: "1px solid #ece9e3", cursor: "pointer" },
  avatar:      { width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #e76f51)", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarName:  { fontSize: 13, fontWeight: 600, color: "#1a1a2e" },
  main:        { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  pageBar:     { display: "flex", alignItems: "center", padding: "16px 32px 0" },
  pageTitle:   { fontSize: 22, fontWeight: 700, color: "#1a1a2e" },
  pageSub:     { fontSize: 12.5, color: "#999", marginTop: 2 },
  scroll:      { flex: 1, overflowY: "auto", padding: "20px 32px 48px" },
  hero:        { position: "relative", borderRadius: 20, overflow: "hidden", height: 340, marginBottom: 24, animation: "fadeUp 0.5s ease both" },
  heroImg:     { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay: { position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to right, rgba(10,10,30,0.85) 35%, rgba(10,10,30,0.25) 100%)" },
  heroContent: { position: "relative", zIndex: 2, padding: "48px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 520 },
  heroBadge:   { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(6px)", width: "fit-content" },
  heroHeading: { fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.15 },
  heroAccent:  { color: "#a8d8d0", fontStyle: "italic" },
  heroSub:     { fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, maxWidth: 360 },
  heroBtnPrimary:   { padding: "11px 26px", borderRadius: 12, background: "#6c63ff", color: "#fff", fontWeight: 600, fontSize: 14 },
  heroBtnSecondary: { padding: "11px 26px", borderRadius: 12, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", color: "#fff", fontWeight: 600, fontSize: 14, border: "1px solid rgba(255,255,255,0.25)" },
  weatherCard: { position: "absolute", right: 28, top: 28, zIndex: 3, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.2)", minWidth: 220 },
  statsRow:    { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24, animation: "fadeUp 0.5s 0.1s ease both" },
  statCard:    { background: "#fff", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", border: "1px solid #ece9e3" },
  tripCard:    { background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "1px solid #ece9e3", display: "flex" },
  emptyState:  { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", background: "#fff", borderRadius: 16, border: "1px dashed #ddd" },
};