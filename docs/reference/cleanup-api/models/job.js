const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  clientName: String,
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  photos: [String], // Array of Firebase URLs
  // ... other fields
});

module.exports = mongoose.model("Job", jobSchema);