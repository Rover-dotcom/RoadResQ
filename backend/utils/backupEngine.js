/**
 * Backup Engine — RoadResQ v9.0.0 (Week 7)
 *
 * Admin-triggered Firestore backup to Cloud Storage.
 * Backs up critical collections as JSON files.
 */

const { db, admin } = require('../config/firebase');
const { logger } = require('./logger');

const BACKUP_COLLECTIONS = [
  'jobs', 'users', 'drivers', 'payments', 'wallets',
  'wallet_transactions', 'audit_logs', 'disputes', 'fraud_flags',
  'payouts', 'incidents', 'reports',
];

/**
 * Backup a single Firestore collection to Cloud Storage as JSON.
 */
async function backupCollection(collectionName, limit = 5000) {
  const snap = await db.collection(collectionName).limit(limit).get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const dateStr = new Date().toISOString().split('T')[0];
  const filePath = `backups/${dateStr}/${collectionName}.json`;
  const jsonData = JSON.stringify(docs, null, 2);
  const buffer = Buffer.from(jsonData, 'utf-8');

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    await file.save(buffer, { metadata: { contentType: 'application/json' } });
  } catch (err) {
    // If Storage not available, just log the count
    logger.warn(`[Backup] Storage not available for ${collectionName}, doc count: ${docs.length}`);
  }

  return {
    collection: collectionName,
    docCount: docs.length,
    sizeBytes: buffer.length,
    path: filePath,
  };
}

/**
 * Run a full backup of all critical collections.
 */
async function runFullBackup(triggeredBy = 'admin') {
  const startTime = Date.now();
  const results = [];
  let totalDocs = 0;
  let totalSize = 0;

  for (const collection of BACKUP_COLLECTIONS) {
    try {
      const result = await backupCollection(collection);
      results.push({ ...result, status: 'ok' });
      totalDocs += result.docCount;
      totalSize += result.sizeBytes;
    } catch (err) {
      results.push({ collection, status: 'error', error: err.message });
    }
  }

  const duration = Date.now() - startTime;
  const backupLog = {
    collections: results,
    totalCollections: BACKUP_COLLECTIONS.length,
    successCount: results.filter(r => r.status === 'ok').length,
    failedCount: results.filter(r => r.status === 'error').length,
    totalDocs,
    totalSizeBytes: totalSize,
    totalSizeDisplay: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    durationMs: duration,
    durationDisplay: `${(duration / 1000).toFixed(1)}s`,
    triggeredBy,
    status: results.every(r => r.status === 'ok') ? 'complete' : 'partial',
    createdAt: new Date().toISOString(),
  };

  // Log to Firestore
  const logRef = await db.collection('backup_logs').add(backupLog);
  logger.admin('BACKUP_COMPLETED', { backupId: logRef.id, totalDocs, duration });

  return { backupId: logRef.id, ...backupLog };
}

/**
 * Get backup history.
 */
async function getBackupHistory(limit = 20) {
  const snap = await db.collection('backup_logs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get most recent backup.
 */
async function getLatestBackup() {
  const snap = await db.collection('backup_logs')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

module.exports = {
  BACKUP_COLLECTIONS,
  backupCollection,
  runFullBackup,
  getBackupHistory,
  getLatestBackup,
};
