const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  garageId: mongoose.Schema.Types.ObjectId,

  type: String, // urgent / quote

  description: String,
  images: [String],

  quotedPrice: Number,

  status: String, // pending / quoted / accepted / dispatched

  jobId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model("GarageRequest", schema);
