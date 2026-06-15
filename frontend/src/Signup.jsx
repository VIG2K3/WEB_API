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
  { url: img7, label: "Georgetown Heritage Site" },
  { url: img8, label: "Clan Jetties (Floating Village)" },
  { url: img9, label: "Monkey Beach (Teluk Duyung)" },
  { url: img10, label: "Penang Butterfly Farm" },
  { url: img11, label: "ESCAPE Penang" },
  { url: img1, label: "Penang Island" },
  { url: img2, label: "Kek Lok Si Temple" },
  { url: img3, label: "Komtar Penang" },
  { url: img4, label: "Air Itam Dam" },
  { url: img5, label: "Penang Hill" },
  { url: img6, label: "Fort Cornwallis" },
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [slide, setSlide] = useState(0);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, skip to home
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) navigate("/home");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);


  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (val && val.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    } else {
      setPasswordError("");
    }
    if (confirmPassword && val !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
    } else if (confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (val && val !== password) {
      setConfirmPasswordError("Passwords do not match.");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSignup = async () => {
    let valid = true;
    setVerifyError("");

    if (!name.trim()) {
      alert("Please enter your full name.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setVerificationEmail(response.data.email || email.trim());
      setVerifyStep(true);
      setSuccessMsg(response.data.message || "Verification code sent to your email.");
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyError("");
    if (verificationOtp.length !== 6) {
      setVerifyError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-email", {
        email: verificationEmail,
        otp: verificationOtp,
      });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);
      setSuccessMsg("Email verified successfully! Redirecting to home...");
      setTimeout(() => navigate("/home"), 800);
    } catch (error) {
      setVerifyError(error.response?.data?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyError("");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/resend-verification", {
        email: verificationEmail || email.trim(),
      });
      setSuccessMsg("A new verification code has been sent.");
    } catch (error) {
      setVerifyError(error.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
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
        <h1 style={styles.title}>Create An Account</h1>
        <p style={styles.subtitle}>Join Our Travel Smart Community.</p>

        {/* SUCCESS TOAST */}
        {successMsg && (
          <div style={styles.toast}>
            <span style={styles.toastIcon}>✓</span>
            <div>
              <div style={styles.toastTitle}>{verifyStep ? "Check your email" : "Account created successfully!"}</div>
              <div style={styles.toastSub}>{successMsg}</div>
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!!successMsg || verifyStep}
        />

        <input
          type="email"
          placeholder="Email"
          style={{
            ...styles.input,
            borderColor: emailError ? "rgba(231,76,60,0.7)" : "rgba(255,255,255,0.15)",
          }}
          value={email}
          onChange={handleEmailChange}
          disabled={!!successMsg || verifyStep}
        />
        {emailError && <span style={styles.errorText}>{emailError}</span>}

        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password (min. 8 characters)"
            style={{
              ...styles.input,
              marginBottom: 0,
              paddingRight: "44px",
              borderColor: passwordError ? "rgba(231,76,60,0.7)" : "rgba(255,255,255,0.15)",
            }}
            value={password}
            onChange={handlePasswordChange}
            disabled={!!successMsg || verifyStep}
          />
          <EyeButton visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />
        </div>
        {passwordError && <span style={{ ...styles.errorText, marginTop: "6px" }}>{passwordError}</span>}

        <div style={{ ...styles.passwordWrapper, marginTop: "14px" }}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            style={{
              ...styles.input,
              marginBottom: 0,
              paddingRight: "44px",
              borderColor: confirmPasswordError ? "rgba(231,76,60,0.7)" : "rgba(255,255,255,0.15)",
            }}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={!!successMsg || verifyStep}
          />
          <EyeButton visible={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />
        </div>
        {confirmPasswordError && <span style={{ ...styles.errorText, marginTop: "6px" }}>{confirmPasswordError}</span>}

        <div style={{ marginTop: "16px" }} />

        {verifyStep && (
          <div style={{ marginTop: "4px", marginBottom: "14px" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", margin: "0 0 10px" }}>
              Enter the 6-digit OTP sent to <strong>{verificationEmail}</strong>.
            </p>
            <input
              type="text"
              placeholder="6-digit OTP"
              maxLength={6}
              style={{ ...styles.input, textAlign: "center", letterSpacing: "6px", fontSize: "18px" }}
              value={verificationOtp}
              onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, ""))}
            />
            {verifyError && <span style={styles.errorText}>{verifyError}</span>}
            <button
              style={{ ...styles.button, marginBottom: "10px", opacity: loading ? 0.6 : 1 }}
              onClick={handleVerifyEmail}
              disabled={loading}
            >
              {loading ? "Verifying…" : "Verify Email"}
            </button>
            <p style={{ textAlign: "center", margin: "0", color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>
              Didn't get it? <span onClick={handleResendVerification} style={{ color: "rgba(255,255,255,0.85)", cursor: "pointer", fontWeight: 600 }}>Resend OTP</span>
            </p>
          </div>
        )}

        {!verifyStep && (
          <button
            style={{ ...styles.button, opacity: loading ? 0.5 : 1, cursor: loading ? "default" : "pointer" }}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Sending OTP…" : "Sign Up"}
          </button>
        )}

        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link to="/" style={styles.loginLink}>Sign In</Link>
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
  formWrapper: {
    position: "relative", zIndex: 2,
    width: "360px",
    background: "rgba(10, 10, 20, 0.55)",
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px", padding: "44px 40px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    display: "flex", flexDirection: "column",
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
  toast: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "rgba(39,174,96,0.2)",
    border: "1px solid rgba(39,174,96,0.5)",
    borderRadius: "10px", padding: "12px 14px",
    marginBottom: "16px",
    backdropFilter: "blur(8px)",
  },
  toastIcon: {
    width: "28px", height: "28px",
    background: "rgba(39,174,96,0.85)",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: "14px", fontWeight: 700,
    flexShrink: 0,
  },
  toastTitle: {
    color: "#2ecc71", fontSize: "12px", fontWeight: 600,
  },
  toastSub: {
    color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px",
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
  errorText: {
    display: "block", color: "#e74c3c",
    fontSize: "11px", fontWeight: 500, marginBottom: "10px",
  },
  button: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #c0392b, #e74c3c)",
    border: "none", borderRadius: "10px", color: "#fff",
    fontSize: "14px", fontWeight: 600, cursor: "pointer",
    fontFamily: "'DM Sans', Arial, sans-serif",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 16px rgba(192,57,43,0.4)",
    transition: "opacity 0.2s",
  },
  loginText: {
    textAlign: "center", marginTop: "18px",
    color: "rgba(255,255,255,0.4)", fontSize: "12px",
  },
  loginLink: {
    color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 600,
  },
};

export default Signup;