const express = require("express");
const router = express.Router();
const controller = require("../controllers/jobController");

router.post("/", controller.createJob);

module.exports = router;
