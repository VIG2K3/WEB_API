import { useState } from "react";
import type { CSSProperties } from "react";

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

type TabType = "Overview" | "Weather" | "Attractions" | "Notes";

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TripDetail({ trip, onBack }: TripDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);

  // Edit form state — initialised from the trip prop
  const [editDestination, setEditDestination] = useState<string>(`${trip.city}, ${trip.country}`);
  const [editStartDate, setEditStartDate] = useState<string>(trip.startDate);
  const [editEndDate, setEditEndDate] = useState<string>(trip.endDate);
  const [editNotes, setEditNotes] = useState<string>(trip.notes);
  const [editPreferences, setEditPreferences] = useState<string>(trip.preferences);

  const tabs: TabType[] = ["Overview", "Weather", "Attractions", "Notes"];

  const formatHeaderDate = (start: string, end: string): string => {
    const s = new Date(start);
    const e = new Date(end);
    const startFmt = s.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const endFmt = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${startFmt} – ${endFmt}`;
  };

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

      {/* ── Outer flex row: detail + edit panel side by side ── */}
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
              Back to My Trips
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
            <h1 style={styles.tripTitle}>{trip.city}, {trip.country}</h1>
            <p style={styles.tripDates}>{formatHeaderDate(trip.startDate, trip.endDate)}</p>
            <span style={{
              ...styles.statusBadge,
              background: trip.status === "upcoming" ? "#3e84f6"
                : trip.status === "ongoing" ? "#22c55e"
                : "#a6a6a6",
            }}>
              {trip.status}
            </span>
          </div>

          {/* Hero Image */}
          <div style={styles.heroWrap}>
            <img src={trip.image} alt={trip.city} style={styles.heroImg} />
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

            {activeTab === "Overview" && (
              <div style={styles.overviewGrid}>
                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Weather Now</h3>
                  <div style={styles.weatherMain}>
                    <span style={styles.weatherEmoji}>{trip.weather.icon}</span>
                    <div>
                      <div style={styles.weatherTemp}>{trip.weather.temp}</div>
                      <div style={styles.weatherCond}>{trip.weather.condition}</div>
                    </div>
                  </div>
                  <div style={styles.weatherDetails}>
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Humidity</span>
                      <span style={styles.weatherVal}>{trip.weather.humidity}</span>
                    </div>
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Wind</span>
                      <span style={styles.weatherVal}>{trip.weather.wind}</span>
                    </div>
                    <div style={styles.weatherRow}>
                      <span style={styles.weatherLabel}>Feels like</span>
                      <span style={styles.weatherVal}>{trip.weather.feelsLike}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Top Attractions</h3>
                  <div style={styles.attractionsList}>
                    {trip.attractions.map((a, i) => (
                      <div key={i} style={styles.attractionRow}>
                        <img src={a.image} alt={a.name} style={styles.attractionImg} />
                        <span style={styles.attractionName}>{a.name}</span>
                        <span style={styles.attractionDist}>{a.distance}</span>
                      </div>
                    ))}
                  </div>
                  <button style={styles.viewMoreBtn}>View more places</button>
                </div>
              </div>
            )}

            {activeTab === "Weather" && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>Weather Forecast</h3>
                <div style={styles.weatherMain}>
                  <span style={styles.weatherEmoji}>{trip.weather.icon}</span>
                  <div>
                    <div style={styles.weatherTemp}>{trip.weather.temp}</div>
                    <div style={styles.weatherCond}>{trip.weather.condition}</div>
                  </div>
                </div>
                <div style={styles.weatherDetails}>
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Humidity</span>
                    <span style={styles.weatherVal}>{trip.weather.humidity}</span>
                  </div>
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Wind</span>
                    <span style={styles.weatherVal}>{trip.weather.wind}</span>
                  </div>
                  <div style={styles.weatherRow}>
                    <span style={styles.weatherLabel}>Feels like</span>
                    <span style={styles.weatherVal}>{trip.weather.feelsLike}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Attractions" && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>Top Attractions</h3>
                <div style={styles.attractionsList}>
                  {trip.attractions.map((a, i) => (
                    <div key={i} style={styles.attractionRow}>
                      <img src={a.image} alt={a.name} style={styles.attractionImg} />
                      <span style={styles.attractionName}>{a.name}</span>
                      <span style={styles.attractionDist}>{a.distance}</span>
                    </div>
                  ))}
                </div>
                <button style={styles.viewMoreBtn}>View more places</button>
              </div>
            )}

            {activeTab === "Notes" && (
              <div style={styles.infoCard}>
                <h3 style={styles.cardTitle}>Trip Notes</h3>
                <p style={styles.notesText}>{trip.notes}</p>
                <div style={styles.prefChips}>
                  {trip.preferences.split(", ").map((p) => (
                    <span key={p} style={styles.prefChip}>{p}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
        {/* ── End of detail column ── */}

        {/* ── Right: Edit Panel (slides in beside detail) ── */}
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
                    onChange={(e) => setEditStartDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
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
                  onClick={() => {
                    // TODO: PUT /api/trips/:_id with updated data
                    setShowEditPanel(false);
                  }}
                >
                  Update Trip
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
      {/* ── End of layout ── */}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Trip?</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete your trip to{" "}
              <strong>{trip.city}, {trip.country}</strong>? This cannot be undone.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                style={styles.deleteConfirmBtn}
                onClick={() => {
                  // TODO: DELETE /api/trips/:_id
                  setShowDeleteConfirm(false);
                  onBack();
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    color: "#111",
    animation: "fadeSlideUp 0.4s ease both",
  },

  // Outer flex row
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 48px 80px",
    display: "flex",
    flexDirection: "row",
    gap: 28,
    alignItems: "flex-start",
  },

  // Detail column — shrinks when edit panel is open
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

  // Top bar
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

  // Trip header
  tripHeader: { display: "flex", flexDirection: "column", gap: 6 },
  tripTitle: { fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: "#111" },
  tripDates: { fontSize: 13, color: "#a6a6a6", fontWeight: 500 },
  statusBadge: {
    alignSelf: "flex-start", fontSize: 11, fontWeight: 700, color: "#fff",
    padding: "3px 12px", borderRadius: 20, textTransform: "capitalize",
  },

  // Hero
  heroWrap: { position: "relative", borderRadius: 16, overflow: "hidden", height: 260 },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)" },

  // Tabs
  tabBar: { display: "flex", borderBottom: "1.5px solid #eee" },
  tab: { position: "relative", padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#888", background: "none", border: "none", cursor: "pointer" },
  tabActive: { color: "#3e84f6", fontWeight: 600 },
  tabUnderline: { position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: "#3e84f6", borderRadius: 2 },
  tabContent: { flex: 1 },

  // Overview grid
  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 },
  infoCard: {
    background: "#fff", borderRadius: 14, padding: "20px",
    border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    display: "flex", flexDirection: "column", gap: 14, marginTop: 16,
  },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111" },

  // Weather
  weatherMain: { display: "flex", alignItems: "center", gap: 12 },
  weatherEmoji: { fontSize: 36 },
  weatherTemp: { fontSize: 22, fontWeight: 700, color: "#111" },
  weatherCond: { fontSize: 12, color: "#888", marginTop: 2 },
  weatherDetails: { display: "flex", flexDirection: "column", gap: 6 },
  weatherRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  weatherLabel: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  weatherVal: { fontSize: 13, fontWeight: 600, color: "#333" },

  // Attractions
  attractionsList: { display: "flex", flexDirection: "column", gap: 10 },
  attractionRow: { display: "flex", alignItems: "center", gap: 10 },
  attractionImg: { width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  attractionName: { flex: 1, fontSize: 13, fontWeight: 600, color: "#222" },
  attractionDist: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  viewMoreBtn: { fontSize: 13, fontWeight: 600, color: "#3e84f6", textAlign: "left" },

  // Notes
  notesText: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  prefChips: { display: "flex", flexWrap: "wrap", gap: 8 },
  prefChip: { fontSize: 12, fontWeight: 600, color: "#3e84f6", background: "#eef4ff", borderRadius: 20, padding: "4px 12px" },

  // Edit panel
  editPanel: {
    flex: "0 0 38%",
    background: "#fff",
    borderRadius: 18,
    padding: "28px",
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    alignSelf: "flex-start",
    animation: "slideInRight 0.3s ease both",
  },
  editHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
  editBtnRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 },
  cancelBtn: {
    padding: "11px 0", borderRadius: 10,
    border: "1.5px solid #e8eaed", fontSize: 14, fontWeight: 600, color: "#555", background: "#fff",
  },
  updateBtn: {
    padding: "11px 0", borderRadius: 10,
    border: "none", fontSize: 14, fontWeight: 600, color: "#fff", background: "#3e84f6",
  },

  // Delete modal
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
};
