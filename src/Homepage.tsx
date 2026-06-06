import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import logo from "./assets/TravelSmart_Logo.png";

import TripDetail from "./TripDetail";
import MyTrips from "./MyTrips";
import SettingsProfile from "./SettingsProfile";
import PenangExplorer from "./PenangExplorer";
import { tripService } from "./services/tripService";
import type { Trip } from "./types/trip";
import { TripImage } from './components/TripImage';
import { getImageForTrip, determineCategory } from './services/imageService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat {
  label: string;
  value: number;
  icon: string;
}

interface QuickAction {
  icon: string;
  label: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "➕", label: "New Trip" },
  { icon: "🗺️", label: "Penang Explorer" },
  { icon: "✦", label: "Ask AI" },
  { icon: "❤️", label: "Saved Places" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Homepage() {
  const [explorerFocusPlace, setExplorerFocusPlace] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("Homepage");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showMyTrips, setShowMyTrips] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPenangExplorer, setShowPenangExplorer] = useState<boolean>(false);
  // Track which card's menu is open, and which is confirming delete
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>([
    { label: "Total Trips", value: 0, icon: "✈️" },
    { label: "Countries", value: 0, icon: "🌍" },
    { label: "Days Travel", value: 0, icon: "📅" },
    { label: "Favourites", value: 0, icon: "❤️" },
  ]);

  const navItems: string[] = ["Homepage", "My Trips", "Penang Explorer", "Logout"];

  // ── Fetch upcoming trips on load ──
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

  useEffect(() => {
    refreshUpcomingTrips();
  }, []);

  // Add this useEffect right after your other useEffects (around line 65)
  useEffect(() => {
    if (trips.length > 0) {
      console.log('=== 🖼️ IMAGE DEBUG ===');
      console.log('Total trips:', trips.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      trips.forEach((trip, index) => {
        const determinedCat = determineCategory(trip.destination);
        const imageUrl = getImageForTrip(trip);
        
        console.log(`Trip ${index + 1}:`, {
          'Destination': trip.destination,
          'Current Category': trip.category || '(none)',
          'Detected Category': determinedCat,
          'Image URL': imageUrl,
          'Image Type': imageUrl?.includes('Beaches') ? '🏖️ Beach' : 
                        imageUrl?.includes('Hotels') ? '🏨 Hotel' :
                        imageUrl?.includes('Restaurants') ? '🍽️ Restaurant' :
                        imageUrl?.includes('Attraction') ? '🏛️ Attraction' : 'Unknown'
        });
        console.log('---');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, [trips]);

  // ── Delete a trip directly from the homepage card ──
  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== tripId) {
      setConfirmDeleteId(tripId);
      return;
    }
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

  // ── Propagate deletes coming back from MyTrips or TripDetail ──
  const handleTripDeleted = (id: string) => {
    setTrips((prev) => prev.filter((trip) => trip._id !== id));
  };

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

  if (showSettings) {
    return <SettingsProfile onBack={() => { setShowSettings(false); setActiveNav("Homepage"); }} />;
  }

  if (showPenangExplorer) {
    return (
      <PenangExplorer
        onBack={() => {
          setShowPenangExplorer(false);
          setActiveNav("Homepage");
          setExplorerFocusPlace(null);
          refreshUpcomingTrips();
        }}
        onTripAdded={() => refreshUpcomingTrips()}
        focusPlace={explorerFocusPlace}
      />
    );
  }

  if (showMyTrips) {
    return (
      <MyTrips
        onBack={() => { setShowMyTrips(false); setActiveNav("Homepage"); refreshUpcomingTrips(); }}
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
        onBack={() => { setSelectedTrip(null); setActiveNav("Homepage"); }}
        onDelete={() => {
          setTrips((prev) => prev.filter((t) => t._id !== selectedTrip));
          setSelectedTrip(null);
          setActiveNav("Homepage");
        }}
        source="home"
        onOpenExplorer={(place) => {
          setSelectedTrip(null);
          setExplorerFocusPlace(place);
          setShowPenangExplorer(true);
          setActiveNav("Penang Explorer");
        }}
      />
    );
  }

  return (
    <div
      style={styles.root}
      // Close any open card menu when clicking outside
      onClick={() => { setOpenMenuId(null); setConfirmDeleteId(null); }}
    >
      {/* ── Navbar ── */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoArea}>
            <img src={logo} alt="Travel Smart Logo" style={{ height: 36, width: "auto" }} />
            <span style={styles.logoTextTravel}>TRAVEL </span>
            <span style={styles.logoTextSmart}>SMART</span>
          </div>
        </div>

        <nav style={styles.navLinks}>
          {navItems.slice(0, -1).map((item: string) => (
            <button
              key={item}
              className="nav-button"
              style={styles.navLink}
              onClick={() => {
                setActiveNav(item);
                if (item === "My Trips") setShowMyTrips(true);
                if (item === "Penang Explorer") setShowPenangExplorer(true);
                if (item === "Settings") setShowSettings(true);
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <div style={styles.navRight}>
          <button style={styles.askAiBtn} onClick={() => console.log("Open AI assistant")}>
            <span style={styles.sparkleIcon}>✦</span>
            Ask AI
          </button>
          <button style={styles.iconBtn} title="Favourites" onClick={() => console.log("Show saved places")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button style={styles.iconBtn} title="Profile" onClick={() => setShowSettings(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>

        <button style={styles.hamburger} onClick={() => setMenuOpen((prev) => !prev)} aria-label="Toggle menu">
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
        </button>
      </header>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item: string) => (
            <button
              key={item}
              className="mobile-nav-button"
              style={{ ...styles.mobileMenuLink, ...(item === "Logout" ? styles.mobileMenuLogout : {}) }}
              onClick={() => {
                setActiveNav(item);
                setMenuOpen(false);
                if (item === "My Trips") setShowMyTrips(true);
                if (item === "Penang Explorer") setShowPenangExplorer(true);
                if (item === "Settings") setShowSettings(true);
                if (item === "Logout") { localStorage.removeItem('token'); window.location.href = '/login'; }
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* ── Main ── */}
      <main style={styles.main}>

        {/* Welcome Banner */}
        <section style={styles.welcomeBanner}>
          <div style={styles.welcomeText}>
            <p style={styles.welcomeGreeting}>Good day 👋</p>
            <h1 style={styles.welcomeHeading}>
              Where to next,{" "}
              <span style={styles.welcomeHighlight}>Traveller?</span>
            </h1>
            <p style={styles.welcomeSub}>Your next adventure is just a few clicks away.</p>
          </div>
          <div style={styles.bannerGraphic}>
            <div style={styles.globeRing} />
            <div style={styles.globeRingInner} />
            <svg width="90" height="90" viewBox="0 0 24 24" fill="#3e84f6" style={styles.planeIcon}>
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        </section>

        {/* Stats */}
        <section style={styles.statsGrid}>
          {stats.map((stat: Stat, i: number) => (
            <div key={i} style={styles.statCard}>
              <span style={styles.statIcon}>{stat.icon}</span>
              <span style={styles.statValue}>{stat.value}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Upcoming Trips */}
        <section style={styles.tripsSection}>
          <div style={styles.tripsSectionHeader}>
            <h2 style={styles.sectionTitle}>Upcoming Trips</h2>
            <button style={styles.viewAllBtn} onClick={() => { setShowMyTrips(true); setActiveNav("My Trips"); }}>
              View All →
            </button>
          </div>

          <div style={styles.tripsGrid}>
            {trips.slice(0, 3).map((trip: Trip) => (
              <div
                key={trip._id}
                style={{
                  ...styles.tripCard,
                  ...(hoveredCard === trip._id ? styles.tripCardHovered : {}),
                }}
                onMouseEnter={() => setHoveredCard(trip._id)}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  if (confirmDeleteId === trip._id) setConfirmDeleteId(null);
                }}
                onClick={() => setSelectedTrip(trip._id)}
              >
                <div style={styles.cardImageWrap}>
                  <TripImage 
                    trip={trip} 
                    className="trip-card-image"
                    style={styles.cardImage}
                  />
                  <div style={styles.cardImageOverlay} />
          
                <span style={{
                  ...styles.statusBadge,
                  background: trip.status === "upcoming" ? "#3e84f6"
                    : trip.status === "ongoing" ? "#22c55e"
                    : "#a6a6a6",
                }}>
                  {trip.status}
                </span>

                {trip.category && (
                  <span style={{
                    ...styles.categoryBadge,
                    background: getCategoryColor(trip.category),
                  }}>
                    {trip.category}
                  </span>
                )}
                  {/* ⋮ Menu button */}
                  <div style={{ position: "absolute", top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={styles.cardMenuBtn}
                      aria-label="More options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === trip._id ? null : trip._id);
                        setConfirmDeleteId(null);
                      }}
                    >
                      ⋮
                    </button>

                    {/* Dropdown */}
                    {openMenuId === trip._id && (
                      <div style={styles.cardDropdown}>
                        <button
                          style={{
                            ...styles.cardDropdownItem,
                            ...(confirmDeleteId === trip._id ? styles.cardDropdownItemConfirm : {}),
                          }}
                          onClick={(e) => handleDeleteTrip(e, trip._id)}
                        >
                          {confirmDeleteId === trip._id ? "⚠️ Sure? Click again" : "🗑 Delete Trip"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardCity}>{trip.destination}, {trip.country}</h3>
                    <p style={styles.cardAddress}>{trip.address || 'Penang, Malaysia'}</p>
                    {trip.description ? <p style={styles.cardDesc}>{trip.description}</p> : null}
                    <p style={styles.cardDates}>{trip.dates}</p>
                    <div style={styles.cardWeather}>
                      <span style={styles.cardWeatherIcon}>{trip.weather.icon}</span>
                      <span style={styles.cardWeatherTemp}>{trip.weather.temp}</span>
                      <span style={styles.cardWeatherCond}>{trip.weather.condition}</span>
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
                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await tripService.updateTripStatus(trip._id, "completed");
                        setTrips((prev) => prev.map((t) => t._id === trip._id ? { ...t, status: "completed" } : t));
                      } catch (err) {
                        console.error("Failed to update trip status:", err);
                      }
                    }}
                      style={styles.markCompletedBtn}
                    >
                      ✓ Mark as Completed
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTrip(e, trip._id)}
                      style={{
                        ...styles.deleteBtn,
                        ...(confirmDeleteId === trip._id ? styles.deleteBtnConfirm : {}),
                      }}
                    >
                      {confirmDeleteId === trip._id ? "Sure?" : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isLoading && trips.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No upcoming trips yet. Add one to see it appear here.</p>
            </div>
          )}
          {trips.length > 3 && (
            <div style={styles.viewMoreInfo}>Showing 3 of {trips.length} upcoming trips.</div>
          )}
        </section>

        {/* Quick Actions */}
        <section style={styles.quickActions}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action: QuickAction) => (
              <button
                key={action.label}
                style={{
                  ...styles.actionBtn,
                  ...(hoveredAction === action.label ? styles.actionBtnHovered : {}),
                }}
                onMouseEnter={() => setHoveredAction(action.label)}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={() => {
                  if (action.label === "Penang Explorer") { setShowPenangExplorer(true); setActiveNav("Penang Explorer"); }
                  else if (action.label === "New Trip") console.log("Create new trip");
                  else if (action.label === "Ask AI") console.log("Open AI assistant");
                  else if (action.label === "Saved Places") console.log("Show saved places");
                }}
              >
                <span style={styles.actionIcon}>{action.icon}</span>
                <span style={styles.actionLabel}>{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        .nav-button:hover { background: #eef4ff !important; color: #3e84f6 !important; }
        .mobile-nav-button:hover { background: #f5f7fa !important; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-10deg); }
          50% { transform: translateY(-10px) rotate(-10deg); }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.08); opacity: 0.28; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  root: { fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f7fa", color: "#111" },
  navbar: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 72, background: "#ffffff", boxShadow: "0 1px 0 #e8eaed", gap: 16 },
  navLeft: { display: "flex", alignItems: "center" },
  logoArea: { display: "flex", alignItems: "center", gap: 8 },
  logoTextTravel: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#111", letterSpacing: 1 },
  logoTextSmart: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#3e84f6", letterSpacing: 1 },
  navLinks: { display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" },
  navLink: { padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#555", transition: "all 0.15s" },
  navRight: { display: "flex", alignItems: "center", gap: 8 },
  askAiBtn: { display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20, background: "#3e84f6", color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 0.2 },
  sparkleIcon: { fontSize: 11 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" },
  hamburger: { display: "none", flexDirection: "column", gap: 5, padding: 6 },
  hamburgerBar: { display: "block", width: 22, height: 2, background: "#333", borderRadius: 2 },
  mobileMenu: { display: "flex", flexDirection: "column", background: "#fff", borderBottom: "1px solid #e8eaed", padding: "8px 0" },
  mobileMenuLink: { padding: "12px 24px", fontSize: 15, fontWeight: 500, color: "#333", textAlign: "left" },
  mobileMenuLogout: { color: "#e74c3c" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "48px 48px 80px", display: "flex", flexDirection: "column", gap: 44, animation: "fadeSlideUp 0.5s ease both" },
  welcomeBanner: { background: "linear-gradient(120deg, #eef4ff 0%, #ddeaff 60%, #c8daff 100%)", borderRadius: 20, padding: "56px 64px", minHeight: 220, gap: 40, display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden" },
  welcomeText: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },
  welcomeGreeting: { fontSize: 20, color: "#555", marginBottom: 6, fontWeight: 500 },
  welcomeHeading: { fontFamily: "'Syne', sans-serif", fontSize: 38, fontWeight: 800, color: "#111", lineHeight: 1.3, marginBottom: 12 },
  welcomeHighlight: { color: "#3e84f6" },
  welcomeSub: { fontSize: 16, color: "#666" },
  bannerGraphic: { position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  globeRing: { position: "absolute", width: 170, height: 170, borderRadius: "50%", border: "2px solid #3e84f6", opacity: 0.18, animation: "ringPulse 3s ease-in-out infinite" },
  globeRingInner: { position: "absolute", width: 130, height: 130, borderRadius: "50%", border: "2px solid #3e84f6", opacity: 0.22, animation: "ringPulse 3s ease-in-out infinite 0.5s" },
  planeIcon: { animation: "float 4s ease-in-out infinite", filter: "drop-shadow(0 4px 12px rgba(62,132,246,0.25))" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" },
  statIcon: { fontSize: 22 },
  statValue: { fontFamily: "'DM Sans', sans-serif", fontSize: 36, fontWeight: 700, color: "#111" },
  statLabel: { fontSize: 12, fontWeight: 500, color: "#a6a6a6", textTransform: "uppercase", letterSpacing: 0.6 },
  tripsSection: { display: "flex", flexDirection: "column", gap: 18 },
  tripsSectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#111" },
  viewAllBtn: { fontSize: 13, fontWeight: 600, color: "#3e84f6", padding: "6px 12px", borderRadius: 8, background: "#eef4ff" },
  tripsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  tripCard: { background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer", display: "flex", flexDirection: "column" },
  deleteBtn: { padding: "8px 12px", borderRadius: 999, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  tripCardHovered: { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(62,132,246,0.15)" },
  cardImageWrap: { position: "relative", height: 180, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImageOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" },
  cardMenuBtn: { background: "rgba(255,255,255,0.85)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#333", backdropFilter: "blur(4px)" },
  cardDropdown: { position: "absolute", top: 34, right: 0, background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #f0f0f0", zIndex: 10, minWidth: 160, overflow: "hidden" },
  cardDropdownItem: { display: "block", width: "100%", padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" },
  cardDropdownItemConfirm: { background: "#fef2f2", color: "#dc2626", fontWeight: 600 },
  cardBody: { padding: "14px 16px 14px", display: "flex", flexDirection: "column", flex: 1 },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardCity: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 3 },
  cardDates: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  cardWeather: { display: "flex", alignItems: "center", gap: 6, background: "#f8f9fb", borderRadius: 10, padding: "7px 12px" },
  cardWeatherIcon: { fontSize: 16 },
  cardWeatherTemp: { fontWeight: 700, fontSize: 14, color: "#111" },
  cardWeatherCond: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  cardContent: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  cardAddress: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginTop: 2 },
  cardDesc: { fontSize: 12, color: "#4b5563", lineHeight: 1.4, marginTop: 4 },
  cardAttractions: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  attractionChip: { fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 999, padding: "6px 10px" },
  cardActions: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14, paddingTop: 10, borderTop: "1px solid #f3f4f6" },
  markCompletedBtn: { padding: "8px 16px", borderRadius: 999, border: "1.5px solid #22c55e", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  deleteBtnConfirm: { border: "1.5px solid #ef4444", background: "#fef2f2", color: "#dc2626" },
  statusBadge: { position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize" },
    categoryBadge: { position: "absolute", bottom: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", padding: "4px 12px",borderRadius: 20, textTransform: "capitalize", zIndex: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)", },
  quickActions: { display: "flex", flexDirection: "column", gap: 16 },
  actionsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 },
  actionBtn: { background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.18s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  actionBtnHovered: { background: "#eef4ff", borderColor: "#3e84f6", transform: "translateY(-2px)" },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: 600, color: "#333" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" },
  emptyText: { fontSize: 14, color: "#a6a6a6" },
  viewMoreInfo: { fontSize: 13, color: "#6b7280", marginTop: 10 },
};
