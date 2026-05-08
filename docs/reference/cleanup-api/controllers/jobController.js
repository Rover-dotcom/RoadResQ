const mongoose = require('mongoose');
const Job = require('../models/Job');
const { finalizeAndCleanupJob } = require('../services/jobService');

exports.archiveJob = async (req, res) => {
  // Change 'id' to 'jobId' to match your route
  const { jobId } = req.params; 
  
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Use jobId here
    const job = await Job.findOne({ _id: jobId, status: 'active' }).session(session);

    if (!job) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Job not found or already archived" });
    }

    // Pass jobId to your service
    const report = await finalizeAndCleanupJob(jobId, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ 
      success: true,
      reportUrl: report.reportUrl 
    });

  } catch (error) {
    if (session.inAtomicityProxy || (session.transaction && session.transaction.state !== 'TRANSACTION_COMMITTED')) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};