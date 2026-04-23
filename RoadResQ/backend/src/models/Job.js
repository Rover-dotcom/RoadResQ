const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,

  location: {
    lat: Number,
    lng: Number
  },

  isOnline: Boolean,

  vehicleType: String,
  equipmentType: String,

  maxCapacity: Number,
  vehicleHeight: Number,

  experience: Number,
  rating: Number,

  warnings: { type: Number, default: 0 },

  documents: {
    licenseExpiry: Date,
    gatePass: [String]
  }
});

module.exports = mongoose.model("Driver", driverSchema);
