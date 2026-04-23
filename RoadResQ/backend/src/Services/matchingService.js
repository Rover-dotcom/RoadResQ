const Driver = require("../models/Driver");
const getDistance = require("../utils/distance");

async function matchDrivers(job) {
  let drivers = await Driver.find({ isOnline: true });

  // Radius filter
  drivers = drivers.filter(d => {
    const dist = getDistance(
      job.pickup.lat,
      job.pickup.lng,
      d.location.lat,
      d.location.lng
    );
    return dist <= 10;
  });

  // Capacity filter
  if (job.weight) {
    drivers = drivers.filter(d => d.maxCapacity >= job.weight);
  }

  // Height filter
  if (job.isRestrictedArea) {
    drivers = drivers.filter(d => d.vehicleHeight <= job.clearanceHeight);
  }

  // Sort
  drivers.sort((a, b) =>
    (b.experience + b.rating) - (a.experience + a.rating)
  );

  return drivers;
}

module.exports = { matchDrivers };
