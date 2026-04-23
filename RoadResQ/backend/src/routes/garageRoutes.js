const express = require("express");
const router = express.Router();
const controller = require("../controllers/garageController");

router.post("/", controller.createGarageRequest);

module.exports = router;
