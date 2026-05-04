/**
 * Cleanup Engine — RoadResQ (Week 5)
 *
 * Safe file cleanup with retry, soft-delete, and storage monitoring.
 *
 * Features:
 * - safeDelete: 3x retry with failure logging
 * - softDeleteFiles: marks files for deletion with 24h grace period
 * - executePendingDeletions: processes soft-deleted files past grace period
 * - checkStorageUsage: estimates usage and alerts admin
 *
 * Firestore collections: `pending_deletions`, `deletion_failures`
 */

const { db, admin } = require('../config/firebase');
const { logEvent, EVENT_TYPES } = require('./auditEngine');

const PENDING_COLLECTION = 'pending_deletions';
const FAILURE_COLLECTION = 'deletion_failures';
const GRACE_PERIOD_HOURS = 24;

// ─── Safe Delete (with 3x Retry) ─────────────────────────────────────────────

/**
 * Attempts to delete a file from Firebase Storage up to 3 times.
 * Logs failures to Firestore for admin review.
 *
 * @param {string} url — the file URL or path in Firebase Storage
 * @param {number} [maxRetries=3]
 * @returns {Promise<boolean>} true if deleted, false if all retries failed
 */
async function safeDelete(url, maxRetries = 3) {
  if (!url) return true;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Extract bucket path from URL
      const filePath = extractStoragePath(url);
      if (!filePath) {
        console.warn(`[Cleanup] Cannot extract storage path from: ${url}`);
        return false;
      }

      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) {
        console.log(`[Cleanup] File already deleted: ${filePath}`);
        return true;
      }

      await file.delete();
      console.log(`[Cleanup] Deleted: ${filePath} (attempt ${attempt})`);
      return true;
    } catch (err) {
      console.error(`[Cleanup] Delete attempt ${attempt}/${maxRetries} failed for ${url}:`, err.message);
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries failed — log failure
  await logFailedDeletion(url, 'Max retries exceeded');
  return false;
}

/**
 * Extracts the storage path from a Firebase Storage URL.
 */
function extractStoragePath(url) {
  if (!url) return null;

  // Handle gs:// URLs
  if (url.startsWith('gs://')) {
    const parts = url.replace('gs://', '').split('/');
    parts.shift(); // remove bucket name
    return parts.join('/');
  }

  // Handle https://firebasestorage.googleapis.com URLs
  const match = url.match(/\/o\/(.+?)(\?|$)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  // Handle https://storage.googleapis.com URLs
  const match2 = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(\?|$)/);
  if (match2) {
    return decodeURIComponent(match2[1]);
  }

  // Assume it's already a path
  return url;
}

// ─── Log Failed Deletion ──────────────────────────────────────────────────────

async function logFailedDeletion(url, errorMessage) {
  await db.collection(FAILURE_COLLECTION).add({
    url,
    error: errorMessage,
    status: 'failed',
    createdAt: new Date().toISOString(),
    resolved: false,
  });

  await logEvent(EVENT_TYPES.FILE_DELETE_FAILED, {
    entityId: url,
    entityType: 'file',
    details: { error: errorMessage },
  });
}

// ─── Soft Delete Files ────────────────────────────────────────────────────────

/**
 * Marks files for deletion with a grace period.
 * Files are not immediately deleted — they are scheduled for deletion
 * after GRACE_PERIOD_HOURS (24h by default).
 *
 * @param {string} jobId
 * @param {string[]} fileUrls — array of file URLs to soft-delete
 * @returns {Promise<{marked: number}>}
 */
async function softDeleteFiles(jobId, fileUrls) {
  if (!fileUrls || fileUrls.length === 0) return { marked: 0 };

  const deleteAfter = new Date(Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString();
  const batch = db.batch();
  let count = 0;

  for (const url of fileUrls) {
    if (!url) continue;
    const ref = db.collection(PENDING_COLLECTION).doc();
    batch.set(ref, {
      jobId,
      url,
      deleteAfter,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    count++;
  }

  if (count > 0) {
    await batch.commit();
    await logEvent(EVENT_TYPES.FILES_SOFT_DELETED, {
      entityId: jobId,
      entityType: 'job',
      details: { fileCount: count, deleteAfter },
    });
  }

  return { marked: count };
}

// ─── Execute Pending Deletions ────────────────────────────────────────────────

/**
 * Processes all soft-deleted files that have passed their grace period.
 * Called periodically (e.g., scheduled function, admin trigger, or on-demand).
 *
 * @returns {Promise<{processed: number, deleted: number, failed: number}>}
 */
async function executePendingDeletions() {
  const now = new Date().toISOString();
  const snap = await db.collection(PENDING_COLLECTION)
    .where('status', '==', 'pending')
    .where('deleteAfter', '<=', now)
    .limit(100)
    .get();

  let deleted = 0;
  let failed = 0;
  const batch = db.batch();

  for (const doc of snap.docs) {
    const { url } = doc.data();
    const success = await safeDelete(url);

    if (success) {
      batch.update(doc.ref, { status: 'deleted', deletedAt: new Date().toISOString() });
      deleted++;
    } else {
      batch.update(doc.ref, { status: 'failed', lastAttemptAt: new Date().toISOString() });
      failed++;
    }
  }

  if (snap.docs.length > 0) {
    await batch.commit();
    await logEvent(EVENT_TYPES.FILES_DELETED, {
      entityId: 'system',
      entityType: 'cleanup',
      details: { processed: snap.docs.length, deleted, failed },
    });
  }

  return { processed: snap.docs.length, deleted, failed };
}

// ─── Collect Job File URLs ────────────────────────────────────────────────────

/**
 * Collects all temporary file URLs from a job document.
 * These are the files that should be soft-deleted after report generation.
 */
function collectJobFileUrls(job) {
  const urls = [];
  if (job.completionPhotoUrl) urls.push(job.completionPhotoUrl);
  if (job.arrivalPhotoUrl) urls.push(job.arrivalPhotoUrl);
  if (job.customPhotoUrls) urls.push(...job.customPhotoUrls.filter(Boolean));
  if (job.logisticsPhotoUrls) urls.push(...job.logisticsPhotoUrls.filter(Boolean));
  return urls;
}

// ─── Storage Usage Check ──────────────────────────────────────────────────────

/**
 * Estimates storage usage by counting pending files and failed deletions.
 * Creates admin alert if thresholds are exceeded.
 */
async function checkStorageUsage() {
  const [pendingSnap, failedSnap] = await Promise.all([
    db.collection(PENDING_COLLECTION).where('status', '==', 'pending').get(),
    db.collection(FAILURE_COLLECTION).where('resolved', '==', false).get(),
  ]);

  const stats = {
    pendingDeletions: pendingSnap.size,
    failedDeletions: failedSnap.size,
    checkedAt: new Date().toISOString(),
  };

  // Alert if too many failures
  if (failedSnap.size > 50) {
    await db.collection('admin_alerts').add({
      type: 'STORAGE_ALERT',
      message: `${failedSnap.size} file deletions have failed. Manual review required.`,
      severity: 'warning',
      isRead: false,
      details: stats,
      createdAt: new Date().toISOString(),
    });

    await logEvent(EVENT_TYPES.STORAGE_ALERT, {
      entityId: 'system',
      entityType: 'storage',
      details: stats,
    });
  }

  return stats;
}

module.exports = {
  safeDelete, softDeleteFiles, executePendingDeletions,
  collectJobFileUrls, checkStorageUsage, logFailedDeletion,
};
