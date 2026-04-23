const GarageRequest = require("../models/GarageRequest");
const Job = require("../models/Job");

exports.createGarageRequest = async (req, res) => {
  const request = await GarageRequest.create(req.body);

  if (request.type === "urgent") {
    const job = await Job.create({
      serviceType: "tow",
      pickup: req.body.pickup
    });

    request.jobId = job._id;
    request.status = "dispatched";
    await request.save();
  }

  res.json(request);
};
