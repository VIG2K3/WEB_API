const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment variables");
const JWT_EXPIRES = "3d";

const DEFAULT_NOTIFICATION_SETTINGS = {
  tripReminders: true,
  emailNotifications: false,
};

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePic: user.profilePic,
    emailVerified: user.emailVerified,
    notificationSettings: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(user.notificationSettings?.toObject?.() || user.notificationSettings || {}),
    },
  };
}

function makeOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpEmail({ to, subject, title, otp, reason }) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Travel Smart Penang" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
        <h2 style="color:#1a1a2e;margin-top:0">${title}</h2>
        <p style="color:#555;margin:12px 0">${reason} This code expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6c63ff;text-align:center;padding:20px;background:#f5f3ff;border-radius:10px;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// OTP store
const otpStore = new Map();

function saveOtp(purpose, email, otp) {
  otpStore.set(`${purpose}:${email.toLowerCase()}`, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function verifyOtpRecord(purpose, email, otp) {
  const key = `${purpose}:${email.toLowerCase()}`;
  const record = otpStore.get(key);

  if (!record) {
    return { ok: false, message: "No code found. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { ok: false, message: "Code has expired. Please request a new one." };
  }

  if (record.otp !== otp) {
    return { ok: false, message: "Incorrect code. Please try again." };
  }

  return { ok: true, key };
}

// Pending signup store
// User is stored here temporarily until OTP is verified
const pendingSignupStore = new Map();

function savePendingSignup(email, data) {
  pendingSignupStore.set(email.toLowerCase(), {
    ...data,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function getPendingSignup(email) {
  const key = email.toLowerCase();
  const record = pendingSignupStore.get(key);

  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    pendingSignupStore.delete(key);
    return null;
  }

  return record;
}

// REGISTER: only send OTP, do not save user yet
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const otp = makeOtp();

    saveOtp("verify-email", normalizedEmail, otp);

    savePendingSignup(normalizedEmail, {
      name: name.trim(),
      email: normalizedEmail,
      password,
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      subject: "Verify your Travel Smart Penang account",
      title: "Verify Your Email",
      otp,
      reason: "Use this code to verify your account email.",
    });

    res.status(200).json({
      message: "Verification code sent. Please verify your email.",
      email: normalizedEmail,
      needsVerification: true,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed. Please try again later or check internet connection." });
  }
});

// VERIFY EMAIL: create user only after correct OTP
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const check = verifyOtpRecord("verify-email", normalizedEmail, otp);
    if (!check.ok) {
      return res.status(400).json({ message: check.message });
    }

    const pendingUser = getPendingSignup(normalizedEmail);
    if (!pendingUser) {
      return res.status(400).json({ message: "Signup session expired. Please register again." });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      emailVerified: true,
      notificationSettings: pendingUser.notificationSettings,
    });

    otpStore.delete(check.key);
    pendingSignupStore.delete(normalizedEmail);

    const token = createToken(user);

    res.json({
      token,
      user: publicUser(user),
      message: "Email verified successfully. Account created.",
    });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Failed to verify email" });
  }
});

// RESEND OTP
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "This email is already registered" });
    }

    const pendingUser = getPendingSignup(normalizedEmail);
    if (!pendingUser) {
      return res.status(404).json({ message: "Signup session expired. Please register again." });
    }

    const otp = makeOtp();
    saveOtp("verify-email", normalizedEmail, otp);

    await sendOtpEmail({
      to: normalizedEmail,
      subject: "Verify your Travel Smart Penang account",
      title: "Verify Your Email",
      otp,
      reason: "Use this code to verify your account email.",
    });

    res.json({ message: "Verification code sent" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Failed to resend verification code" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = createToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// PROFILE
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, phone, bio, homeCity, currency, language, profilePic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, bio, homeCity, currency, language, profilePic },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// NOTIFICATION SETTINGS
router.get("/notification-settings", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationSettings");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(user.notificationSettings?.toObject?.() || user.notificationSettings || {}),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notification settings" });
  }
});

router.put("/notification-settings", requireAuth, async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.tripReminders === "boolean") {
      updates.tripReminders = req.body.tripReminders;
    }

    if (typeof req.body.emailNotifications === "boolean") {
      updates.emailNotifications = req.body.emailNotifications;
    }

    const currentUser = await User.findById(req.user.id).select("notificationSettings");
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const merged = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(currentUser.notificationSettings?.toObject?.() || currentUser.notificationSettings || {}),
      ...updates,
    };

    currentUser.notificationSettings = merged;
    await currentUser.save();

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification settings" });
  }
});

// SECURITY PASSWORD OTP
router.post("/security/request-password-otp", requireAuth, async (req, res) => {
  try {
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const otp = makeOtp();
    saveOtp("change-password", user.email, otp);

    await sendOtpEmail({
      to: user.email,
      subject: "Confirm your password change",
      title: "Security Verification",
      otp,
      reason: "Use this code to confirm your password change.",
    });

    res.json({ message: `Security code sent to ${user.email}` });
  } catch (err) {
    console.error("Security OTP error:", err);
    res.status(500).json({ message: "Failed to send security code" });
  }
});

// CHANGE PASSWORD
router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;

    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({
        message: "Current password, new password and OTP are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const check = verifyOtpRecord("change-password", user.email, otp);
    if (!check.ok) return res.status(400).json({ message: check.message });

    user.password = newPassword;
    await user.save();

    otpStore.delete(check.key);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.emailVerified) {
      return res.json({
        message: "If that account exists, a code has been sent to its verified email.",
      });
    }

    const otp = makeOtp();
    saveOtp("reset-password", user.email, otp);

    await sendOtpEmail({
      to: user.email,
      subject: "Your password reset code",
      title: "Password Reset",
      otp,
      reason: "Use this code to reset your password.",
    });

    res.json({
      message: "If that account exists, a code has been sent to its verified email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      message: "Failed to send reset email. Check EMAIL_USER and EMAIL_PASS in .env",
    });
  }
});

// VERIFY RESET OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const check = verifyOtpRecord("reset-password", normalizedEmail, otp);
  if (!check.ok) {
    return res.status(400).json({ message: check.message });
  }

  const resetToken = jwt.sign(
    { email: normalizedEmail, purpose: "reset" },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

  res.json({ resetToken });
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    let payload;

    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Reset link has expired. Please start again.",
      });
    }

    if (payload.purpose !== "reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findOne({ email: payload.email });

    if (!user || !user.emailVerified) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    otpStore.delete(`reset-password:${payload.email}`);

    res.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;