/**
 * Storage Engine — RoadResQ v9.0.0 (Week 7)
 *
 * Firebase Storage with signed URLs, file validation, and organized bucket paths.
 */

const { admin } = require('../config/firebase');
const { logger } = require('./logger');

// ─── Constants ───────────────────────────────────────────────────────────────

const PATHS = {
  DRIVER_DOCS:      'drivers',
  JOB_PHOTOS:       'jobs',
  DISPUTE_EVIDENCE: 'disputes',
  GATE_PASSES:      'gate_passes',
  VEHICLE_DOCS:     'vehicles',
  BACKUPS:          'backups',
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES   = ['application/pdf'];
const ALL_ALLOWED_TYPES   = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
const MAX_FILE_SIZE_MB    = 10;

// ─── Path Helpers ────────────────────────────────────────────────────────────

const getDriverDocPath = (driverId, docType) =>
  `${PATHS.DRIVER_DOCS}/${driverId}/docs/${docType}`;

const getJobPhotoPath = (jobId, photoType) =>
  `${PATHS.JOB_PHOTOS}/${jobId}/photos/${photoType}`;

const getDisputeEvidencePath = (disputeId, filename) =>
  `${PATHS.DISPUTE_EVIDENCE}/${disputeId}/evidence/${filename}`;

const getVehicleDocPath = (vehicleId, docType) =>
  `${PATHS.VEHICLE_DOCS}/${vehicleId}/docs/${docType}`;

const getGatePassPath = (jobId, filename) =>
  `${PATHS.GATE_PASSES}/${jobId}/${filename}`;

// ─── Validation ──────────────────────────────────────────────────────────────

function validateFileType(contentType, allowedTypes = ALL_ALLOWED_TYPES) {
  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Invalid file type: ${contentType}. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

function validateFileSize(sizeBytes, maxMB = MAX_FILE_SIZE_MB) {
  const maxBytes = maxMB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      error: `File too large: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB. Maximum: ${maxMB}MB`,
    };
  }
  return { valid: true };
}

// ─── Upload ──────────────────────────────────────────────────────────────────

async function uploadFile(filePath, fileBuffer, contentType, metadata = {}) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType,
        metadata: { ...metadata, uploadedAt: new Date().toISOString() },
      },
    });

    // Make publicly readable (or use signed URLs)
    await file.makePublic().catch(() => {}); // Ignore if bucket doesn't allow public

    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    logger.info('[Storage] File uploaded', { filePath, contentType, size: fileBuffer.length });
    return { url: downloadUrl, path: filePath, size: fileBuffer.length };
  } catch (err) {
    logger.error('[Storage] Upload failed', { filePath, error: err.message });
    throw err;
  }
}

// ─── Signed URLs ─────────────────────────────────────────────────────────────

async function getSignedUrl(filePath, expiresInMinutes = 15) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return { url, expiresIn: `${expiresInMinutes} minutes`, path: filePath };
  } catch (err) {
    logger.error('[Storage] Signed URL failed', { filePath, error: err.message });
    throw err;
  }
}

async function getSignedUploadUrl(filePath, contentType, expiresInMinutes = 15) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      contentType,
    });
    return { url, expiresIn: `${expiresInMinutes} minutes`, path: filePath, contentType };
  } catch (err) {
    logger.error('[Storage] Signed upload URL failed', { filePath, error: err.message });
    throw err;
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

async function deleteFile(filePath) {
  try {
    const bucket = admin.storage().bucket();
    await bucket.file(filePath).delete();
    logger.info('[Storage] File deleted', { filePath });
    return { deleted: true, path: filePath };
  } catch (err) {
    if (err.code === 404) return { deleted: false, reason: 'File not found' };
    logger.error('[Storage] Delete failed', { filePath, error: err.message });
    throw err;
  }
}

async function deleteByUrl(downloadUrl) {
  try {
    // Parse Firebase Storage URL to extract file path
    const url = new URL(downloadUrl);
    let filePath;

    if (url.hostname === 'storage.googleapis.com') {
      // Format: https://storage.googleapis.com/bucket/path/to/file
      const parts = url.pathname.split('/');
      filePath = parts.slice(2).join('/'); // Skip /bucket
    } else if (url.hostname === 'firebasestorage.googleapis.com') {
      // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/encoded-path?alt=media
      const pathParam = url.pathname.split('/o/')[1];
      filePath = decodeURIComponent(pathParam);
    } else {
      return { deleted: false, reason: 'Unknown URL format' };
    }

    return deleteFile(filePath);
  } catch (err) {
    logger.error('[Storage] Delete by URL failed', { downloadUrl, error: err.message });
    return { deleted: false, reason: err.message };
  }
}

module.exports = {
  PATHS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALL_ALLOWED_TYPES,
  getDriverDocPath,
  getJobPhotoPath,
  getDisputeEvidencePath,
  getVehicleDocPath,
  getGatePassPath,
  validateFileType,
  validateFileSize,
  uploadFile,
  getSignedUrl,
  getSignedUploadUrl,
  deleteFile,
  deleteByUrl,
};
