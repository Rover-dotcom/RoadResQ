const express = require("express");
const app = express();

app.use(express.json());

app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/quotes", require("./routes/quoteRoutes"));
app.use("/api/garage", require("./routes/garageRoutes"));

module.exports = app;
