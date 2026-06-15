const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/travelsmart";
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Rate limiter for Geoapify routes
const limiter = rateLimit({ windowMs: 60000, max: 60 });

// Routes
const tripsRoute  = require("./routes/trips");
const searchRoute = require("./routes/search");
const routeRoute  = require("./routes/route");
const authRoute   = require("./routes/auth");

app.use("/api/trips",  tripsRoute);
app.use("/api/search", limiter, searchRoute);
app.use("/api/route",  limiter, routeRoute);
app.use("/api/auth",   authRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));