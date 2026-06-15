import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsProfileProps {
  onBack: () => void;
}

type TabId = "profile" | "notifications" | "security";

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "profile",       icon: "👤", label: "Profile" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "security",      icon: "🔒", label: "Security" },
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


type NotificationSettings = {
  tripReminders: boolean;
  emailNotifications: boolean;
};

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

const getSavedNotificationSettings = (): NotificationSettings => {
  try {
    const saved = localStorage.getItem(getNotificationStorageKey());
    return saved ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) } : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

const saveNotificationSettingsLocally = (settings: NotificationSettings) => {
  localStorage.setItem(getNotificationStorageKey(), JSON.stringify(settings));
};

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Password Change Form ─────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordChangeForm() {
  const [current,       setCurrent]       = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [otp,           setOtp]           = useState("");
  const [otpSent,       setOtpSent]       = useState(false);
  const [showCurrent,   setShowCurrent]   = useState(false);
  const [showNew,       setShowNew]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [status,        setStatus]        = useState<"idle"|"loading"|"success"|"error">("idle");
  const [msg,           setMsg]           = useState("");

  const validatePasswordFields = () => {
    if (!current || !newPass || !confirm) {
      setStatus("error");
      setMsg("All password fields are required.");
      return false;
    }
    if (newPass.length < 8) {
      setStatus("error");
      setMsg("New password must be at least 8 characters.");
      return false;
    }
    if (newPass !== confirm) {
      setStatus("error");
      setMsg("New passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    setMsg("");
    if (!validatePasswordFields()) return;

    setStatus("loading");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/security/request-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMsg(data.message || "Failed to send security code.");
        return;
      }
      setOtpSent(true);
      setStatus("success");
      setMsg(data.message || "Security code sent to your account email.");
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  const handleSubmit = async () => {
    setMsg("");
    if (!validatePasswordFields()) return;
    if (!otpSent) {
      setStatus("error");
      setMsg("Please request the OTP first.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setStatus("error");
      setMsg("Please enter the 6-digit OTP.");
      return;
    }

    setStatus("loading");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMsg(data.message || "Failed to change password."); return; }
      setStatus("success");
      setMsg("Password updated successfully!");
      setCurrent(""); setNewPass(""); setConfirm(""); setOtp(""); setOtpSent(false);
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  const pwField = (
    label: string, value: string, onChange: (v: string) => void,
    show: boolean, toggle: () => void, placeholder = "Enter password"
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 12px",
            borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14,
            outline: "none", fontFamily: "inherit", background: "#fafafa",
          }}
        />
        <button
          type="button"
          onClick={toggle}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex" }}
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 420 }}>
      {pwField("Current Password",     current, setCurrent, showCurrent, () => setShowCurrent(p => !p))}
      {pwField("New Password",         newPass, setNewPass, showNew,     () => setShowNew(p => !p), "Min. 8 characters")}
      {pwField("Confirm New Password", confirm, setConfirm, showConfirm, () => setShowConfirm(p => !p))}

      {otpSent && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
            OTP sent to your account email
          </label>
          <input
            type="text"
            value={otp}
            maxLength={6}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit OTP"
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 12px",
              borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 18,
              outline: "none", fontFamily: "inherit", background: "#fafafa",
              textAlign: "center", letterSpacing: 5,
            }}
          />
        </div>
      )}

      {msg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 500,
          background: status === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${status === "success" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          color: status === "success" ? "#16a34a" : "#dc2626",
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={handleSendOtp}
          disabled={status === "loading"}
          style={{
            padding: "11px 22px", borderRadius: 10, background: "#111827", color: "#fff",
            fontWeight: 600, fontSize: 14, border: "none", cursor: status === "loading" ? "default" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {otpSent ? "Resend OTP" : "Send OTP"}
        </button>

        <button
          onClick={handleSubmit}
          disabled={status === "loading" || !otpSent}
          style={{
            padding: "11px 28px", borderRadius: 10, background: "#6c63ff", color: "#fff",
            fontWeight: 600, fontSize: 14, border: "none", cursor: status === "loading" || !otpSent ? "default" : "pointer",
            opacity: status === "loading" || !otpSent ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsProfile({ onBack }: SettingsProfileProps) {
  const navigate    = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab,         setActiveTab]         = useState<TabId>("profile");
  const [hoveredTab,        setHoveredTab]        = useState<string | null>(null);
  const [savedBanner,       setSavedBanner]       = useState(false);
  const [saveError,         setSaveError]         = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading,         setIsLoading]         = useState(true);

  // Profile state — populated from DB on mount
  const [displayName, setDisplayName] = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [bio,         setBio]         = useState("");
  const [homeCity,    setHomeCity]    = useState("");
  const [currency,    setCurrency]    = useState("MYR");
  const [language,    setLanguage]    = useState("English");
  const [profilePic,  setProfilePic]  = useState("");

  // Notifications
  const [notifs, setNotifs] = useState<NotificationSettings>(() =>
    getSavedNotificationSettings()
  );

  const updateNotificationSetting = async (key: keyof NotificationSettings) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    saveNotificationSettingsLocally(updated);
    window.dispatchEvent(new CustomEvent("notification-settings-updated"));

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/auth/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        const saved = await res.json();
        const merged = { ...DEFAULT_NOTIFICATION_SETTINGS, ...saved };
        setNotifs(merged);
        saveNotificationSettingsLocally(merged);
        window.dispatchEvent(new CustomEvent("notification-settings-updated"));
      }
    } catch (err) {
      console.error("Failed to sync notification settings:", err);
    }
  };

  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || "?";

  // ── Load profile from MongoDB on mount ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Token may be stored standalone or inside the user object
        const token = localStorage.getItem("token")
          || JSON.parse(localStorage.getItem("user") || "{}").token
          || null;

        if (!token) {
          // No token — fall back to whatever is in localStorage rather than redirecting
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          setDisplayName(stored.name  || "");
          setEmail(      stored.email || "");
          setIsLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Auth failed — load from localStorage as fallback, don't redirect
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          setDisplayName(stored.name  || "");
          setEmail(      stored.email || "");
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setDisplayName(data.name       || "");
        setEmail(      data.email      || "");
        setPhone(      data.phone      || "");
        setBio(        data.bio        || "");
        setHomeCity(   data.homeCity   || "");
        setCurrency(   data.currency   || "MYR");
        setLanguage(   data.language   || "English");
        setProfilePic( data.profilePic || "");
        const loadedNotifs = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(data.notificationSettings || {}) };
        setNotifs(loadedNotifs);
        saveNotificationSettingsLocally(loadedNotifs);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Profile picture — convert to base64 ────────────────────────────────────
  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("Image must be under 2MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Save profile to MongoDB ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError("");
    try {
      const token = localStorage.getItem("token")
        || JSON.parse(localStorage.getItem("user") || "{}").token
        || null;

      if (!token) {
        // No token — just save to localStorage locally
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, name: displayName, phone, bio, homeCity, currency, language, profilePic }));
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 2500);
        return;
      }
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ name: displayName, phone, bio, homeCity, currency, language, profilePic }),
      });

      const data = await res.json();
      if (!res.ok) { setSaveError(data.message || "Save failed."); return; }

      // Sync localStorage so Homepage shows updated name / pic instantly
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...stored,
        name: displayName,
        profilePic,
        ...(data.user || {}),
      }));

      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch {
      setSaveError("Network error. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={s.root}>
      {/* ── Saved Banner ── */}
      {savedBanner && (
        <div style={s.savedBanner}>Changes saved successfully!</div>
      )}
      {saveError && (
        <div style={{ ...s.savedBanner, background: "#e74c3c" }}>⚠️ {saveError}</div>
      )}
      {isLoading && (
        <div style={s.loadingOverlay}>Loading profile…</div>
      )}

      {/* ── Logout Confirm Modal ── */}
      {showLogoutConfirm && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>🚪</div>
            <h3 style={s.modalTitle}>Log Out?</h3>
            <p style={s.modalSub}>You'll need to sign in again to access your account.</p>
            <div style={s.modalBtns}>
              <button style={s.modalCancel} onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button style={s.modalConfirm} onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          BACK
        </button>
        <div style={s.headerCenter}>
          <h1 style={s.headerTitle}>Settings</h1>
        </div>
        <div style={{ width: 120 }} />{/* spacer to keep title centered */}
      </header>

      <div style={s.layout}>
        {/* ── Sidebar ── */}
        <aside style={s.sidebar}>
          {/* Avatar Block */}
          <div style={s.avatarBlock}>
            <div style={s.avatarWrap}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={s.avatarImg} />
              ) : (
                <div style={s.avatar}>
                  <span style={s.avatarInitial}>{avatarLetter}</span>
                </div>
              )}
              <button
                style={s.avatarEditBtn}
                title="Change photo"
                onClick={() => fileInputRef.current?.click()}
              >✏️</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePicChange}
              />
            </div>
            <p style={s.avatarName}>{displayName || "Your Name"}</p>
            <p style={s.avatarEmail}>{email}</p>
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
            <button style={s.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
              🚪 Logout
            </button>
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
                  <input
                    style={{ ...s.input, ...s.readOnlyInput }}
                    value={email}
                    type="email"
                    readOnly
                    aria-readonly="true"
                    title="Email address cannot be changed"
                  />
                  <span style={s.fieldHint}>This email is linked to your account and cannot be edited.</span>
                </Field>
                <Field label="Phone Number">
                  <input style={s.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="City">
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

              <div style={{ marginTop: 24 }}>
                <button style={s.saveBtnLarge} onClick={handleSave}>
                  Save Changes
                </button>
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
                    {
                      key: "tripReminders",
                      label: "Trip Reminders",
                      sub: "Show trip reminders in the dashboard notification bell",
                      icon: "✈️",
                    },
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      sub: "Send email reminders with upcoming trip details",
                      icon: "📧",
                    },
                  ] as { key: keyof NotificationSettings; label: string; sub: string; icon: string }[]
                ).map(({ key, label, sub, icon }) => (
                  <div key={key} style={s.toggleRow}>
                    <span style={s.toggleIcon}>{icon}</span>
                    <div style={s.toggleText}>
                      <p style={s.toggleLabel}>{label}</p>
                      <p style={s.toggleSub}>{sub}</p>
                    </div>
                    <button
                      style={{ ...s.toggle, ...(notifs[key] ? s.toggleOn : {}) }}
                      onClick={() => updateNotificationSetting(key)}
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
              <SectionHeader title="Change Password" subtitle="Enter your current password and choose a new one" />
              <PasswordChangeForm />
            </div>
          )}
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
        @keyframes modalPop {
          from { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.92); }
          to { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
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
    background: "#f0ede8",
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

  // Logout Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)",
    zIndex: 9998,
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)",
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: 340,
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "modalPop 0.25s ease both",
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: "#a6a6a6",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  modalBtns: {
    display: "flex",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    padding: "11px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#555",
    background: "#f5f7fa",
    border: "1.5px solid #e8eaed",
  },
  modalConfirm: {
    flex: 1,
    padding: "11px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    boxShadow: "0 4px 12px rgba(231,76,60,0.3)",
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
  loadingOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 600,
    color: "#555",
    zIndex: 9997,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    objectFit: "cover" as const,
    border: "3px solid #eef4ff",
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
  readOnlyInput: {
    color: "#666",
    background: "#f1f3f5",
    cursor: "not-allowed",
  },
  fieldHint: {
    fontSize: 11,
    color: "#999",
    marginTop: -2,
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