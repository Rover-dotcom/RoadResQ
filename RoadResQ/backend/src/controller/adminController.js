const adminService = require("../services/adminService");
const Driver = require("../models/Driver");
const Job = require("../models/Job");
const GarageRequest = require("../models/GarageRequest");


// 🔹 DRIVER MANAGEMENT

exports.getDrivers = async (req, res) => {
  const drivers = await Driver.find();
  res.json(drivers);
};

exports.approveDriver = async (req, res) => {
  const driver = await adminService.approveDriver(req.params.id);
  res.json(driver);
};

exports.blockDriver = async (req, res) => {
  const driver = await adminService.blockDriver(req.params.id);
  res.json(driver);
};


// 🔹 JOB MANAGEMENT

exports.getJobs = async (req, res) => {
  const jobs = await adminService.getAllJobs();
  res.json(jobs);
};


// 🔹 GARAGE REQUESTS

exports.getGarageRequests = async (req, res) => {
  const requests = await GarageRequest.find();
  res.json(requests);
};


// 🔹 QUOTE MONITOR

exports.getQuotesByJob = async (req, res) => {
  const Quote = require("../models/Quote");
  const quotes = await Quote.find({ jobId: req.params.id });
  res.json(quotes);
};


// 🔹 PRICING CONTROL

exports.updatePricing = async (req, res) => {
  const pricing = await adminService.updatePricing(req.body);
  res.json(pricing);
};


// 🔹 REPORTS (BASIC)

exports.getStats = async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const totalDrivers = await Driver.countDocuments();

  res.json({
    totalJobs,
    totalDrivers
  });
};
