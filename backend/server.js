const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/travelsmart")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
const tripsRoute = require("./routes/trips");
app.use("/api/trips", tripsRoute);

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));