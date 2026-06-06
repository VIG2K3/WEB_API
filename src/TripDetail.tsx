import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { tripService } from "./services/tripService";
import type { Trip, ForecastDay, Place } from "./types/trip";
import { getImageForTrip, getCategoryColor } from './services/imageService';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "Overview" | "Weather" | "Attractions" | "Budget";

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
  onDelete?: () => void;
  source?: 'home' | 'mytrips';
  onOpenExplorer?: (place: any) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TripDetail({ trip, onBack, onDelete, source = "mytrips", onOpenExplorer }: TripDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [refreshingWeather, setRefreshingWeather] = useState<boolean>(false);
  const [currentWeather, setCurrentWeather] = useState(trip.weather);
  const [tripData, setTripData] = useState<Trip>(trip);
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([]);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [budgetTotal, setBudgetTotal] = useState<number>(trip.budget?.total || 0);
  const [budgetItems, setBudgetItems] = useState<Array<{ label: string; amount: number }>>(trip.budget?.items || []);
  const [newItemLabel, setNewItemLabel] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');

  // POI (points of interest) state for Attractions tab
  const [poisByCategory, setPoisByCategory] = useState<Record<string, Place[]>>({ tourism: [], restaurant: [], hotel: [], beach: [] });
  const [loadingPois, setLoadingPois] = useState<boolean>(false);
  const [poisError, setPoisError] = useState<string | null>(null);

  // Edit form state — initialised from the trip prop
  const [editDestination, setEditDestination] = useState<string>(`${trip.destination}, ${trip.country}`);
  const [editStartDate, setEditStartDate] = useState<string>(trip.startDate);
  const [editEndDate, setEditEndDate] = useState<string>(trip.endDate);
  const [editNotes, setEditNotes] = useState<string>(trip.notes);
  const [editPreferences, setEditPreferences] = useState<string>(trip.preferences);
  const [editBudgetTotal, setEditBudgetTotal] = useState<number>(trip.budget?.total || 0);

  const tabs: TabType[] = ["Overview", "Weather", "Attractions", "Budget"];

  const formatHeaderDate = (start: string, end: string, fallback = 'Flexible dates'): string => {
    if (!start || !end) return fallback;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return fallback;
    const startFmt = s.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const endFmt = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${startFmt} – ${endFmt}`;
  };

  const getStatusFromDates = (start: string, end: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateValue = start ? new Date(start) : null;
    const endDateValue = end ? new Date(end) : null;
    if (startDateValue) startDateValue.setHours(0, 0, 0, 0);
    if (endDateValue) endDateValue.setHours(0, 0, 0, 0);

    if (!startDateValue && !endDateValue) return 'upcoming';
    if (startDateValue && !endDateValue) {
      if (today < startDateValue) return 'upcoming';
      if (today > startDateValue) return 'completed';
      return 'ongoing';
    }
    if (!startDateValue && endDateValue) {
      if (today > endDateValue) return 'completed';
      return 'upcoming';
    }
    if (today < startDateValue!) return 'upcoming';
    if (today > endDateValue!) return 'completed';
    return 'ongoing';
  };

  const computedStatus = tripData.status || getStatusFromDates(tripData.startDate, tripData.endDate);

  const refreshWeather = async () => {
    setRefreshingWeather(true);
    setLoadingForecast(true);
    try {
      const resp = await fetch(`/api/trips/${tripData._id}/weather?force=true`);
      if (!resp.ok) throw new Error('Failed to fetch weather from server');
      const body = await resp.json();
      const current = body.current || body;
      const daily = body.daily || [];

      const toEmoji = (code: string) => {
        const map: Record<string,string> = {
          '01d': '☀️','01n':'🌙','02d':'⛅','02n':'☁️','03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
          '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️','11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️','50d':'🌫️','50n':'🌫️'
        };
        return map[code] || '🌡️';
      };

      const updatedWeather = {
        temp: current.temp,
        condition: current.condition,
        humidity: current.humidity,
        wind: current.wind,
        feelsLike: current.feelsLike,
        icon: toEmoji(current.icon || '')
      };

      setCurrentWeather(updatedWeather);
      setTripData((prev) => ({ ...prev, weather: updatedWeather }));

      setForecastDays(daily.map((d:any) => ({
        date: d.date,
        temp: d.temp,
        condition: d.condition,
        humidity: d.humidity,
        wind: d.wind,
        feelsLike: d.feelsLike,
        icon: toEmoji(d.icon || '')
      })));
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      alert('Failed to refresh weather. Please try again.');
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const fetchNearbyPOIs = async () => {
    setLoadingPois(true);
    setPoisError(null);
    try {
      let lat = tripData.lat;
      let lon = tripData.lon;

      if ((!lat || !lon) && tripData.destination) {
        const resp = await fetch(`/api/search/geocode?q=${encodeURIComponent(tripData.destination)}`);
        if (resp.ok) {
          const body = await resp.json();
          lat = body.lat;
          lon = body.lon;
        }
      }

      if (!lat || !lon) {
        throw new Error('Could not determine trip coordinates for nearby places');
      }

      const categories = ['tourism', 'restaurant', 'hotel', 'beach'];
      const results: Record<string, Place[]> = { tourism: [], restaurant: [], hotel: [], beach: [] };

      await Promise.all(categories.map(async (cat) => {
        try {
          const r = await fetch(`/api/search/places?category=${cat}&lat=${lat}&lon=${lon}`);
          if (!r.ok) throw new Error('Places fetch failed');
          const body = await r.json();
          const places = (body.places || []).map((p: any) => ({ ...p, distanceKm: haversineKm(lat!, lon!, p.lat, p.lon) }));
          places.sort((a: any, b: any) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
          const clusterRadius = 12;
          const nearby = places.filter((p: any) => typeof p.distanceKm === 'number' && p.distanceKm <= clusterRadius).slice(0, 8);
          results[cat] = nearby;
        } catch (err) {
          console.warn('POI fetch failed for', cat, err);
          results[cat] = [];
        }
      }));

      setPoisByCategory(results);
    } catch (err: any) {
      setPoisError(err.message || String(err));
    } finally {
      setLoadingPois(false);
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
          setEditPreferences(fresh.preferences);
          setBudgetTotal(fresh.budget?.total || 0);
          setEditBudgetTotal(fresh.budget?.total || 0);
          setBudgetItems(fresh.budget?.items || []);
        }
      } catch (err) {
        console.warn('Could not fetch fresh trip:', err);
      }
      if (mounted) refreshWeather();
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip._id]);

  useEffect(() => {
    if (activeTab === 'Attractions' || activeTab === 'Overview') {
      fetchNearbyPOIs();
    }
  }, [activeTab, tripData._id]);

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        input, textarea { font-family: inherit; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
        }
      `}</style>

      <div style={styles.layout}>

        {/* ── Left: Trip Detail Column ── */}
        <div style={{
          ...styles.detailColumn,
          ...(showEditPanel ? styles.detailColumnNarrow : {}),
        }}>

          {/* Back + Actions */}
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to {source === 'home' ? 'Homepage' : 'My Trips'}
            </button>
            <div style={styles.actionBtns}>
              <button style={styles.editBtn} onClick={() => setShowEditPanel(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Trip
              </button>
              <button style={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Trip Header */}
          <div style={styles.tripHeader}>
            <h1 style={styles.tripTitle}>{tripData.destination}, {tripData.country}</h1>
            <p style={styles.tripDates}>{formatHeaderDate(tripData.startDate, tripData.endDate, tripData.dates)}</p>
            <div style={styles.tripMetaRow}>
              {tripData.type ? <span style={styles.typeBadge}>{tripData.type}</span> : null}
              {tripData.address ? <span style={styles.tripAddress}>{tripData.address}</span> : null}
            </div>
            <div style={styles.badgeRow}>
              <span style={{
                ...styles.statusBadge,
                background: computedStatus === "upcoming" ? "#3e84f6"
                  : computedStatus === "ongoing" ? "#22c55e"
                  : "#a6a6a6",
              }}>
                {computedStatus}
              </span>
              {tripData.category && (
                <span style={{
                  ...styles.categoryBadge,
                  background: getCategoryColor(tripData.category),
                }}>
                  {tripData.category}
                </span>
              )}
            </div>
          </div>

          {/* Hero Image - Updated with getImageForTrip */}
          <div style={styles.heroWrap}>
            <img 
              src={getImageForTrip(tripData)} 
              alt={tripData.destination} 
              style={styles.heroImg}
              onError={(e) => {
                const target = e.currentTarget;
                const category = tripData.category || 'Attraction';
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
                    font-size: 64px;
                  `;
                  fallback.innerHTML = icons[category];
                  parent.insertBefore(fallback, target);
                }
              }}
            />
            <div style={styles.heroOverlay} />
          </div>

          {/* Tabs */}
          <div style={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <div style={styles.tabUnderline} />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>

            {/* ── OVERVIEW ── */}
            {activeTab === "Overview" && (
              <div style={styles.overviewGrid}>
                <div style={styles.infoCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={styles.cardTitle}>Weather Now</h3>
                    <button
                      onClick={refreshWeather}
                      disabled={refreshingWeather}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                        background: '#eef4ff', color: '#3e84f6', border: 'none',
                        cursor: refreshingWeather ? 'not-allowed' : 'pointer',
                        opacity: refreshingWeather ? 0.6 : 1
                      }}
                    >
                      {refreshingWeather ? '⟳ Loading...' : '⟳ Refresh'}
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
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Humidity</span>
                      <span style={styles.weatherVal}>{currentWeather.humidity}</span>
                    </div>
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Wind</span>
                      <span style={styles.weatherVal}>{currentWeather.wind}</span>
                    </div>
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Feels like</span>
                      <span style={styles.weatherVal}>{currentWeather.feelsLike}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Trip Details</h3>
                  {tripData.description
                    ? <p style={styles.cardDesc}>{tripData.description}</p>
                    : <p style={styles.cardDesc}>No description available for this trip.</p>}
                  {tripData.type    && <p style={styles.detailLine}><strong>Type:</strong> {tripData.type}</p>}
                  {tripData.address && <p style={styles.detailLine}><strong>Address:</strong> {tripData.address}</p>}
                </div>

                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Top Attractions</h3>
                  <div style={styles.attractionsList}>
                    {(poisByCategory.tourism?.length ? poisByCategory.tourism : tripData.attractions).slice(0, 6).map((a: any, i) => (
                      <div key={i} style={styles.attractionRow}>
                        <span style={{ fontSize: 20, width: 36, textAlign: 'center', flexShrink: 0 }}>🏛️</span>
                        <span style={styles.attractionName}>{a.name}</span>
                        <span style={styles.attractionDist}>
                          {a.distanceKm != null && a.distanceKm !== Infinity
                            ? `${a.distanceKm} km`
                            : a.distance || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setActiveTab('Attractions')} style={styles.viewMoreBtn}>
                    View more places
                  </button>
                </div>

                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>📝 Notes</h3>
                  <p style={styles.notesText}>{tripData.notes || 'No notes yet.'}</p>
                  {tripData.preferences && (
                    <div style={styles.prefChips}>
                      {tripData.preferences.split(', ').map((p) => (
                        <span key={p} style={styles.prefChip}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WEATHER ── */}
            {activeTab === "Weather" && (
              <div style={styles.infoCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={styles.cardTitle}>Weather Forecast</h3>
                  <button
                    onClick={refreshWeather}
                    disabled={refreshingWeather}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                      background: '#eef4ff', color: '#3e84f6', border: 'none',
                      cursor: refreshingWeather ? 'not-allowed' : 'pointer',
                      opacity: refreshingWeather ? 0.6 : 1
                    }}
                  >
                    {refreshingWeather ? '🔄 Loading...' : '🔄 Refresh'}
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
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Humidity</span>
                    <span style={styles.weatherVal}>{currentWeather.humidity}</span>
                  </div>
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Wind</span>
                    <span style={styles.weatherVal}>{currentWeather.wind}</span>
                  </div>
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Feels like</span>
                    <span style={styles.weatherVal}>{currentWeather.feelsLike}</span>
                  </div>
                </div>

                {forecastDays.length > 0 && (
                  <div style={styles.forecastSection}>
                    <h4 style={styles.forecastTitle}>5-Day Forecast</h4>
                    <div style={styles.forecastGrid}>
                      {forecastDays.map((day, idx) => (
                        <div key={idx} style={styles.forecastCard}>
                          <div style={styles.forecastDate}>
                            {new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                          </div>
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

                {loadingForecast && !forecastDays.length && (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#999' }}>
                    Loading forecast...
                  </div>
                )}
              </div>
            )}

            {/* ── ATTRACTIONS ── */}
            {activeTab === "Attractions" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {loadingPois && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                    Loading nearby places…
                  </div>
                )}

                {poisError && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#e74c3c', fontSize: 13 }}>
                    {poisError}
                  </div>
                )}

                {!loadingPois && !poisError && (
                  <>
                    {[
                      { key: 'tourism',    label: '🏛️ Attractions',  emoji: '🏛️' },
                      { key: 'restaurant', label: '🍜 Restaurants',   emoji: '🍜' },
                      { key: 'hotel',      label: '🏨 Hotels',        emoji: '🏨' },
                      { key: 'beach',      label: '🏖️ Beaches',       emoji: '🏖️' },
                    ].map(({ key, label }) => (
                      <div key={key} style={styles.infoCard}>
                        <h3 style={styles.cardTitle}>{label}</h3>
                        {poisByCategory[key]?.length === 0 ? (
                          <p style={{ fontSize: 13, color: '#aaa' }}>No nearby {label.split(' ')[1].toLowerCase()} found.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {poisByCategory[key]?.map((place, i) => (
                              <div key={place.id || i} style={{
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                padding: '10px 14px', background: '#f8f9fc',
                                borderRadius: 10, border: '1px solid #eee', gap: 10,
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#222', marginBottom: 2 }}>
                                    {place.name}
                                  </div>
                                  {place.desc && (
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                                      {place.desc}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 12, color: '#a6a6a6' }}>📍 {place.address}</div>
                                  {place.opening_hours && (
                                    <div style={{ fontSize: 12, color: '#a6a6a6' }}>🕐 {place.opening_hours}</div>
                                  )}
                                  {place.cuisine && (
                                    <div style={{ fontSize: 12, color: '#a6a6a6' }}>🍽️ {place.cuisine}</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                  {place.distanceKm != null && place.distanceKm !== Infinity && (
                                    <span style={{
                                      fontSize: 11, fontWeight: 600, color: '#3e84f6',
                                      background: '#eef4ff', borderRadius: 99, padding: '2px 8px',
                                    }}>
                                      {place.distanceKm} km
                                    </span>
                                  )}
                                  {place.phone && (
                                    <span style={{ fontSize: 11, color: '#888' }}>📞 {place.phone}</span>
                                  )}
                                  {onOpenExplorer && place.lat && place.lon && (
                                    <button
                                      onClick={() => onOpenExplorer(place)}
                                      style={{
                                        marginTop: 4,
                                        fontSize: 11, fontWeight: 600,
                                        color: '#0d9488', background: '#f0fdfa',
                                        border: '1px solid #99f6e4',
                                        borderRadius: 99, padding: '3px 10px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      🗺️ View on Map
                                    </button>
                                  )}
                                </div>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── BUDGET ── */}
            {activeTab === "Budget" && (
              <div style={styles.budgetContainer}>
                {/* Budget Header */}
                <div style={styles.budgetHeader}>
                  <h3 style={styles.cardTitle}>💰 Trip Budget</h3>
                  <button 
                    style={styles.refreshBudgetBtn}
                    title="Recalculate totals"
                    onClick={() => {
                      const spent = budgetItems.reduce((sum, item) => sum + item.amount, 0);
                      const remaining = budgetTotal - spent;
                      console.log(`💰 Budget: RM ${budgetTotal} | Spent: RM ${spent} | Remaining: RM ${remaining}`);
                    }}
                  >
                    🔄 View Summary
                  </button>
                </div>

                {/* Summary Cards */}
                <div style={styles.budgetSummaryGrid}>
                  <div style={{...budgetSummaryCard, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>💰 Total Budget</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>RM {budgetTotal.toLocaleString()}</div>
                  </div>
                  <div style={{...budgetSummaryCard, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>💸 Total Spent</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>RM {budgetItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                  </div>
                  <div style={{...budgetSummaryCard, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>💚 Remaining</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>RM {(budgetTotal - budgetItems.reduce((s, i) => s + i.amount, 0)).toLocaleString()}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {budgetTotal > 0 && (() => {
                  const spent = budgetItems.reduce((s, i) => s + i.amount, 0);
                  const pct = Math.min((spent / budgetTotal) * 100, 100);
                  const isOverBudget = spent > budgetTotal;
                  return (
                    <div style={styles.progressSection}>
                      <div style={styles.progressLabel}>
                        <span>Budget Used</span>
                        <span style={{ fontWeight: 700, color: isOverBudget ? '#e74c3c' : '#3e84f6' }}>
                          {pct.toFixed(1)}% {isOverBudget && '⚠️ Over Budget!'}
                        </span>
                      </div>
                      <div style={styles.progressBarTrack}>
                        <div style={{
                          width: `${Math.min(pct, 100)}%`,
                          height: '100%',
                          background: isOverBudget ? '#e74c3c' : pct > 80 ? '#f59e0b' : '#3e84f6',
                          borderRadius: 99,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })()}
                
                {/* Quick Add Section */}
                <div style={styles.quickAddSection}>
                  <h4 style={styles.sectionSubtitle}>➕ Add Expense</h4>
                  <div style={styles.quickAddRow}>
                    <input
                      type="text"
                      placeholder="e.g., Hard Rock Hotel, Flight ticket, Nasi Kandar..."
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      style={{ ...styles.textInput, flex: 2 }}
                    />
                    <input
                      type="number"
                      placeholder="Amount (RM)"
                      value={newItemAmount}
                      onChange={e => setNewItemAmount(e.target.value)}
                      style={{ ...styles.textInput, flex: 1 }}
                    />
                    <button
                      onClick={async () => {
                        if (!newItemLabel.trim() || !newItemAmount) return;
                        const newItem = { label: newItemLabel.trim(), amount: parseFloat(newItemAmount) };
                        const updated = [...budgetItems, newItem];
                        setBudgetItems(updated);
                        setNewItemLabel('');
                        setNewItemAmount('');
                        try {
                          await tripService.updateTrip(tripData._id, {
                            budget: { total: budgetTotal, items: updated },
                          });
                        } catch (err) {
                          console.error('Failed to save budget:', err);
                        }
                      }}
                      style={styles.addBtn}
                    >
                      + Add
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>💡 Examples:</span>
                    <span>🏨 Hotel - RM450</span>
                    <span>✈️ Flight - RM200</span>
                    <span>🍜 Food - RM30</span>
                    <span>🎟️ Entry - RM20</span>
                  </div>
                </div>

                {/* Expenses List */}
                <div style={styles.expensesList}>
                  <h4 style={styles.sectionSubtitle}>📋 Expense Breakdown</h4>
                  {budgetItems.length === 0 ? (
                    <div style={styles.emptyExpenses}>
                      <span style={{ fontSize: 48 }}>💰</span>
                      <p>No expenses added yet.</p>
                      <p style={{ fontSize: 12, color: '#aaa' }}>Add your first expense above!</p>
                    </div>
                  ) : (
                    <>
                      {Object.entries(
                        budgetItems.reduce((groups, item) => {
                          const category = item.label.split(' ')[0];
                          if (!groups[category]) groups[category] = [];
                          groups[category].push(item);
                          return groups;
                        }, {} as Record<string, typeof budgetItems>)
                      ).map(([category, items]) => {
                        const categoryTotal = items.reduce((sum, i) => sum + i.amount, 0);
                        return (
                          <div key={category} style={styles.expenseCategory}>
                            <div style={styles.categoryHeader}>
                              <span style={styles.categoryName}>{category}</span>
                              <span style={styles.categoryTotal}>RM {categoryTotal.toLocaleString()}</span>
                            </div>
                            {items.map((item, idx) => (
                              <div key={idx} style={styles.expenseItem}>
                                <span style={styles.expenseLabel}>{item.label}</span>
                                <div style={styles.expenseRight}>
                                  <span style={styles.expenseAmount}>RM {item.amount.toLocaleString()}</span>
                                  <button
                                    onClick={async () => {
                                      const updated = budgetItems.filter((_, i) => i !== idx);
                                      setBudgetItems(updated);
                                      try {
                                        await tripService.updateTrip(tripData._id, {
                                          budget: { total: budgetTotal, items: updated },
                                        });
                                      } catch (err) {
                                        console.error('Failed to delete expense:', err);
                                      }
                                    }}
                                    style={styles.deleteExpenseBtn}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Budget Tips */}
                {budgetItems.length > 0 && (
                  <div style={styles.budgetTips}>
                    <h4 style={styles.sectionSubtitle}>💡 Budget Insights</h4>
                    <div style={styles.tipsList}>
                      {(() => {
                        const spent = budgetItems.reduce((s, i) => s + i.amount, 0);
                        const remaining = budgetTotal - spent;
                        if (remaining < 0) {
                          return <div style={styles.tipItem}>⚠️ You're over budget by RM {Math.abs(remaining).toLocaleString()}!</div>;
                        } else if (remaining < budgetTotal * 0.2) {
                          return <div style={styles.tipItem}>⚠️ Only {((remaining / budgetTotal) * 100).toFixed(0)}% of budget remaining. Watch your spending!</div>;
                        } else if (spent === 0) {
                          return <div style={styles.tipItem}>💡 Start adding your expenses to track your budget!</div>;
                        } else {
                          return <div style={styles.tipItem}>✅ You have RM {remaining.toLocaleString()} left to spend. Keep up the good work!</div>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* ── End of detail column ── */}

        {/* ── Right: Edit Panel ── */}
        {showEditPanel && (
          <div style={styles.editPanel}>
            <div style={styles.editHeader}>
              <h2 style={styles.editTitle}>Edit Trip</h2>
              <button style={styles.closeEditBtn} onClick={() => setShowEditPanel(false)} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={styles.editForm}>
              {/* Destination */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Destination</label>
                <input
                  type="text"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  style={styles.textInput}
                />
              </div>

              {/* Dates */}
              <div style={styles.dateRow}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditStartDate(value);
                      if (editEndDate && value && value > editEndDate) setEditEndDate('');
                    }}
                    style={styles.dateInput}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    min={editStartDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
              </div>

              {/* Status */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Status</label>
                <div style={styles.statusPreview}>
                  {(tripData.status || getStatusFromDates(editStartDate, editEndDate)) === 'upcoming' ? '📅 Upcoming' : (tripData.status || getStatusFromDates(editStartDate, editEndDate)) === 'ongoing' ? '🔄 Ongoing' : '✅ Completed'}
                </div>
              </div>

              {/* Total Budget */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Total Budget (RM)</label>
                <input
                  type="number"
                  value={editBudgetTotal}
                  onChange={e => setEditBudgetTotal(parseFloat(e.target.value) || 0)}
                  style={styles.textInput}
                  placeholder="e.g. 2000"
                />
              </div>

              {/* Notes */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={styles.textArea}
                  rows={4}
                />
              </div>

              {/* Preferences */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Preferences</label>
                <input
                  type="text"
                  value={editPreferences}
                  onChange={(e) => setEditPreferences(e.target.value)}
                  style={styles.textInput}
                  placeholder="e.g. Food, Culture, Nature"
                />
              </div>

              {/* Buttons */}
              <div style={styles.editBtnRow}>
                <button style={styles.cancelBtn} onClick={() => setShowEditPanel(false)}>
                  Cancel
                </button>
                <button
                  style={styles.updateBtn}
                  onClick={async () => {
                    try {
                      const [destination, country] = editDestination.split(',').map(s => s.trim());
                      const newStatus = getStatusFromDates(editStartDate, editEndDate);
                      const updatedTrip = await tripService.updateTrip(tripData._id, {
                        destination,
                        country,
                        startDate: editStartDate,
                        endDate: editEndDate,
                        notes: editNotes,
                        preferences: editPreferences,
                        status: newStatus,
                        budget: { total: editBudgetTotal, items: budgetItems },
                      });
                      setTripData(updatedTrip);
                      setBudgetTotal(editBudgetTotal);
                      setShowEditPanel(false);
                      setEditDestination(`${updatedTrip.destination}, ${updatedTrip.country}`);
                      setEditStartDate(updatedTrip.startDate);
                      setEditEndDate(updatedTrip.endDate);
                      setEditNotes(updatedTrip.notes);
                      setEditPreferences(updatedTrip.preferences);
                      await refreshWeather();
                    } catch (err) {
                      console.error('Failed to update trip:', err);
                      alert('Failed to update trip. Please try again.');
                    }
                  }}
                >
                  Update Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Trip?</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete your trip to{" "}
              <strong>{tripData.destination}, {tripData.country}</strong>? This cannot be undone.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                style={styles.deleteConfirmBtn}
                onClick={async () => {
                  try {
                    await tripService.deleteTrip(tripData._id);
                    setShowDeleteConfirm(false);
                    onDelete?.();
                    onBack();
                  } catch (err) {
                    console.error('Failed to delete trip:', err);
                    alert('Failed to delete trip. Please try again.');
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Budget summary card style (standalone, used inline) ─────────────────────

const budgetSummaryCard: CSSProperties = {
  flex: 1, background: '#f8f9fc', borderRadius: 12,
  padding: '14px 16px', border: '1px solid #eee',
  display: 'flex', flexDirection: 'column', gap: 4,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    color: "#111",
    animation: "fadeSlideUp 0.4s ease both",
  },
  layout: {
    maxWidth: 1200,
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
    transition: "flex 0.3s ease",
  },
  detailColumnNarrow: {
    flex: "0 0 55%",
  },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#555" },
  actionBtns: { display: "flex", alignItems: "center", gap: 10 },
  editBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 10,
    border: "1.5px solid #ddeaff", color: "#3e84f6", background: "#eef4ff",
    fontSize: 13, fontWeight: 600,
  },
  deleteBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 10,
    border: "1.5px solid #ffe0e0", color: "#e74c3c", background: "#fff5f5",
    fontSize: 13, fontWeight: 600,
  },
  tripHeader: { display: "flex", flexDirection: "column", gap: 6 },
  tripTitle: { fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: "#111" },
  tripDates: { fontSize: 13, color: "#a6a6a6", fontWeight: 500 },
  tripMetaRow: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  typeBadge: { fontSize: 12, fontWeight: 700, color: "#3e84f6", background: "#eef4ff", borderRadius: 999, padding: "4px 10px" },
  tripAddress: { fontSize: 13, color: "#6b7280", fontWeight: 500 },
  statusBadge: {
    fontSize: 11, fontWeight: 700, color: "#fff",
    padding: "3px 12px", borderRadius: 20, textTransform: "capitalize",
  },
  categoryBadge: {
    fontSize: 11, fontWeight: 700, color: "#fff",
    padding: "3px 12px", borderRadius: 20, textTransform: "capitalize",
    marginLeft: 8,
  },
  badgeRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  heroWrap: { position: "relative", borderRadius: 16, overflow: "hidden", height: 260 },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)" },
  tabBar: { display: "flex", borderBottom: "1.5px solid #eee" },
  tab: { position: "relative", padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#888", background: "none", border: "none", cursor: "pointer" },
  tabActive: { color: "#3e84f6", fontWeight: 600 },
  tabUnderline: { position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: "#3e84f6", borderRadius: 2 },
  tabContent: { flex: 1 },
  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 },
  infoCard: {
    background: "#fff", borderRadius: 14, padding: "20px",
    border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    display: "flex", flexDirection: "column", gap: 14, marginTop: 16,
  },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111" },
  weatherMain: { display: "flex", alignItems: "center", gap: 12 },
  weatherEmoji: { fontSize: 36 },
  weatherTemp: { fontSize: 22, fontWeight: 700, color: "#111" },
  weatherCond: { fontSize: 12, color: "#888", marginTop: 2 },
  weatherDetails: { display: "flex", flexDirection: "column", gap: 6 },
  weatherRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  weatherLabel: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  weatherVal: { fontSize: 13, fontWeight: 600, color: "#333" },
  forecastSection: { marginTop: 20 },
  forecastTitle: { fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12, fontFamily: "'Syne', sans-serif" },
  forecastGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
  forecastCard: {
    background: "linear-gradient(135deg, #eef4ff 0%, #f5f0ff 100%)",
    borderRadius: 14, padding: "14px 10px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    border: "1px solid #e8eaed", textAlign: "center" as const,
  },
  forecastDate: { fontSize: 11, fontWeight: 700, color: "#3e84f6", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  forecastEmoji: { fontSize: 28, lineHeight: 1 },
  forecastTemp: { fontSize: 16, fontWeight: 700, color: "#111" },
  forecastCondition: { fontSize: 11, color: "#888", fontWeight: 500 },
  forecastSmall: { fontSize: 11, color: "#6b7280", fontWeight: 500 },
  attractionsList: { display: "flex", flexDirection: "column", gap: 10 },
  attractionRow: { display: "flex", alignItems: "center", gap: 10 },
  attractionImg: { width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  attractionName: { flex: 1, fontSize: 13, fontWeight: 600, color: "#222" },
  attractionDist: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  viewMoreBtn: { fontSize: 13, fontWeight: 600, color: "#3e84f6", textAlign: "left" },
  notesText: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  cardDesc: { fontSize: 14, color: "#4b5563", lineHeight: 1.6, marginTop: 4 },
  detailLine: { fontSize: 13, color: "#4b5563", lineHeight: 1.7 },
  prefChips: { display: "flex", flexWrap: "wrap", gap: 8 },
  prefChip: { fontSize: 12, fontWeight: 600, color: "#3e84f6", background: "#eef4ff", borderRadius: 20, padding: "4px 12px" },
  editPanel: {
    flex: "0 0 38%",
    background: "#fff", borderRadius: 18, padding: "28px",
    border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    display: "flex", flexDirection: "column", gap: 20,
    alignSelf: "flex-start", animation: "slideInRight 0.3s ease both",
  },
  editHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  editTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#111" },
  closeEditBtn: {
    width: 32, height: 32, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#888", background: "#f5f7fa",
  },
  editForm: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "#333" },
  textInput: {
    padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e8eaed", fontSize: 14, color: "#111",
    outline: "none", background: "#fafafa",
  },
  textArea: {
    padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e8eaed", fontSize: 14, color: "#111",
    outline: "none", background: "#fafafa",
    resize: "vertical", lineHeight: 1.5,
  },
  dateRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  dateInput: {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e8eaed", fontSize: 14, color: "#111",
    outline: "none", background: "#fafafa",
  },
  statusPreview: {
    padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e8eaed", background: "#fafafa", color: "#111",
    minHeight: 44, display: "flex", alignItems: "center",
  },
  editBtnRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 },
  cancelBtn: {
    padding: "11px 0", borderRadius: 10,
    border: "1.5px solid #e8eaed", fontSize: 14, fontWeight: 600, color: "#555", background: "#fff",
  },
  updateBtn: {
    padding: "11px 0", borderRadius: 10,
    border: "none", fontSize: 14, fontWeight: 600, color: "#fff", background: "#3e84f6",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 200, animation: "fadeIn 0.2s ease both",
  },
  modal: {
    background: "#fff", borderRadius: 18, padding: "32px",
    maxWidth: 400, width: "90%",
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#111" },
  modalText: { fontSize: 14, color: "#555", lineHeight: 1.6 },
  modalBtns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 },
  deleteConfirmBtn: {
    padding: "11px 0", borderRadius: 10,
    border: "none", fontSize: 14, fontWeight: 600, color: "#fff", background: "#e74c3c",
  },

    // Budget section styles
  budgetContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 16,
  },
  budgetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshBudgetBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    background: "#eef4ff",
    color: "#3e84f6",
    cursor: "pointer",
  },
  budgetSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 500,
    color: "#555",
  },
  progressBarTrack: {
    background: "#f0f0f0",
    borderRadius: 99,
    height: 8,
    overflow: "hidden",
  },
  quickAddSection: {
    background: "#f8f9fc",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #eee",
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    marginBottom: 12,
  },
  quickAddRow: {
    display: "flex",
    gap: 8,
  },
  addBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    background: "#3e84f6",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  expensesList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyExpenses: {
    textAlign: "center",
    padding: 32,
    color: "#aaa",
    background: "#f8f9fc",
    borderRadius: 12,
  },
  expenseCategory: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #eee",
    overflow: "hidden",
  },
  categoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#f8f9fc",
    borderBottom: "1px solid #eee",
    fontWeight: 600,
  },
  categoryName: {
    fontSize: 13,
    color: "#333",
  },
  categoryTotal: {
    fontSize: 13,
    color: "#3e84f6",
  },
  expenseItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid #f5f5f5",
  },
  expenseLabel: {
    fontSize: 13,
    color: "#555",
  },
  expenseRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
  },
  deleteExpenseBtn: {
    fontSize: 14,
    color: "#ccc",
    cursor: "pointer",
    padding: "0 4px",
  },
  budgetTips: {
    background: "#fef9e6",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #ffe0b2",
  },
  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tipItem: {
    fontSize: 12,
    color: "#d97706",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
};