const { matchDrivers } = require("./matchingService");

async function dispatchJob(job) {
  const drivers = await matchDrivers(job);

  // For now return matched drivers
  return drivers;
}

module.exports = { dispatchJob };
