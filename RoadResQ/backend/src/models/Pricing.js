const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema({
  baseFare: Number,        // 25000 = QR 250
  perKm: Number,           // 500 = QR 5/km

  nightMultiplier: Number, // 1.25
  peakMultiplier: Number,  // 1.25

  heavyMultiplier: Number, // 1.5+

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pricing", pricingSchema);
