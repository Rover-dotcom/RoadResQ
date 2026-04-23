const express = require("express");
const router = express.Router();

const admin = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminAuth");

// DRIVER
router.get("/drivers", adminAuth, admin.getDrivers);
router.put("/drivers/:id/approve", adminAuth, admin.approveDriver);
router.put("/drivers/:id/block", adminAuth, admin.blockDriver);

// JOBS
router.get("/jobs", adminAuth, admin.getJobs);

// GARAGE
router.get("/garage-requests", adminAuth, admin.getGarageRequests);

// QUOTES
router.get("/quotes/:id", adminAuth, admin.getQuotesByJob);

// PRICING
router.put("/pricing", adminAuth, admin.updatePricing);

// REPORTS
router.get("/stats", adminAuth, admin.getStats);

module.exports = router;
