const Driver = require("../models/Driver");
const Job = require("../models/Job");
const Pricing = require("../models/Pricing");

async function approveDriver(driverId) {
  return await Driver.findByIdAndUpdate(driverId, {
    isApproved: true
  }, { new: true });
}

async function blockDriver(driverId) {
  return await Driver.findByIdAndUpdate(driverId, {
    isOnline: false
  }, { new: true });
}

async function getAllJobs() {
  return await Job.find().sort({ createdAt: -1 });
}

async function updatePricing(data) {
  return await Pricing.findOneAndUpdate({}, data, {
    new: true,
    upsert: true
  });
}

module.exports = {
  approveDriver,
  blockDriver,
  getAllJobs,
  updatePricing
};
