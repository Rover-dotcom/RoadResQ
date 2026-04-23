const express = require("express");
const router = express.Router();
const controller = require("../controllers/quoteController");

router.post("/", controller.createQuote);
router.get("/:id", controller.getQuotes);

module.exports = router;
