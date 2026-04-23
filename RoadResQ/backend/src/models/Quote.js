const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  jobId: mongoose.Schema.Types.ObjectId,
  driverId: mongoose.Schema.Types.ObjectId,
  price: Number,
  eta: Number
});

module.exports = mongoose.model("Quote", quoteSchema);
