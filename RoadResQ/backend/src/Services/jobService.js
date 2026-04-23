const Job = require("../models/Job");
const Report = require("../models/Report");
const { deleteFromCloud } = require("../utils/storageService");

async function finalizeAndCleanupJob(jobId) {
  // 1. Fetch Job
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");
  
  if (job.status === 'archived') throw new Error("Job is already finalized");

  // 2. Generate Report (Placeholder for your report logic)
  // Ensure this function creates a permanent record of the details
  const reportData = await generatePDFReport(job); 

  // 3. Save Report
  const savedReport = await Report.create({
    jobId: job._id,
    data: reportData,
    createdAt: new Date()
  });

  // 4. Verify & Cleanup
  if (savedReport) {
    // Delete images
    if (job.photos && job.photos.length > 0) {
      for (const photoUrl of job.photos) {
        await deleteFromCloud(photoUrl);
      }
    }

    // 5. Update Job status
    job.status = 'archived';
    job.photos = []; // Clear the image array
    await job.save();
    
    return { success: true, reportId: savedReport._id };
  }
}

async function generatePDFReport(job) {
  // Add your PDF generation logic here (e.g., using pdfkit or html-to-pdf)
  return { summary: "Job completed successfully", timestamp: new Date() };
}

module.exports = { finalizeAndCleanupJob };
