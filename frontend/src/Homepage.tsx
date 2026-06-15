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
import Favourites from "./Favourites";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat {
  label: string;
  value: number | string;
  icon: string;
  accent: string;
}

interface WeatherDay {
  day: string;
  icon: string;
  hi: number;
  lo: number;
}


interface NotificationSettings {
  tripReminders: boolean;
  emailNotifications: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  tripReminders: true,
  emailNotifications: false,
};

const getCurrentUserKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user.email || "guest";
  } catch {
    return "guest";
  }
};

const getNotificationStorageKey = () => `notificationSettings:${getCurrentUserKey()}`;

const getNotificationSettings = (): NotificationSettings => {
  try {
    const saved = localStorage.getItem(getNotificationStorageKey());
    if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.notificationSettings
      ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...user.notificationSettings }
      : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

// ─── Weather helpers ──────────────────────────────────────────────────────────

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
const PENANG_LAT = 5.4141;
const PENANG_LON = 100.3288;

const iconCodeToEmoji = (code: string): string => {
  const map: Record<string, string> = {
    "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️",
    "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
  };
  return map[code] || "🌡️";
};

const shortDay = (dtTxt: string): string =>
  new Date(dtTxt).toLocaleDateString("en-MY", { weekday: "short" });

// ─── Component ────────────────────────────────────────────────────────────────

export default function Homepage() {
  const [explorerFocusPlace, setExplorerFocusPlace] = useState<any>(null);
  const [activeNav,          setActiveNav]          = useState<string>("Dashboard");
  const [hoveredCard,        setHoveredCard]        = useState<string | null>(null);
  const [trips,              setTrips]              = useState<Trip[]>([]);
  const [isLoading,          setIsLoading]          = useState<boolean>(true);
  const [selectedTrip,       setSelectedTrip]       = useState<string | null>(null);
  const [showSettings,       setShowSettings]       = useState<boolean>(false);
  const [showRecommendations,setShowRecommendations]= useState<boolean>(false);
  const [activeTab,          setActiveTab]          = useState<"upcoming" | "completed">("upcoming");
  const [currentTime,        setCurrentTime]        = useState(new Date());

  // ── Live weather state ──
  const [weather, setWeather] = useState<{
    temp: string; feelsLike: string; condition: string; icon: string;
  } | null>(null);
  const [forecast, setForecast] = useState<WeatherDay[]>([]);

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  // ── Fetch live Penang weather ──
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [curRes, fcRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${PENANG_LAT}&lon=${PENANG_LON}&units=metric&appid=${OPENWEATHER_KEY}`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${PENANG_LAT}&lon=${PENANG_LON}&units=metric&appid=${OPENWEATHER_KEY}`),
        ]);
        if (!curRes.ok || !fcRes.ok) return;
        const cur = await curRes.json();
        const fc  = await fcRes.json();

        setWeather({
          temp:      `${Math.round(cur.main.temp)}°C`,
          feelsLike: `${Math.round(cur.main.feels_like)}°C`,
          condition: cur.weather?.[0]?.main || "Clear",
          icon:      iconCodeToEmoji(cur.weather?.[0]?.icon || "01d"),
        });

        const seen = new Set<string>();
        const days: WeatherDay[] = [];
        for (const item of fc.list) {
          const date = item.dt_txt.split(" ")[0];
          if (!seen.has(date)) {
            seen.add(date);
            days.push({
              day:  shortDay(item.dt_txt),
              icon: iconCodeToEmoji(item.weather?.[0]?.icon || "01d"),
              hi:   Math.round(item.main.temp_max),
              lo:   Math.round(item.main.temp_min),
            });
          }
          if (days.length === 5) break;
        }
        setForecast(days);
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };
    fetchWeather();
  }, []);

  // ── Notifications state ──
  const [notifications, setNotifications] = useState<{ id: string; msg: string; tripName: string }[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [allTripsForStats, setAllTripsForStats] = useState<Trip[]>([]);

  // ── Trip fetch ──
  const refreshUpcomingTrips = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      let latestSettings = getNotificationSettings();
      if (token) {
        try {
          const settingsRes = await fetch("/api/auth/notification-settings", { headers });
          if (settingsRes.ok) {
            latestSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(await settingsRes.json()) };
            localStorage.setItem(getNotificationStorageKey(), JSON.stringify(latestSettings));
          }
        } catch (settingsErr) {
          console.error("Failed to fetch notification settings:", settingsErr);
        }
      }

      const allRes = await fetch("/api/trips", { headers });
      const allRaw: Trip[] = allRes.ok ? await allRes.json() : [];
      setAllTripsForStats(allRaw);

      const allTrips = await tripService.getAllTripsWithWeather();
      const upcoming = allTrips.filter(t => !t.status || t.status === "upcoming" || t.status === "ongoing");
      setTrips(upcoming);

      const today = new Date();
      const notifs = upcoming
        .filter(t => {
          if (!t.startDate) return false;
          const start = new Date(t.startDate);
          const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000);
          return diffDays >= 0 && diffDays <= 7;
        })
        .map(t => {
          const start = new Date(t.startDate!);
          const diffDays = Math.ceil((start.getTime() - today.getTime()) / 86400000);
          const when = diffDays === 0 ? "today! 🎉" : diffDays === 1 ? "tomorrow! ⏰ 1-day reminder" : `in ${diffDays} days!`;
          return { id: t._id, msg: `Your trip starts ${when}`, tripName: t.destination };
        });
      const settingsNow = latestSettings;
      setNotificationSettings(settingsNow);
      setNotifications(settingsNow.tripReminders ? notifs : []);

      if (settingsNow.emailNotifications) {
        const todayForEmail = new Date();
        todayForEmail.setHours(0, 0, 0, 0);

        const getReminderType = (trip: Trip) => {
          if (!trip.startDate) return "";

          const start = new Date(trip.startDate);
          const end = trip.endDate ? new Date(trip.endDate) : null;

          start.setHours(0, 0, 0, 0);
          if (end) end.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (start.getTime() - todayForEmail.getTime()) / 86400000
          );

          if (diffDays === 7) return "7days";
          if (diffDays === 1) return "1day";
          if (start <= todayForEmail && end && todayForEmail <= end) return "ongoing";

          return "";
        };

        const tripsToEmail = upcoming.filter((trip) => {
          const reminderType = getReminderType(trip);
          if (!reminderType) return false;

          const sentKey = `emailReminderSent:${trip._id}:${reminderType}`;
          return !localStorage.getItem(sentKey);
        });

        if (tripsToEmail.length > 0) {
          try {
            const emailRes = await fetch("/api/trips/send-email-reminders", {
              method: "POST",
              headers: {
                ...headers,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tripIds: tripsToEmail.map((trip) => trip._id),
              }),
            });

            const emailData = await emailRes.json().catch(() => null);
            console.log("Email reminder response:", emailData);

            if (emailRes.ok) {
              tripsToEmail.forEach((trip) => {
                const reminderType = getReminderType(trip);
                if (reminderType) {
                  localStorage.setItem(
                    `emailReminderSent:${trip._id}:${reminderType}`,
                    "true"
                  );
                }
              });
            }
          } catch (emailErr) {
            console.error("Failed to send email reminders:", emailErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUpcomingTrips();
    const handleBudgetUpdate = () => setTimeout(() => refreshUpcomingTrips(), 300);
    window.addEventListener("trip-budget-updated", handleBudgetUpdate);
    return () => window.removeEventListener("trip-budget-updated", handleBudgetUpdate);
  }, []);

  useEffect(() => {
    const handleNotificationSettingsUpdate = () => {
      setNotificationSettings(getNotificationSettings());
      setTimeout(() => refreshUpcomingTrips(), 100);
    };

    window.addEventListener("notification-settings-updated", handleNotificationSettingsUpdate);
    return () =>
      window.removeEventListener("notification-settings-updated", handleNotificationSettingsUpdate);
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      trips.forEach((trip, index) => {
        const determinedCat = determineCategory(trip.destination);
        const imageUrl = getImageForTrip(trip);
        console.log(`Trip ${index + 1}:`, { Destination: trip.destination, "Detected Category": determinedCat, "Image URL": imageUrl });
      });
    }
  }, [trips]);

  const handleTripDeleted = (id: string) =>
    setTrips((prev) => prev.filter((trip) => trip._id !== id));

  // ── Full-page overlays ──
  if (showSettings) {
    return <SettingsProfile onBack={() => { setShowSettings(false); setActiveNav("Dashboard"); }} />;
  }
  if (showRecommendations) {
    return (
      <div>
        <div style={{ padding: "12px 24px", background: "#fff", borderBottom: "1px solid #ece9e3", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => { setShowRecommendations(false); setActiveNav("Dashboard"); }}
            style={{ fontSize: 13, fontWeight: 600, color: "#6c63ff", background: "#6c63ff12", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
          >
            BACK
          </button>
        </div>
        <SmartRecommendations />
      </div>
    );
  }
 if (selectedTrip !== null) {
  const tripData = trips.find((t) => t._id === selectedTrip);
  if (!tripData) return null;

  return (
    <TripDetail
      trip={tripData}
      onBack={() => {
        setSelectedTrip(null);
        setActiveNav("Dashboard");
      }}
      onDelete={() => {
        setTrips((prev) =>
          prev.filter((t) => t._id !== selectedTrip)
        );

        setAllTripsForStats((prev) =>
          prev.filter((t) => t._id !== selectedTrip)
        );

        window.dispatchEvent(new CustomEvent("trip-budget-updated"));

        setSelectedTrip(null);
        setActiveNav("Dashboard");
      }}
      source="home"
      onOpenExplorer={(place) => {
        setSelectedTrip(null);
        setExplorerFocusPlace(place);
        setActiveNav("Penang Explorer");
      }}
    />
  );
}

  // ── Derived ──
  const hour     = currentTime.getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 17 ? "Good Afternoon!" : "Good Evening!";
  const timeStr  = currentTime.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  const dateStr  = currentTime.toLocaleDateString("en-MY", { weekday: "long", month: "long", day: "numeric" });
  const filtered = trips.filter((t) => {
  const status = t.status || "upcoming";
  return !t.isFavouriteOnly && (status === "upcoming" || status === "ongoing");
  });

  const storedUser   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userName     = storedUser?.name || "Traveller";
  const avatarLetter = userName.charAt(0).toUpperCase();
  const profilePic   = storedUser?.profilePic || "";

  const plannedTripsForStats = allTripsForStats.filter(t => !t.isFavouriteOnly);

  const upcomingCount = plannedTripsForStats.filter(t => {
    const status = t.status || "upcoming";
    return status === "upcoming" || status === "ongoing";
  }).length;

  const favouritesCount = allTripsForStats.filter(t => t.favourited).length;

 const budgetTripsForStats = plannedTripsForStats.filter((trip) => {
  const status = trip.status || "upcoming";
  return status !== "completed";
});

const totalRemainingBudget = budgetTripsForStats.reduce((sum, trip) => {
  const total = trip.budget?.total || 0;
  const spent =
    trip.budget?.items?.reduce(
      (itemSum, item) => itemSum + (item.amount || 0),
      0
    ) || 0;

  return sum + Math.max(total - spent, 0);
}, 0);

  const stats: Stat[] = [
    { label: "Total Trips",       value: plannedTripsForStats.length,            icon: "✈️", accent: "#2a9d8f" },
    { label: "Upcoming Trips",    value: upcomingCount,                          icon: "🗓️", accent: "#6c63ff" },
    { label: "Remaining Budget (All Trips)",  value: `RM ${totalRemainingBudget.toLocaleString()}`, icon: "💰", accent: "#f4a261" },
  ];

  const showMyTrips        = activeNav === "My Trips";
  const showPenangExplorer = activeNav === "Penang Explorer";
  const showFavourites     = activeNav === "Favourites";

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={s.root} onClick={() => setShowNotifPanel(false)}>
      <style>{CSS}</style>

      {/* ── Sticky Navbar ── */}
      <header data-navbar style={s.navbar}>
        <div style={s.navLogo}>
          <img src={logo} alt="TravelSmart" style={{ height: 42, width: "auto" }} />
          <div>
            <span style={s.logoT}>TRAVEL SMART </span>
            <span style={s.logoS}>PENANG</span>
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
              onClick={() => setActiveNav(item.label)}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={s.navRight}>
          {/* ── Notification Bell ── */}
          <div style={{ position: "relative" }}>
            <button
              style={s.bellBtn}
              onClick={(e) => { e.stopPropagation(); setShowNotifPanel(p => !p); }}
              aria-label="Notifications"
            >
              🔔
              {notifications.length > 0 && (
                <span style={s.bellBadge}>{notifications.length}</span>
              )}
            </button>
            {showNotifPanel && (
              <div style={s.notifPanel} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 10 }}>Upcoming Alerts</p>
                {!notificationSettings.tripReminders ? (
                  <p style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>
                    Trip reminders are disabled. Please enable them in Settings.
                  </p>
                ) : notifications.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#999" }}>No upcoming trips this week.</p>
                ) : notifications.map(n => (
                  <div key={n.id} style={s.notifItem}>
                    <span style={{ fontSize: 18 }}>✈️</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{n.tripName}</p>
                      <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{n.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            style={{ ...s.bellBtn, color: activeNav === "Favourites" ? "#e63946" : "#1a1a2e" }}
            onClick={(e) => { e.stopPropagation(); setShowNotifPanel(false); setActiveNav("Favourites"); }}
            aria-label="Favourites"
            title="Favourites"
          >
            ❤️
            {favouritesCount > 0 && <span style={{ ...s.bellBadge, background: "#e63946" }}>{favouritesCount}</span>}
          </button>

          <button className="ai-pill" style={s.aiBtn} onClick={() => { setShowRecommendations(true); setActiveNav("AI Picks"); }}>
            <span style={{ fontSize: 11 }}>✦</span> Ask AI
          </button>

          <button style={s.avatarBtn} onClick={() => { setActiveNav("Settings"); setShowSettings(true); }}>
            {profilePic ? (
              <img src={profilePic} alt="avatar" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={s.avatar}>{avatarLetter}</div>
            )}
            <span style={s.avatarName}>{userName}</span>
          </button>
        </div>
      </header>

      {/* ── My Trips ── */}
      {showMyTrips && (
        <div style={s.embeddedPage}>
          <MyTrips
            onBack={() => { setActiveNav("Dashboard"); refreshUpcomingTrips(); }}
            onTripDeleted={handleTripDeleted}
            onOpenExplorer={(place) => { setExplorerFocusPlace(place); setActiveNav("Penang Explorer"); }}
          />
        </div>
      )}

      {/* ── Penang Explorer ── */}
      {showPenangExplorer && (
        <div style={s.embeddedPage}>
          <PenangExplorer
            onBack={() => { setActiveNav("Dashboard"); setExplorerFocusPlace(null); refreshUpcomingTrips(); }}
            onTripAdded={() => refreshUpcomingTrips()}
            focusPlace={explorerFocusPlace}
          />
        </div>
      )}

      {/* ── Favourites ── */}
      {showFavourites && (
        <div style={s.embeddedPage}>
          <Favourites
            onBack={() => { setActiveNav("Dashboard"); refreshUpcomingTrips(); }}
            onChanged={() => refreshUpcomingTrips()}
            onOpenExplorer={(place) => { setExplorerFocusPlace(place); setActiveNav("Penang Explorer"); }}
          />
        </div>
      )}

      {/* ── Dashboard ── */}
      {!showMyTrips && !showPenangExplorer && !showFavourites && (
        <main style={s.main}>
          <div style={s.pageBar}>
            <div>
              <h1 style={s.pageTitle}>{greeting}</h1>
              <p style={s.pageSub}>{dateStr} · {timeStr} (Penang, MY)</p>
            </div>
          </div>

          <div style={s.scroll}>

            {/* ── Hero Banner ── */}
            <section style={s.hero}>
              <div style={s.heroOverlay} />
              <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80" alt="Penang" style={s.heroImg} />
              <div style={s.heroContent}>
                <span style={s.heroBadge}>📍 Penang Island, Malaysia</span>
                <h2 style={s.heroHeading}>Your Smart<br /><span style={s.heroAccent}>Island Guide</span></h2>
                <p style={s.heroSub}>Plan your journey and discover attractions, food, and unforgettable adventures.</p>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <button className="hero-btn-primary" style={s.heroBtnPrimary} onClick={() => setActiveNav("My Trips")}>
                    Plan My Trip
                  </button>
                  <button className="hero-btn-secondary" style={s.heroBtnSecondary} onClick={() => setActiveNav("Penang Explorer")}>
                    Explore Penang
                  </button>
                </div>
              </div>

              {/* ── Live Weather Card ── */}
              <div style={s.weatherCard}>
                {weather ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 50 }}>{weather.icon}</span>
                      <div>
                        <p style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>{weather.temp}</p>
                        <p style={{ fontSize: 22, color: "rgba(255,255,255,0.75)" }}>George Town</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>
                      Feels like {weather.feelsLike} · {weather.condition}
                    </p>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <span style={{ fontSize: 36 }}>🌡️</span>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Loading…</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>George Town</p>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                  {(forecast.length > 0 ? forecast : Array(5).fill(null)).map((d, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{d?.day ?? "—"}</p>
                      <span>{d?.icon ?? "·"}</span>
                      <p style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{d ? `${d.hi}°` : "—"}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{d ? `${d.lo}°` : "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Stats ── */}
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

            {/* ── Trips + Tips ── */}
            <div style={{ display: "flex", gap: 20, animation: "fadeUp 0.5s 0.2s ease both" }}>
              <div style={{ flex: 1.2, minWidth: 0, display: "flex", flexDirection: "column" }}>

                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e", flex: 1 }}>My Trips:</h2>
                  <button
                    style={{ fontSize: 12.5, color: "#6c63ff", fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#6c63ff12" }}
                    onClick={() => setActiveNav("My Trips")}
                  >
                    View All
                  </button>
                </div>

                {/* Trip cards */}
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
                      <button
                        className="hero-btn-primary"
                        style={{ ...s.heroBtnPrimary, marginTop: 12, fontSize: 13, padding: "8px 20px" }}
                        onClick={() => setActiveNav("My Trips")}
                      >
                        Plan a Trip
                      </button>
                    </div>
                  ) : (
                    filtered.slice(0, 3).map((trip) => (
                      <div
                        key={trip._id}
                        style={{
                          background: "#fff",
                          borderRadius: 18,
                          overflow: "hidden",
                          boxShadow: hoveredCard === trip._id ? "0 12px 32px rgba(108,99,255,0.15)" : "0 2px 8px rgba(0,0,0,0.07)",
                          border: "1px solid #f0f0f0",
                          transform: hoveredCard === trip._id ? "translateY(-4px)" : "none",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        onMouseEnter={() => setHoveredCard(trip._id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => setSelectedTrip(trip._id)}
                      >
                        {/* ── Card image area ── */}
                        <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                          <TripImage trip={trip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" }} />

                          {/* Status badge */}
                          <span style={{
                            position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700,
                            color: "#fff", padding: "3px 10px", borderRadius: 20, textTransform: "capitalize",
                            background:
                              (trip.status || "upcoming") === "upcoming" ? "#3e84f6"
                              : (trip.status || "upcoming") === "ongoing" ? "#22c55e"
                              : "#a6a6a6",
                          }}>
                            {trip.status || "upcoming"}
                          </span>

                          {/* Category badge */}
                          {trip.category && (
                            <span style={{
                              position: "absolute", bottom: 10, left: 10, fontSize: 11, fontWeight: 700,
                              color: "#fff", padding: "4px 12px", borderRadius: 20, textTransform: "capitalize",
                              zIndex: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              background:
                                trip.category === "Attraction" ? "#8b5cf6"
                                : trip.category === "Beaches" ? "#06b6d4"
                                : trip.category === "Hotels" ? "#f59e0b"
                                : "#ef4444",
                            }}>
                              {trip.category}
                            </span>
                          )}


                        </div>

                        {/* ── Card body ── */}
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{trip.destination}, {trip.country}</h3>
                            <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{trip.address || "Penang, Malaysia"}</p>
                            {trip.description && (
                              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.4 }}>{trip.description}</p>
                            )}
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
                        </div>
                        {/* end card body */}
                      </div>
                      // end trip card
                    ))
                  )}
                </div>

                {/* Tips card */}
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
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0ede8; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; }
  input  { font-family: inherit; border: none; outline: none; background: none; }
  header[data-navbar] { position: sticky !important; top: 0; z-index: 100; }

  .nav-btn { display: flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 50px; font-size: 13.5px; font-weight: 500; color: #666; transition: all 0.18s ease; white-space: nowrap; }
  .nav-btn:hover { background: #f0ede8; color: #1a1a2e; }
  .nav-btn-active { background: #1a1a2e !important; color: #fff !important; }

  .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }

  .ai-pill { transition: all 0.2s ease; }
  .ai-pill:hover { opacity: 0.85; transform: scale(0.97); }

  .hero-btn-primary  { transition: all 0.2s ease; }
  .hero-btn-primary:hover  { opacity: 0.9; transform: translateY(-1px); }
  .hero-btn-secondary { transition: all 0.2s ease; }
  .hero-btn-secondary:hover { background: rgba(255,255,255,0.25) !important; }

  .tab-btn { transition: all 0.15s ease; }
  .tab-active { background: #1a1a2e !important; color: #fff !important; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  root:             { display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", background: "#f0ede8", color: "#1a1a2e" },
  navbar:           { display: "flex", alignItems: "center", gap: 8, padding: "0 28px", height: 60, background: "#fff", borderBottom: "1px solid #ece9e3", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 },
  navLogo:          { display: "flex", alignItems: "center", gap: 9, marginRight: 16, flexShrink: 0 },
  logoT:            { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "#1a1a2e" },
  logoS:            { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: "#6c63ff" },
  navLinks:         { display: "flex", alignItems: "center", gap: 2, position: "absolute", left: "50%", transform: "translateX(-50%)" },
  navBtn:           { fontFamily: "'Outfit', sans-serif" },
  navRight:         { display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 },
  bellBtn:          { position: "relative", background: "none", border: "1px solid #ece9e3", borderRadius: 20, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" },
  bellBadge:        { position: "absolute", top: -4, right: -4, background: "#e63946", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
  notifPanel:       { position: "absolute", top: 46, right: 0, background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #ece9e3", padding: "16px", minWidth: 280, zIndex: 200 },
  notifItem:        { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
  aiBtn:            { display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 20, background: "linear-gradient(135deg, #1a1a2e, #6c63ff)", color: "#fff", fontWeight: 600, fontSize: 13, flexShrink: 0 },
  avatarBtn:        { display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 20, background: "none", border: "1px solid #ece9e3", cursor: "pointer" },
  avatar:           { width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #e76f51)", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarName:       { fontSize: 13, fontWeight: 600, color: "#1a1a2e" },
  embeddedPage:     { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  main:             { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  pageBar:          { display: "flex", alignItems: "center", padding: "16px 32px 0" },
  pageTitle:        { fontSize: 22, fontWeight: 700, color: "#1a1a2e" },
  pageSub:          { fontSize: 12.5, color: "#999", marginTop: 2 },
  scroll:           { flex: 1, overflowY: "auto", padding: "20px 32px 48px" },
  hero:             { position: "relative", borderRadius: 20, overflow: "hidden", height: 340, marginBottom: 24, animation: "fadeUp 0.5s ease both" },
  heroImg:          { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay:      { position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to right, rgba(10,10,30,0.85) 35%, rgba(10,10,30,0.25) 100%)" },
  heroContent:      { position: "relative", zIndex: 2, padding: "48px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 520 },
  heroBadge:        { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(6px)", width: "fit-content" },
  heroHeading:      { fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.15 },
  heroAccent:       { color: "#a8d8d0", fontStyle: "italic" },
  heroSub:          { fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, maxWidth: 360 },
  heroBtnPrimary:   { padding: "11px 26px", borderRadius: 12, background: "#6c63ff", color: "#fff", fontWeight: 600, fontSize: 14 },
  heroBtnSecondary: { padding: "11px 26px", borderRadius: 12, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", color: "#fff", fontWeight: 600, fontSize: 14, border: "1px solid rgba(255,255,255,0.25)" },
  weatherCard:      { position: "absolute", right: 28, top: 28, zIndex: 3, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "22px 28px", border: "1px solid rgba(255,255,255,0.2)", minWidth: 280 },
  statsRow:         { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24, animation: "fadeUp 0.5s 0.1s ease both" },
  statCard:         { background: "#fff", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", border: "1px solid #ece9e3" },
  emptyState:       { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", background: "#fff", borderRadius: 16, border: "1px dashed #ddd" },
};