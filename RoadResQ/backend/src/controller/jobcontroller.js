const { matchDrivers } = require("../services/matchingService");
const Job = require("../models/Job"); // Assuming you have your model imported

exports.createJob = async (req, res) => {
  try {
    const { serviceType, userId, garageId, details } = req.body;

    // 1. Basic Validation (In a real app, use Joi or Zod middleware)
    if (!serviceType || !userId) {
      return res.status(400).json({ status: "fail", message: "Missing required fields." });
    }

    // 2. Create the job record
    const job = await Job.create(req.body);

    let resultPayload = { status: "success", job };

    // 3. Logic Branching (Path A vs Path B)
    if (serviceType === "urgent") {
      // Path B: Immediate Dispatch
      const matchedDrivers = await matchDrivers(job);
      
      // Update job status to 'dispatched' automatically for urgent jobs
      job.status = 'dispatched';
      await job.save();

      resultPayload.drivers = matchedDrivers;
      resultPayload.message = "Urgent request: Dispatching initiated.";
      
    } else if (serviceType === "quote") {
      // Path A: Quote Request
      // We do NOT match drivers yet. We wait for garage to send estimate.
      resultPayload.message = "Quote request received. Awaiting garage estimate.";
    }

    // 4. Send unified response
    res.status(201).json(resultPayload);

  } catch (error) {
    console.error("Job Creation Error:", error);
    res.status(500).json({ status: "error", message: "Failed to create job", details: error.message });
  }
};
