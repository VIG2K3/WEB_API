const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  destination: { type: String, required: true },
  country: { type: String, default: 'Penang, Malaysia' },
  dates: { type: String, default: 'Flexible dates' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  image: { type: String, default: '' },
  address: { type: String, default: '' },
  description: { type: String, default: '' },
  type: { type: String, default: '' },
  lat: { type: Number },
  lon: { type: Number },
  weather: {
    temp: { type: String, default: 'N/A' },
    condition: { type: String, default: 'Planned' },
    humidity: { type: String, default: '' },
    wind: { type: String, default: '' },
    feelsLike: { type: String, default: '' },
    icon: { type: String, default: '📍' },
  },
  attractions: { type: [Object], default: [] },
  notes: { type: String, default: '' },
  preferences: { type: String, default: '' },
  status:    { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  favourited: { type: Boolean, default: false },
  isFavouriteOnly: { type: Boolean, default: false },
  tripType: { type: String, enum: ['single', 'multi'], default: 'single' },
  stops: {
    type: [
      {
        name: { type: String, required: true },
        address: { type: String, default: '' },
        lat: { type: Number },
        lon: { type: Number },
        category: { type: String, default: '' },
      }
    ],
    default: [],
  },
  category: { type: String, default: '' },
  budget: {
    total: { type: Number, default: 0 },
    items: {
      type: [
        {
          label: { type: String, required: true },
          amount: { type: Number, required: true },
        }
      ],
      default: [],
    },
  },
});

module.exports = mongoose.model("Trip", TripSchema);