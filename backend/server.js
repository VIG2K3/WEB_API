require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/travelsmart")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Rate limiter for Geoapify routes
const limiter = rateLimit({ windowMs: 60000, max: 60 });

// Routes
const tripsRoute  = require("./routes/trips");
const searchRoute = require("./routes/search");
const routeRoute  = require("./routes/route");

app.use("/api/trips",  tripsRoute);
app.use("/api/search", limiter, searchRoute);
app.use("/api/route",  limiter, routeRoute);

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));