const mongoose = require("mongoose");
const Job = require("../models/Job");
const Report = require("../models/Report");
const puppeteer = require('puppeteer');
// Ensure these utility paths are correct for your project structure
const { deleteFromStorage, uploadPDFToStorage } = require("../utils/storageService");

/**
 * Generates the Luxury Construction HTML Template
 */
const generateReportHTML = (job) => {
  const date = new Date().toLocaleDateString('en-AE', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  const photoHtml = job.photos.length > 0 
    ? job.photos.map(url => `
        <div class="photo-container">
          <img src="${url}" alt="Site Evidence" />
          <div class="photo-caption">Site Photographic Evidence</div>
        </div>`).join('')
    : '<p style="text-align:center; color:#888;">No photos attached to this job.</p>';

  return `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
        .header { background: #000; color: #fff; padding: 40px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 40px; }
        .job-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: bold; }
        .value { font-size: 14px; font-weight: 600; margin-top: 4px; display: block; }
        .section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #000; padding-left: 10px; margin: 30px 0 20px 0; text-transform: uppercase; }
        .photo-grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .photo-container { width: 48%; border: 1px solid #eee; background: #f9f9f9; margin-bottom: 10px; }
        .photo-container img { width: 100%; height: 200px; object-fit: cover; }
        .photo-caption { padding: 8px; font-size: 10px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div><h1>BLACKBURN PROJECTS</h1><div style="font-size: 10px; color: #ccc;">LOGISTICS REPORT</div></div>
        <div style="text-align: right; font-size: 12px;">DOHA, QATAR<br/>${date}</div>
      </div>
      <div class="content">
        <div class="job-details">
          <div><span class="label">Client</span><span class="value">${job.clientName}</span></div>
          <div><span class="label">Job ID</span><span class="value">#${job._id.toString().slice(-6).toUpperCase()}</span></div>
        </div>
        <div class="section-title">Photographic Evidence</div>
        <div class="photo-grid">${photoHtml}</div>
      </div>
    </body>
    </html>
  `;
};

async function finalizeAndCleanupJob(jobId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find Job
    const job = await Job.findById(jobId).session(session);
    if (!job || job.status === 'archived') {
      throw new Error("Job not found or already archived");
    }

    // 2. Generate PDF Buffer (BEFORE deleting original photos)
    const htmlContent = generateReportHTML(job);
    const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  // If it still fails on Mac, you might need to specify the executablePath
});
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 3. Upload PDF to Storage
    const reportUrl = await uploadPDFToStorage(job._id, pdfBuffer);

    // 4. Create Report & Update Job in DB
    const [savedReport] = await Report.create([{
      jobId: job._id,
      clientName: job.clientName,
      reportUrl: reportUrl,
      timestamp: new Date()
    }], { session });

    const photoBackup = [...job.photos];
    job.status = 'archived';
    job.photos = []; 
    await job.save({ session });

    // 5. Atomic Commit
    await session.commitTransaction();
    session.endSession();

    // 6. Cloud Cleanup (Async - only happens if DB commit succeeded)
    if (photoBackup.length > 0) {
      Promise.all(photoBackup.map(url => deleteFromStorage(url)))
        .catch(err => console.error("Cloud Cleanup Error:", err));
    }

    return savedReport;
  } catch (error) {
    if (session.inAtomicityProxy || session.transaction.state !== 'TRANSACTION_ABORTED') {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
}

module.exports = { finalizeAndCleanupJob };