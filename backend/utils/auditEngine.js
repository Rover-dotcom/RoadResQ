/**
 * Audit Engine — RoadResQ (Week 5)
 *
 * Central audit logging system. Every significant action in the system
 * is logged here for compliance, debugging, and admin review.
 *
 * Firestore collection: `audit_logs`
 */

const { db } = require('../config/firebase');

// ─── Event Types ──────────────────────────────────────────────────────────────

const EVENT_TYPES = {
  JOB_CREATED:        'JOB_CREATED',
  JOB_COMPLETED:      'JOB_COMPLETED',
  JOB_CANCELLED:      'JOB_CANCELLED',
  JOB_ARCHIVED:       'JOB_ARCHIVED',
  JOB_FINALIZED:      'JOB_FINALIZED',
  PAYMENT_HELD:       'PAYMENT_HELD',
  PAYMENT_RELEASED:   'PAYMENT_RELEASED',
  PAYMENT_REFUNDED:   'PAYMENT_REFUNDED',
  PAYMENT_DISPUTED:   'PAYMENT_DISPUTED',
  REPORT_GENERATED:   'REPORT_GENERATED',
  FILES_DELETED:      'FILES_DELETED',
  FILES_SOFT_DELETED: 'FILES_SOFT_DELETED',
  FILE_DELETE_FAILED: 'FILE_DELETE_FAILED',
  DISPUTE_OPENED:     'DISPUTE_OPENED',
  DISPUTE_RESOLVED:   'DISPUTE_RESOLVED',
  DRIVER_SUSPENDED:   'DRIVER_SUSPENDED',
  DRIVER_BANNED:      'DRIVER_BANNED',
  DRIVER_WARNING:     'DRIVER_WARNING',
  ADMIN_ACTION:       'ADMIN_ACTION',
  STORAGE_ALERT:      'STORAGE_ALERT',
  SAFETY_CHECK:       'SAFETY_CHECK',
  PANIC_TRIGGERED:    'PANIC_TRIGGERED',
};

const COLLECTION = 'audit_logs';

// ─── Core Logger ──────────────────────────────────────────────────────────────

/**
 * Logs an audit event to Firestore.
 *
 * @param {string} eventType — one of EVENT_TYPES
 * @param {object} data
 * @param {string} data.entityId — the ID of the entity (job, user, driver, etc.)
 * @param {string} [data.entityType] — 'job' | 'user' | 'driver' | 'payment' | 'report'
 * @param {string} [data.actorId] — who performed the action (userId, driverId, 'system')
 * @param {string} [data.actorRole] — 'customer' | 'driver' | 'admin' | 'system'
 * @param {object} [data.details] — additional context
 * @returns {Promise<{id: string}>}
 */
async function logEvent(eventType, {
  entityId,
  entityType = 'job',
  actorId = 'system',
  actorRole = 'system',
  details = {},
} = {}) {
  const entry = {
    eventType,
    entityId: entityId || null,
    entityType,
    actorId,
    actorRole,
    details,
    timestamp: new Date().toISOString(),
  };

  const ref = await db.collection(COLLECTION).add(entry);
  return { id: ref.id, ...entry };
}

// ─── Query Logs ───────────────────────────────────────────────────────────────

/**
 * Get audit logs, optionally filtered.
 *
 * @param {object} [filters]
 * @param {string} [filters.eventType]
 * @param {string} [filters.entityId]
 * @param {string} [filters.entityType]
 * @param {string} [filters.actorId]
 * @param {number} [filters.limit] — default 50
 * @returns {Promise<Array>}
 */
async function getAuditLogs({
  eventType,
  entityId,
  entityType,
  actorId,
  limit = 50,
} = {}) {
  let query = db.collection(COLLECTION).orderBy('timestamp', 'desc');

  if (eventType)  query = query.where('eventType', '==', eventType);
  if (entityId)   query = query.where('entityId', '==', entityId);
  if (entityType) query = query.where('entityType', '==', entityType);
  if (actorId)    query = query.where('actorId', '==', actorId);

  query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get audit trail for a specific entity (e.g. all events for a job).
 */
async function getEntityAuditTrail(entityId, limit = 100) {
  const snap = await db.collection(COLLECTION)
    .where('entityId', '==', entityId)
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

module.exports = { logEvent, getAuditLogs, getEntityAuditTrail, EVENT_TYPES };
