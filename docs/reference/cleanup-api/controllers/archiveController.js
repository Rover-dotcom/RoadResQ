const mongoose = require('mongoose');
const { finalizeAndCleanupJob } = require('../services/jobService');

exports.archiveJob = async (req, res) => {
  const { id } = req.params;

  // 1. Validate the Job ID[cite: 1]
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Job ID format." });
  }

  try {
    // 2. Call the service to generate PDF, update DB, and purge storage[cite: 1]
    const report = await finalizeAndCleanupJob(id);

    // 3. Return the permanent link to the generated report[cite: 1]
    return res.status(200).json({ 
      message: "Job archived. PDF report generated successfully.",
      reportUrl: report.reportUrl, 
      jobId: id 
    });

  } catch (error) {
    console.error("Archive Controller Error:", error);
    
    // Provide specific error message from the service layer[cite: 1]
    res.status(500).json({ error: error.message || "Archive process failed." });
  }
};