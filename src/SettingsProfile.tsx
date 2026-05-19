import { useState } from "react";
import type { CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsProfileProps {
  onBack: () => void;
}

type TabId = "profile" | "preferences" | "notifications" | "security" | "appearance";

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "profile", icon: "👤", label: "Profile" },
  { id: "preferences", icon: "🌍", label: "Travel Preferences" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "security", icon: "🔒", label: "Security" },
  { id: "appearance", icon: "🎨", label: "Appearance" },
];

const TRAVEL_INTERESTS = [
  "🍜 Food & Cuisine",
  "🏛️ Culture & History",
  "🌿 Nature & Outdoors",
  "🎭 Arts & Entertainment",
  "🛍️ Shopping",
  "🏖️ Beach & Relaxation",
  "🏔️ Adventure & Sports",
  "📸 Photography",
  "🎵 Music & Nightlife",
  "🧘 Wellness & Spa",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsProfile({ onBack }: SettingsProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("Traveller");
  const [email, setEmail] = useState("traveller@email.com");
  const [phone, setPhone] = useState("+60 12-345 6789");
  const [bio, setBio] = useState("Adventure seeker & street food lover 🍜");
  const [homeCity, setHomeCity] = useState("George Town, Penang");
  const [currency, setCurrency] = useState("MYR");
  const [language, setLanguage] = useState("English");

  // Preferences state
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["🍜 Food & Cuisine", "🏛️ Culture & History"]);
  const [tripStyle, setTripStyle] = useState("Explorer");
  const [budgetRange, setBudgetRange] = useState("Mid-range");

  // Notifications state
  const [notifs, setNotifs] = useState({
    tripReminders: true,
    weatherAlerts: true,
    aiSuggestions: false,
    newsletter: false,
    priceDrops: true,
  });

  // Security state
  const [twoFA, setTwoFA] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState("Light");
  const [accentColor, setAccentColor] = useState("#3e84f6");
  const [compactMode, setCompactMode] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div style={s.root}>
      {/* ── Saved Banner ── */}
      {savedBanner && (
        <div style={s.savedBanner}>
          ✅ Changes saved successfully!
        </div>
      )}

      {/* ── Header ── */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          ← Back
        </button>
        <div style={s.headerCenter}>
          <h1 style={s.headerTitle}>Settings & Profile</h1>
        </div>
        <button style={s.saveBtn} onClick={handleSave}>
          Save Changes
        </button>
      </header>

      <div style={s.layout}>
        {/* ── Sidebar ── */}
        <aside style={s.sidebar}>
          {/* Avatar Block */}
          <div style={s.avatarBlock}>
            <div style={s.avatarWrap}>
              <div style={s.avatar}>
                <span style={s.avatarInitial}>T</span>
              </div>
              <button style={s.avatarEditBtn} title="Change photo">✏️</button>
            </div>
            <p style={s.avatarName}>{displayName}</p>
            <p style={s.avatarEmail}>{email}</p>
            <div style={s.avatarBadge}>✈️ 1 Trip Planned</div>
          </div>

          {/* Nav */}
          <nav style={s.sideNav}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                style={{
                  ...s.sideNavItem,
                  ...(activeTab === tab.id ? s.sideNavItemActive : {}),
                  ...(hoveredTab === tab.id && activeTab !== tab.id ? s.sideNavItemHover : {}),
                }}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={s.sideNavIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Danger zone */}
          <div style={s.dangerZone}>
            <button style={s.logoutBtn}>🚪 Log Out</button>
            <button style={s.deleteBtn}>🗑️ Delete Account</button>
          </div>
        </aside>

        {/* ── Main Panel ── */}
        <main style={s.panel}>

          {/* ══ PROFILE TAB ══ */}
          {activeTab === "profile" && (
            <div style={s.tabContent}>
              <SectionHeader title="Personal Information" subtitle="Update your public profile details" />

              <div style={s.formGrid}>
                <Field label="Display Name">
                  <input style={s.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </Field>
                <Field label="Email Address">
                  <input style={s.input} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </Field>
                <Field label="Phone Number">
                  <input style={s.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="Home City">
                  <input style={s.input} value={homeCity} onChange={(e) => setHomeCity(e.target.value)} />
                </Field>
                <Field label="Currency">
                  <select style={s.input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {["MYR", "USD", "EUR", "GBP", "SGD", "JPY", "AUD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <select style={s.input} value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {["English", "Bahasa Melayu", "中文", "தமிழ்", "日本語"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Bio">
                <textarea
                  style={{ ...s.input, ...s.textarea }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell the world about your travel style…"
                />
              </Field>

              <Divider />
              <SectionHeader title="Passport & Travel Docs" subtitle="Stored securely and never shared" />
              <div style={s.docCard}>
                <span style={s.docIcon}>🛂</span>
                <div style={s.docInfo}>
                  <p style={s.docTitle}>Passport</p>
                  <p style={s.docSub}>No document added yet</p>
                </div>
                <button style={s.docAddBtn}>+ Add</button>
              </div>
              <div style={s.docCard}>
                <span style={s.docIcon}>💉</span>
                <div style={s.docInfo}>
                  <p style={s.docTitle}>Vaccination Records</p>
                  <p style={s.docSub}>No document added yet</p>
                </div>
                <button style={s.docAddBtn}>+ Add</button>
              </div>
            </div>
          )}

          {/* ══ TRAVEL PREFERENCES TAB ══ */}
          {activeTab === "preferences" && (
            <div style={s.tabContent}>
              <SectionHeader title="Travel Interests" subtitle="Select everything that excites you" />
              <div style={s.interestsGrid}>
                {TRAVEL_INTERESTS.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      style={{ ...s.interestChip, ...(active ? s.interestChipActive : {}) }}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              <Divider />
              <SectionHeader title="Trip Style" subtitle="How do you like to travel?" />
              <div style={s.radioGroup}>
                {["Backpacker", "Explorer", "Comfort Seeker", "Luxury Traveller"].map((style) => (
                  <button
                    key={style}
                    style={{ ...s.radioCard, ...(tripStyle === style ? s.radioCardActive : {}) }}
                    onClick={() => setTripStyle(style)}
                  >
                    <span style={s.radioIcon}>
                      {style === "Backpacker" ? "🎒" : style === "Explorer" ? "🗺️" : style === "Comfort Seeker" ? "🛋️" : "💎"}
                    </span>
                    <span style={s.radioLabel}>{style}</span>
                    {tripStyle === style && <span style={s.radioCheck}>✓</span>}
                  </button>
                ))}
              </div>

              <Divider />
              <SectionHeader title="Budget Range" subtitle="Typical daily spend (excluding flights)" />
              <div style={s.radioGroup}>
                {["Budget (< RM150/day)", "Mid-range (RM150–500/day)", "Premium (RM500+/day)"].map((b) => (
                  <button
                    key={b}
                    style={{ ...s.radioCard, ...(budgetRange === b.split(" ")[0] ? s.radioCardActive : {}) }}
                    onClick={() => setBudgetRange(b.split(" ")[0])}
                  >
                    <span style={s.radioLabel}>{b}</span>
                    {budgetRange === b.split(" ")[0] && <span style={s.radioCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS TAB ══ */}
          {activeTab === "notifications" && (
            <div style={s.tabContent}>
              <SectionHeader title="Notification Settings" subtitle="Choose what you want to hear about" />
              <div style={s.toggleList}>
                {(
                  [
                    { key: "tripReminders", label: "Trip Reminders", sub: "Get reminded 7 days and 1 day before your trip", icon: "✈️" },
                    { key: "weatherAlerts", label: "Weather Alerts", sub: "Receive alerts for severe weather at your destination", icon: "⛈️" },
                    { key: "aiSuggestions", label: "AI Suggestions", sub: "Let our AI suggest places and activities for your trips", icon: "✦" },
                    { key: "priceDrops", label: "Price Drop Alerts", sub: "Notify me when hotels or flights drop in price", icon: "💸" },
                    { key: "newsletter", label: "Travel Newsletter", sub: "Weekly curated travel ideas and inspiration", icon: "📰" },
                  ] as { key: keyof typeof notifs; label: string; sub: string; icon: string }[]
                ).map(({ key, label, sub, icon }) => (
                  <div key={key} style={s.toggleRow}>
                    <span style={s.toggleIcon}>{icon}</span>
                    <div style={s.toggleText}>
                      <p style={s.toggleLabel}>{label}</p>
                      <p style={s.toggleSub}>{sub}</p>
                    </div>
                    <button
                      style={{ ...s.toggle, ...(notifs[key] ? s.toggleOn : {}) }}
                      onClick={() => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <span style={{ ...s.toggleKnob, ...(notifs[key] ? s.toggleKnobOn : {}) }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SECURITY TAB ══ */}
          {activeTab === "security" && (
            <div style={s.tabContent}>
              <SectionHeader title="Password" subtitle="Keep your account secure with a strong password" />
              <div style={s.formGrid}>
                <Field label="Current Password">
                  <input style={s.input} type="password" placeholder="••••••••" />
                </Field>
                <Field label="New Password">
                  <input style={s.input} type="password" placeholder="••••••••" />
                </Field>
                <Field label="Confirm New Password">
                  <input style={s.input} type="password" placeholder="••••••••" />
                </Field>
              </div>
              <button style={s.primaryBtn}>Update Password</button>

              <Divider />
              <SectionHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account" />
              <div style={s.toggleRow}>
                <span style={s.toggleIcon}>🔐</span>
                <div style={s.toggleText}>
                  <p style={s.toggleLabel}>Enable 2FA</p>
                  <p style={s.toggleSub}>{twoFA ? "Two-factor authentication is active" : "Disabled — your account is less secure"}</p>
                </div>
                <button
                  style={{ ...s.toggle, ...(twoFA ? s.toggleOn : {}) }}
                  onClick={() => setTwoFA((v) => !v)}
                >
                  <span style={{ ...s.toggleKnob, ...(twoFA ? s.toggleKnobOn : {}) }} />
                </button>
              </div>

              <Divider />
              <SectionHeader title="Active Sessions" subtitle="Devices currently logged into your account" />
              {[
                { device: "MacBook Pro · Chrome", location: "George Town, MY", time: "Active now", current: true },
                { device: "iPhone 15 · Safari", location: "George Town, MY", time: "2 hours ago", current: false },
              ].map((session) => (
                <div key={session.device} style={s.sessionRow}>
                  <span style={s.sessionIcon}>{session.device.includes("iPhone") ? "📱" : "💻"}</span>
                  <div style={s.toggleText}>
                    <p style={s.toggleLabel}>{session.device}</p>
                    <p style={s.toggleSub}>{session.location} · {session.time}</p>
                  </div>
                  {session.current ? (
                    <span style={s.sessionBadge}>Current</span>
                  ) : (
                    <button style={s.sessionRevoke}>Revoke</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══ APPEARANCE TAB ══ */}
          {activeTab === "appearance" && (
            <div style={s.tabContent}>
              <SectionHeader title="Theme" subtitle="Choose how TravelSmart looks for you" />
              <div style={s.themeGrid}>
                {["Light", "Dark", "System"].map((t) => (
                  <button
                    key={t}
                    style={{ ...s.themeCard, ...(theme === t ? s.themeCardActive : {}) }}
                    onClick={() => setTheme(t)}
                  >
                    <div style={{ ...s.themeSwatch, background: t === "Light" ? "#f5f7fa" : t === "Dark" ? "#1a1d23" : "linear-gradient(135deg, #f5f7fa 50%, #1a1d23 50%)" }} />
                    <span style={s.themeLabel}>{t}</span>
                    {theme === t && <span style={s.radioCheck}>✓</span>}
                  </button>
                ))}
              </div>

              <Divider />
              <SectionHeader title="Accent Color" subtitle="Personalise your app color" />
              <div style={s.colorRow}>
                {["#3e84f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    style={{
                      ...s.colorSwatch,
                      background: color,
                      outline: accentColor === color ? `3px solid ${color}` : "3px solid transparent",
                      outlineOffset: 3,
                    }}
                    onClick={() => setAccentColor(color)}
                  />
                ))}
              </div>

              <Divider />
              <SectionHeader title="Layout" subtitle="Adjust the app density" />
              <div style={s.toggleRow}>
                <span style={s.toggleIcon}>⚡</span>
                <div style={s.toggleText}>
                  <p style={s.toggleLabel}>Compact Mode</p>
                  <p style={s.toggleSub}>Reduce padding and spacing for a denser layout</p>
                </div>
                <button
                  style={{ ...s.toggle, ...(compactMode ? s.toggleOn : {}) }}
                  onClick={() => setCompactMode((v) => !v)}
                >
                  <span style={{ ...s.toggleKnob, ...(compactMode ? s.toggleKnobOn : {}) }} />
                </button>
              </div>
            </div>
          )}

          {/* Save Button (bottom of panel) */}
          <div style={s.panelFooter}>
            <button style={s.saveBtnLarge} onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #3e84f6; outline-offset: 0; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={s.sectionTitle}>{title}</h3>
      <p style={s.sectionSub}>{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={s.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    color: "#111",
    animation: "fadeSlideUp 0.4s ease both",
  },
  savedBanner: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    zIndex: 9999,
    animation: "slideDown 0.3s ease",
    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  },

  // Header
  header: {
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
  },
  backBtn: {
    fontSize: 14,
    fontWeight: 600,
    color: "#3e84f6",
    padding: "7px 14px",
    borderRadius: 8,
    background: "#eef4ff",
  },
  headerCenter: { flex: 1, display: "flex", justifyContent: "center" },
  headerTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
  },
  saveBtn: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    padding: "8px 20px",
    borderRadius: 10,
    background: "#3e84f6",
  },

  // Layout
  layout: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 48px 80px",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 28,
    alignItems: "start",
  },

  // Sidebar
  sidebar: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
    position: "sticky",
    top: 90,
  },
  avatarBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 20px 24px",
    borderBottom: "1px solid #f0f0f0",
    gap: 6,
  },
  avatarWrap: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3e84f6, #6aaeff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 32,
    fontWeight: 800,
    color: "#fff",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #f0f0f0",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  avatarName: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#111",
  },
  avatarEmail: { fontSize: 12, color: "#a6a6a6", fontWeight: 500 },
  avatarBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#3e84f6",
    background: "#eef4ff",
    padding: "4px 10px",
    borderRadius: 20,
  },
  sideNav: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 10px",
    gap: 2,
  },
  sideNavItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "#555",
    textAlign: "left",
    transition: "all 0.15s",
  },
  sideNavItemHover: {
    background: "#f5f7fa",
    color: "#111",
  },
  sideNavItemActive: {
    background: "#eef4ff",
    color: "#3e84f6",
    fontWeight: 600,
  },
  sideNavIcon: { fontSize: 16 },
  dangerZone: {
    borderTop: "1px solid #f0f0f0",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  logoutBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "#555",
    textAlign: "left",
  },
  deleteBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "#e74c3c",
    textAlign: "left",
  },

  // Panel
  panel: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  tabContent: {
    padding: "36px 40px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  panelFooter: {
    padding: "24px 40px 36px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "flex-end",
  },
  saveBtnLarge: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    padding: "12px 32px",
    borderRadius: 12,
    background: "#3e84f6",
    letterSpacing: 0.2,
  },

  // Form
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 24px",
    marginBottom: 20,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid #e8eaed",
    fontSize: 14,
    color: "#111",
    background: "#fafbfc",
    width: "100%",
    transition: "border-color 0.15s",
  },
  textarea: {
    resize: "vertical",
    minHeight: 80,
    lineHeight: 1.5,
  },

  // Docs
  docCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderRadius: 12,
    border: "1.5px dashed #e0e4ea",
    marginBottom: 10,
    background: "#fafbfc",
  },
  docIcon: { fontSize: 22 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: 600, color: "#111" },
  docSub: { fontSize: 12, color: "#a6a6a6" },
  docAddBtn: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3e84f6",
    padding: "6px 14px",
    borderRadius: 8,
    background: "#eef4ff",
  },

  // Interests
  interestsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  interestChip: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1.5px solid #e8eaed",
    fontSize: 13,
    fontWeight: 500,
    color: "#555",
    background: "#fafbfc",
    transition: "all 0.15s",
  },
  interestChipActive: {
    background: "#eef4ff",
    borderColor: "#3e84f6",
    color: "#3e84f6",
    fontWeight: 600,
  },

  // Radio Cards
  radioGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  radioCard: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid #e8eaed",
    fontSize: 14,
    fontWeight: 500,
    color: "#555",
    background: "#fafbfc",
    display: "flex",
    alignItems: "center",
    gap: 8,
    textAlign: "left",
    transition: "all 0.15s",
  },
  radioCardActive: {
    background: "#eef4ff",
    borderColor: "#3e84f6",
    color: "#3e84f6",
    fontWeight: 600,
  },
  radioIcon: { fontSize: 18 },
  radioLabel: { flex: 1, fontSize: 13 },
  radioCheck: { fontSize: 13, color: "#3e84f6", fontWeight: 700 },

  // Toggle
  toggleList: { display: "flex", flexDirection: "column", gap: 0 },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  toggleIcon: { fontSize: 20, width: 28, textAlign: "center" },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 },
  toggleSub: { fontSize: 12, color: "#a6a6a6" },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    background: "#e0e4ea",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleOn: { background: "#3e84f6" },
  toggleKnob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    transition: "left 0.2s",
  },
  toggleKnobOn: { left: 23 },

  // Session
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  sessionIcon: { fontSize: 20, width: 28, textAlign: "center" },
  sessionBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#10b981",
    background: "#d1fae5",
    padding: "4px 10px",
    borderRadius: 20,
  },
  sessionRevoke: {
    fontSize: 12,
    fontWeight: 600,
    color: "#e74c3c",
    padding: "5px 12px",
    borderRadius: 8,
    background: "#fef2f2",
  },

  // Appearance
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginBottom: 24,
  },
  themeCard: {
    padding: "16px",
    borderRadius: 14,
    border: "1.5px solid #e8eaed",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    transition: "all 0.15s",
    background: "#fafbfc",
  },
  themeCardActive: {
    borderColor: "#3e84f6",
    background: "#eef4ff",
  },
  themeSwatch: {
    width: "100%",
    height: 56,
    borderRadius: 8,
    border: "1px solid #e8eaed",
  },
  themeLabel: { fontSize: 13, fontWeight: 600, color: "#111" },
  colorRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    transition: "outline 0.15s",
  },

  // Section
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },
  sectionSub: { fontSize: 13, color: "#a6a6a6" },
  divider: {
    height: 1,
    background: "#f0f0f0",
    margin: "28px 0",
  },
  primaryBtn: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    padding: "10px 24px",
    borderRadius: 10,
    background: "#3e84f6",
    marginTop: 8,
    marginBottom: 8,
  },
};
