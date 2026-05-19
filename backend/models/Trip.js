const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema({
  city: String,
  country: String,
  dates: String,
  startDate: String,
  endDate: String,
  weather: String,
  condition: String,
  weatherIcon: String,
  image: String,
});

module.exports = mongoose.model("Trip", TripSchema);