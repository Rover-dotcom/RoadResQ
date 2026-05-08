const { bucket } = require("../config/firebase");

/**
 * Uploads a Buffer (Image or PDF) directly to Firebase Storage
 * @param {string} destination - The path in the bucket (e.g., 'jobs/123.jpg')
 * @param {Buffer} buffer - The file data from Sharp or Puppeteer
 * @param {string} contentType - 'image/jpeg' or 'application/pdf'
 */
const uploadToStorage = async (destination, buffer, contentType) => {
  try {
    const file = bucket.file(destination);

    await file.save(buffer, {
      metadata: { contentType: contentType },
      public: true, // Optional: makes the file publicly readable
    });

    // Construct the standard Firebase Public URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
  } catch (error) {
    console.error("Firebase Upload Error:", error);
    throw new Error("Failed to upload file to cloud storage.");
  }
};

/**
 * Deletes a file from Firebase Storage given its Public URL
 */
const deleteFromStorage = async (fileUrl) => {
  if (!fileUrl) return false;

  try {
    // 1. Extract path: https://.../o/[PATH]?alt=media -> [PATH]
    const parts = fileUrl.split("/o/");
    if (parts.length < 2) return false;

    const filePathWithParams = parts[1];
    const filePath = decodeURIComponent(filePathWithParams.split("?")[0]);

    // 2. Delete from bucket
    await bucket.file(filePath).delete();
    
    console.log(`Successfully purged: ${filePath}`);
    return true;
  } catch (error) {
    // Log error but don't crash (file might already be gone)
    console.error(`Cloud deletion failed for: ${fileUrl}`, error.message);
    return false;
  }
};

/**
 * Specifically handles PDF uploads for the Archive service
 */
const uploadPDFToStorage = async (jobId, pdfBuffer) => {
  const fileName = `reports/REPORT-${jobId}-${Date.now()}.pdf`;
  return await uploadToStorage(fileName, pdfBuffer, 'application/pdf');
};

module.exports = { 
  uploadToStorage, 
  deleteFromStorage, 
  uploadPDFToStorage 
};