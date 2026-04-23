const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  role: { type: String, default: "customer" }, // customer / driver / garage
  isApproved: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
