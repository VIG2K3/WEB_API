import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./assets/bg_remove_logo.png";

import img1 from "./images/test1.jpg";
import img2 from "./images/test2.jpg";
import img3 from "./images/test3.jpg";
import img4 from "./images/test4.jpg";
import img5 from "./images/test5.jpg";
import img6 from "./images/test6.jpg";
import img7 from "./images/test7.jpg";
import img8 from "./images/test8.png";
import img9 from "./images/test9.jpg";
import img10 from "./images/test10.jpg";
import img11 from "./images/test11.png";

const slides = [
  { url: img1, label: "Penang Island" },
  { url: img2, label: "Kek Lok Si Temple" },
  { url: img3, label: "Komtar Penang" },
  { url: img4, label: "Air Itam Dam" },
  { url: img5, label: "Penang Hill" },
  { url: img6, label: "Fort Cornwallis" },
  { url: img7, label: "Georgetown Heritage Site" },
  { url: img8, label: "Clan Jetties (Floating Village)" },
  { url: img9, label: "Monkey Beach (Teluk Duyung)" },
  { url: img10, label: "Penang Butterfly Farm" },
  { url: img11, label: "ESCAPE Penang" },
];

function EyeButton({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={styles.eyeBtn}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [slide, setSlide] = useState(0);

  // ── Forgot password flow ──
  const [forgotStep, setForgotStep] = useState("none"); // "none" | "email" | "otp" | "newpass"
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);
      navigate("/home");
    } catch (error) {
      setLoginError(error.response?.data?.message || "Invalid email or password");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  // ── Step 1: send OTP ──
  const handleSendOtp = async () => {
    setForgotError(""); setForgotMsg(""); setForgotLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email: forgotEmail });
      setForgotMsg("A 6-digit code has been sent to your email.");
      setForgotStep("otp");
    } catch (e) {
      setForgotError(e.response?.data?.message || "Failed to send code.");
    } finally { setForgotLoading(false); }
  };

  // ── Step 2: verify OTP ──
  const handleVerifyOtp = async () => {
    setForgotError(""); setForgotLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", { email: forgotEmail, otp });
      setResetToken(res.data.resetToken);
      setForgotStep("newpass");
    } catch (e) {
      setForgotError(e.response?.data?.message || "Incorrect code.");
    } finally { setForgotLoading(false); }
  };

  // ── Step 3: reset password ──
  const handleResetPassword = async () => {
    setForgotError("");
    if (newPassword.length < 8) return setForgotError("Password must be at least 8 characters.");
    if (newPassword !== confirmNewPassword) return setForgotError("Passwords do not match.");
    setForgotLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", { resetToken, newPassword });
      setForgotStep("none");
      setLoginError("");
      alert("Password reset successfully! Please log in with your new password.");
    } catch (e) {
      setForgotError(e.response?.data?.message || "Failed to reset password.");
    } finally { setForgotLoading(false); }
  };

  return (
    <div style={styles.page}>
      {slides.map((item, i) => (
        <div key={i} style={{
          ...styles.slideBg,
          backgroundImage: `url(${item.url})`,
          opacity: slide === i ? 1 : 0,
        }} />
      ))}

      <div style={styles.overlay} />

      <div style={styles.brand}>
        <img
        src={logo}
        alt="Travel Smart Logo"
        style={{ height: 60, width: "auto" }}
      />
      
      <div style={styles.brandText}>
        <h1 style={styles.brandName}>TRAVEL SMART PENANG</h1>
        <p style={styles.brandSubtitle}>Plan Smart. Travel Better.</p>
      </div>
    </div>

      <div style={styles.slideLabel}>{slides[slide].label}</div>

      <div style={styles.dots}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setSlide(i)} style={{
            ...styles.dot,
            background: slide === i ? "#fff" : "rgba(255,255,255,0.35)",
            width: slide === i ? "20px" : "8px",
          }} />
        ))}
      </div>

      <div style={styles.formWrapper}>

        {/* ── FORGOT PASSWORD MODAL OVERLAY ── */}
        {forgotStep !== "none" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,20,0.7)", backdropFilter: "blur(6px)", borderRadius: 20, zIndex: 10, display: "flex", flexDirection: "column", padding: "36px 32px", justifyContent: "center" }}>
            <button onClick={() => { setForgotStep("none"); setForgotError(""); setForgotMsg(""); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer" }}>✕</button>

            {forgotStep === "email" && (
              <>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Forgot Password?</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 20 }}>Enter your email and we'll send a 6-digit code.</p>
                <input type="email" placeholder="Your email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={styles.input} />
                {forgotError && <span style={styles.forgotError}>{forgotError}</span>}
                {forgotMsg   && <span style={styles.forgotSuccess}>{forgotMsg}</span>}
                <button style={styles.button} onClick={handleSendOtp} disabled={forgotLoading}>{forgotLoading ? "Sending…" : "Send Code"}</button>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Enter Code</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 20 }}>Check your email for the 6-digit code.</p>
                <input type="text" placeholder="6-digit code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} style={{ ...styles.input, letterSpacing: 6, fontSize: 20, textAlign: "center" }} />
                {forgotError && <span style={styles.forgotError}>{forgotError}</span>}
                <button style={styles.button} onClick={handleVerifyOtp} disabled={forgotLoading}>{forgotLoading ? "Verifying…" : "Verify Code"}</button>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 12, textAlign: "center" }}>
                  Didn't get it?{" "}
                  <span style={{ color: "rgba(255,255,255,0.8)", cursor: "pointer", fontWeight: 600 }} onClick={handleSendOtp}>Resend</span>
                </p>
              </>
            )}

            {forgotStep === "newpass" && (
              <>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>New Password</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 20 }}>Choose a new password (min. 8 characters).</p>
                <div style={styles.passwordWrapper}>
                  <input type={showNewPass ? "text" : "password"} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...styles.input, marginBottom: 0, paddingRight: "44px" }} />
                  <EyeButton visible={showNewPass} onToggle={() => setShowNewPass(p => !p)} />
                </div>
                <div style={{ marginBottom: 12 }} />
                <input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={styles.input} />
                {forgotError && <span style={styles.forgotError}>{forgotError}</span>}
                <button style={styles.button} onClick={handleResetPassword} disabled={forgotLoading}>{forgotLoading ? "Resetting…" : "Reset Password"}</button>
              </>
            )}
          </div>
        )}

        <h1 style={styles.title}>Welcome Back!</h1>
        <p style={styles.subtitle}>Have An Account With Us?</p>

        {loginError && (
          <div style={styles.errorBanner}>
            <span>⚠</span> {loginError}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
          onKeyDown={handleKeyDown}
        />

        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            style={{ ...styles.input, marginBottom: 0, paddingRight: "44px" }}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
            onKeyDown={handleKeyDown}
          />
          <EyeButton visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />
        </div>

        <p style={{ textAlign: "right", marginTop: 8, marginBottom: 4 }}>
          <span
            style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer", fontWeight: 500 }}
            onClick={() => { setForgotStep("email"); setForgotEmail(email); setForgotError(""); setForgotMsg(""); }}
          >
            Forgot password?
          </span>
        </p>

        <div style={{ marginTop: "12px" }} />

        <button style={styles.button} onClick={handleLogin}>Sign In</button>

        <p style={styles.signupText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.signupLink}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh", width: "100vw",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', Arial, sans-serif",
    position: "relative", overflow: "hidden",
  },
  slideBg: {
    position: "absolute", inset: 0,
    backgroundSize: "cover", backgroundPosition: "center",
    transition: "opacity 1.2s ease-in-out", zIndex: 0,
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.45)", zIndex: 1,
  },
  brand: {
    position: "absolute", top: "28px", left: "32px",
    zIndex: 3, display: "flex", alignItems: "center", gap: "10px",
  },
  brandName: {
    color: "#fff", fontSize: "20px", fontWeight: 700,
    fontFamily: "'Playfair Display', Georgia, serif",
    letterSpacing: "0.5px", textShadow: "0 1px 6px rgba(0,0,0,0.5)",
  },
  brandText: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "12px",
    margin: "2px 0 0",
    letterSpacing: "0.3px",
  },
  slideLabel: {
    position: "absolute", bottom: "50px", left: "50%",
    transform: "translateX(-50%)",
    color: "rgba(255,255,255,0.8)", fontSize: "12px",
    fontWeight: 500, letterSpacing: "2px",
    textTransform: "uppercase", zIndex: 3,
    whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.6)",
  },
  dots: {
    position: "absolute", bottom: "28px", left: "50%",
    transform: "translateX(-50%)",
    display: "flex", gap: "6px", zIndex: 3, alignItems: "center",
  },
  dot: {
    height: "8px", borderRadius: "4px",
    cursor: "pointer", transition: "all 0.3s ease",
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    color: "#fff", fontSize: "28px", fontWeight: 700,
    margin: "0 0 6px", textShadow: "0 1px 8px rgba(0,0,0,0.3)",
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)", fontSize: "12px",
    margin: "0 0 28px", letterSpacing: "0.3px",
  },
  errorBanner: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "rgba(231,76,60,0.15)",
    border: "1px solid rgba(231,76,60,0.4)",
    borderRadius: "10px", padding: "10px 14px",
    color: "#e74c3c", fontSize: "12px", fontWeight: 500,
    marginBottom: "16px",
  },
  input: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", padding: "12px 14px", color: "#fff",
    fontSize: "13px", outline: "none", marginBottom: "14px",
    fontFamily: "'DM Sans', Arial, sans-serif",
  },
  passwordWrapper: { position: "relative", width: "100%" },
  eyeBtn: {
    position: "absolute", right: "12px", top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    padding: "0", display: "flex", alignItems: "center", justifyContent: "center",
  },
  button: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #c0392b, #e74c3c)",
    border: "none", borderRadius: "10px", color: "#fff",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    fontFamily: "'DM Sans', Arial, sans-serif",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 16px rgba(192,57,43,0.4)",
  },
  signupText: {
    textAlign: "center", marginTop: "18px",
    color: "rgba(255,255,255,0.4)", fontSize: "12px",
  },
  signupLink: {
    color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 600,
  },
  forgotError: {
    display: "block", color: "#f87171", fontSize: "11px", fontWeight: 500, marginBottom: "10px",
  },
  forgotSuccess: {
    display: "block", color: "#4ade80", fontSize: "11px", fontWeight: 500, marginBottom: "10px",
  },
  formWrapper: {
    position: "relative", zIndex: 2,
    width: "360px",
    background: "rgba(10, 10, 20, 0.55)",
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px", padding: "44px 40px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
};

export default Login;