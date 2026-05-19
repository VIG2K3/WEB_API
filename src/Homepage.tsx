import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import logo from "./assets/TravelSmart_Logo.png";

import TripDetail from "./TripDetail";
import MyTrips from "./MyTrips";
import SettingsProfile from "./SettingsProfile";

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
  attractions: {
    name: string;
    image: string;
    distance: string;
  }[];
  notes: string;
  preferences: string;
  status: string;
}

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
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("Homepage");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showMyTrips, setShowMyTrips] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [stats, setStats] = useState<Stat[]>([
    { label: "Total Trips", value: 0, icon: "✈️" },
    { label: "Countries", value: 0, icon: "🌍" },
    { label: "Days Travel", value: 0, icon: "📅" },
    { label: "Favourites", value: 0, icon: "❤️" },
  ]);

  const navItems: string[] = ["Homepage", "My Trips", "Penang Explorer", "Logout"];

// ── Fetch trips from your Node.js API ──
  useEffect(() => {
    // TODO: connect to your API
    // fetch("/api/trips/upcoming")
    //   .then((res) => res.json())
    //   .then((data: Trip[]) => setTrips(data))
    //   .catch((err) => console.error("Failed to fetch trips:", err));

    // Mock data for testing — remove this when backend is ready
    setTrips([{
      _id: "1",
      city: "George Town",
      country: "Malaysia",
      dates: "1 – 7 Jun 2025",
      startDate: "2025-06-01",
      endDate: "2025-06-07",
      image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=80",
      weather: { temp: "32°C", condition: "Sunny", humidity: "80%", wind: "10 km/h", feelsLike: "35°C", icon: "☀️" },
      attractions: [
        { name: "Penang Hill", image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=80&q=60", distance: "5.2 km" },
        { name: "George Town Heritage", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&q=60", distance: "1.1 km" },
        { name: "Kek Lok Si Temple", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=80&q=60", distance: "7.3 km" },
],

      notes: "Explore street art, try char kway teow, visit Penang Hill.",
      preferences: "Food, Culture, Nature",
      status: "upcoming",
    }]);
  }, []);

  // ── Fetch stats from your Node.js API ──
  useEffect(() => {
    // TODO: connect to your API
    // fetch("/api/user/stats")
    //   .then((res) => res.json())
    //   .then((data: Stat[]) => setStats(data))
    //   .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

// ── If My Trips is selected ──
  if (showMyTrips) {
    return <MyTrips onBack={() => setShowMyTrips(false)} />;
  }

  // ── If a trip is selected, show TripDetail instead ──
  if (selectedTrip !== null) {
    const tripData = trips.find((t) => t._id === selectedTrip);
    if (!tripData) return null;
    return <TripDetail trip={tripData} onBack={() => setSelectedTrip(null)} />;
  }

  if (showSettings) {
  return <SettingsProfile onBack={() => setShowSettings(false)} />;
  }

  return (
    <div style={styles.root}>
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
              style={{
                ...styles.navLink,
                ...(activeNav === item ? styles.navLinkActive : {}),
              }}
              onClick={() => {
                setActiveNav(item);
                if (item === "My Trips") setShowMyTrips(true);
                if (item === "Penang Explorer") window.open("http://localhost:3000", "_blank");
                if (item === "Settings") setShowSettings(true); 

              }}
              
            >
              {item}
            </button>
          ))}
        </nav>

        <div style={styles.navRight}>
          <button style={styles.askAiBtn}>
            <span style={styles.sparkleIcon}>✦</span>
            Ask AI
          </button>
          <button style={styles.iconBtn} title="Favourites">
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

        <button
          style={styles.hamburger}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
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
              style={{
                ...styles.mobileMenuLink,
                ...(item === "Logout" ? styles.mobileMenuLogout : {}),
              }}
              onClick={() => {
                setActiveNav(item);
                setMenuOpen(false);
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
            <p style={styles.welcomeGreeting}>Good morning 👋</p>
            <h1 style={styles.welcomeHeading}>
              Where to next,{" "}
              <span style={styles.welcomeHighlight}>Traveller?</span>
            </h1>
            <p style={styles.welcomeSub}>
              Your next adventure is just a few clicks away.
            </p>
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
            <button style={styles.viewAllBtn}>View All →</button>
          </div>

          <div style={styles.tripsGrid}>
            {trips.map((trip: Trip) => (
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
                <div style={styles.cardImageWrap}>
                  <img src={trip.image} alt={`${trip.city}, ${trip.country}`} style={styles.cardImage} />
                  <div style={styles.cardImageOverlay} />
                  <button style={styles.cardMenuBtn} aria-label="More options">⋮</button>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTitleRow}>
                    <div>
                      <h3 style={styles.cardCity}>{trip.city}, {trip.country}</h3>
                      <p style={styles.cardDates}>{trip.dates}</p>
                    </div>
                  </div>
                  <div style={styles.cardWeather}>
                    <span style={styles.cardWeatherIcon}>{trip.weather.icon}</span>
                    <span style={styles.cardWeatherTemp}>{trip.weather.temp}</span>
                    <span style={styles.cardWeatherCond}>{trip.weather.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
// Using CSSProperties type for full IntelliSense support in VS Code

const styles: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    color: "#111",
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 48px",
    height: 72,
    background: "#ffffff",
    boxShadow: "0 1px 0 #e8eaed",
    gap: 16,
  },
  navLeft: { display: "flex", alignItems: "center" },
  logoArea: { display: "flex", alignItems: "center", gap: 8 },

  logoTextTravel: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: "#111",
    letterSpacing: 1,
  },
  logoTextSmart: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: "#3e84f6",
    letterSpacing: 1,
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  navLink: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: "#555",
    transition: "all 0.15s",
  },
  navLinkActive: {
    background: "#eef4ff",
    color: "#3e84f6",
    fontWeight: 600,
  },
  navRight: { display: "flex", alignItems: "center", gap: 8 },
  askAiBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 16px",
    borderRadius: 20,
    background: "#3e84f6",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  sparkleIcon: { fontSize: 11 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
  },
  hamburger: {
    display: "none",
    flexDirection: "column",
    gap: 5,
    padding: 6,
  },
  hamburgerBar: {
    display: "block",
    width: 22,
    height: 2,
    background: "#333",
    borderRadius: 2,
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderBottom: "1px solid #e8eaed",
    padding: "8px 0",
  },
  mobileMenuLink: {
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 500,
    color: "#333",
    textAlign: "left",
  },
  mobileMenuLogout: { color: "#e74c3c" },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "48px 48px 80px",
    display: "flex",
    flexDirection: "column",
    gap: 44,
    animation: "fadeSlideUp 0.5s ease both",
  },
  welcomeBanner: {
    background: "linear-gradient(120deg, #eef4ff 0%, #ddeaff 60%, #c8daff 100%)",
    borderRadius: 20,
    padding: "56px 64px",
    minHeight: 220,
    gap:40,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  welcomeText: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },
  welcomeGreeting: { fontSize: 20, color: "#555", marginBottom: 6, fontWeight: 500 },
  welcomeHeading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 38,
    fontWeight: 800,
    color: "#111",
    lineHeight: 1.3,
    marginBottom: 12,
  },
  welcomeHighlight: { color: "#3e84f6" },
  welcomeSub: { fontSize: 16, color: "#666" },
  bannerGraphic: {
    position: "relative",
    width: 180,
    height: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  globeRing: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: "50%",
    border: "2px solid #3e84f6",
    opacity: 0.18,
    animation: "ringPulse 3s ease-in-out infinite",
  },
  globeRingInner: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: "50%",
    border: "2px solid #3e84f6",
    opacity: 0.22,
    animation: "ringPulse 3s ease-in-out infinite 0.5s",
  },
  planeIcon: {
    animation: "float 4s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(62,132,246,0.25))",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "36px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  statIcon: { fontSize: 22 },
  statValue: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 36,
    fontWeight: 700,
    color: "#111",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#a6a6a6",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tripsSection: { display: "flex", flexDirection: "column", gap: 18 },
  tripsSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3e84f6",
    padding: "6px 12px",
    borderRadius: 8,
    background: "#eef4ff",
  },
  tripsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
  },
  tripCard: {
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    border: "1px solid #f0f0f0",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  tripCardHovered: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 32px rgba(62,132,246,0.15)",
  },
  cardImageWrap: { position: "relative", height: 180, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)",
  },
  cardMenuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(255,255,255,0.85)",
    borderRadius: 6,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#333",
    backdropFilter: "blur(4px)",
  },
  cardBody: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardCity: { fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 3 },
  cardDates: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  cardWeather: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f8f9fb",
    borderRadius: 10,
    padding: "7px 12px",
  },
  cardWeatherIcon: { fontSize: 16 },
  cardWeatherTemp: { fontWeight: 700, fontSize: 14, color: "#111" },
  cardWeatherCond: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  quickActions: { display: "flex", flexDirection: "column", gap: 16 },
  actionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
  },
  actionBtn: {
    background: "#fff",
    border: "1px solid #f0f0f0",
    borderRadius: 14,
    padding: "18px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    transition: "all 0.18s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  actionBtnHovered: {
    background: "#eef4ff",
    borderColor: "#3e84f6",
    transform: "translateY(-2px)",
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: 600, color: "#333" },
};
