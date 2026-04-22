const { matchDrivers } = require("../services/matchingService");

exports.createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);

    // MATCH DRIVERS
    const matchedDrivers = await matchDrivers(job);

    // OPTIONAL: send to drivers (for now return)
    res.json({
      status: "success",
      job,
      drivers: matchedDrivers
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
