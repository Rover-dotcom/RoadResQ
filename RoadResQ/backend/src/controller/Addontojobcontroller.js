const { finalizeAndCleanupJob } = require("../services/jobService");

exports.completeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await finalizeAndCleanupJob(jobId);
    
    res.status(200).json({ 
      status: "success", 
      message: "Job archived and images cleared.",
      data: result 
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
