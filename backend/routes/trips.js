const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");

router.get("/upcoming", async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

module.exports = router;