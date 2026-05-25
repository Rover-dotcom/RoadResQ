/**
 * Notification Engine — RoadResQ v9.0.0 (Week 7)
 *
 * Firebase Cloud Messaging push notifications + in-app notifications.
 *
 * Supports: push via FCM, in-app via Firestore notifications collection.
 */

const { db, admin } = require('../config/firebase');
const { logger } = require('./logger');

// ─── Notification Types ──────────────────────────────────────────────────────

const TYPES = {
  JOB_ASSIGNED:      'JOB_ASSIGNED',
  DRIVER_ARRIVING:   'DRIVER_ARRIVING',
  DRIVER_ARRIVED:    'DRIVER_ARRIVED',
  JOB_COMPLETED:     'JOB_COMPLETED',
  PAYMENT_RECEIVED:  'PAYMENT_RECEIVED',
  PAYOUT_APPROVED:   'PAYOUT_APPROVED',
  PAYOUT_REJECTED:   'PAYOUT_REJECTED',
  DISPUTE_RESOLVED:  'DISPUTE_RESOLVED',
  DISPUTE_FILED:     'DISPUTE_FILED',
  QUOTE_RECEIVED:    'QUOTE_RECEIVED',
  PANIC_ALERT:       'PANIC_ALERT',
  SYSTEM_ALERT:      'SYSTEM_ALERT',
  SAFETY_ALERT:      'SAFETY_ALERT',
  CANCELLATION:      'CANCELLATION',
};

// ─── FCM Token Management ────────────────────────────────────────────────────

async function registerFCMToken(userId, token, platform = 'android') {
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  const existing = snap.exists ? (snap.data().fcmTokens || []) : [];

  // Remove duplicate, keep max 5 tokens
  const filtered = existing.filter(t => t.token !== token);
  filtered.push({ token, platform, registeredAt: new Date().toISOString() });
  const trimmed = filtered.slice(-5); // Keep newest 5

  await userRef.set({ fcmTokens: trimmed, updatedAt: new Date().toISOString() }, { merge: true });
  logger.notification('TOKEN_REGISTERED', { userId, platform, tokenCount: trimmed.length });
  return { registered: true, tokenCount: trimmed.length };
}

// ─── Send Push Notification ──────────────────────────────────────────────────

async function sendPushNotification(userId, { title, body, type, data = {} }) {
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return { sent: false, reason: 'User not found' };

    const tokens = (userSnap.data().fcmTokens || []).map(t => t.token);
    if (!tokens.length) return { sent: false, reason: 'No FCM tokens' };

    // Also save to in-app notifications
    await saveNotification(userId, { title, body, type, data });

    // Send via FCM
    const message = {
      tokens,
      notification: { title, body },
      data: { type, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) },
      android: { priority: 'high', notification: { channelId: 'roadresq_default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']
          .includes(resp.error?.code)) {
          invalidTokens.push(tokens[idx]);
        }
      });
      if (invalidTokens.length) {
        const cleaned = (userSnap.data().fcmTokens || []).filter(t => !invalidTokens.includes(t.token));
        await db.collection('users').doc(userId).update({ fcmTokens: cleaned });
      }
    }

    logger.notification('PUSH_SENT', { userId, type, successCount: response.successCount });
    return { sent: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    logger.error('[Notification] Push send failed', { userId, error: err.message });
    // Still save in-app even if push fails
    await saveNotification(userId, { title, body, type, data }).catch(() => {});
    return { sent: false, reason: err.message };
  }
}

async function sendToMultiple(userIds, notification) {
  const results = await Promise.allSettled(
    userIds.map(uid => sendPushNotification(uid, notification))
  );
  return {
    total: userIds.length,
    sent: results.filter(r => r.status === 'fulfilled' && r.value.sent).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value?.sent).length,
  };
}

// ─── In-App Notifications ────────────────────────────────────────────────────

async function saveNotification(userId, { title, body, type, data = {}, relatedId = null }) {
  const doc = {
    userId,
    title,
    body,
    type: type || TYPES.SYSTEM_ALERT,
    data,
    relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const ref = await db.collection('notifications').add(doc);
  return { id: ref.id, ...doc };
}

async function getUserNotifications(userId, limit = 50) {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function markAsRead(notificationId) {
  await db.collection('notifications').doc(notificationId).update({
    read: true,
    readAt: new Date().toISOString(),
  });
}

async function markAllRead(userId) {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  if (snap.empty) return { updated: 0 };

  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true, readAt: new Date().toISOString() });
  });
  await batch.commit();
  return { updated: snap.size };
}

async function getUnreadCount(userId) {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();
  return snap.size;
}

// ─── Convenience Helpers ─────────────────────────────────────────────────────

async function notifyJobAssigned(jobId, driverId, jobData = {}) {
  return sendPushNotification(driverId, {
    title: 'New Job Assigned',
    body: `You have been assigned a ${jobData.serviceType || 'tow'} job.`,
    type: TYPES.JOB_ASSIGNED,
    data: { jobId, serviceType: jobData.serviceType || 'tow' },
  });
}

async function notifyDriverArriving(jobId, customerId, eta) {
  return sendPushNotification(customerId, {
    title: 'Driver On The Way',
    body: `Your driver is arriving in ${eta} minutes.`,
    type: TYPES.DRIVER_ARRIVING,
    data: { jobId, eta: String(eta) },
  });
}

async function notifyDriverArrived(jobId, customerId) {
  return sendPushNotification(customerId, {
    title: 'Driver Has Arrived',
    body: 'Your driver has arrived at the pickup location.',
    type: TYPES.DRIVER_ARRIVED,
    data: { jobId },
  });
}

async function notifyJobCompleted(jobId, customerId, amount) {
  return sendPushNotification(customerId, {
    title: 'Job Completed',
    body: `Your job is complete. Total: QR ${(amount / 100).toFixed(2)}`,
    type: TYPES.JOB_COMPLETED,
    data: { jobId, amount: String(amount) },
  });
}

async function notifyPaymentReceived(userId, amount) {
  return sendPushNotification(userId, {
    title: 'Payment Received',
    body: `QR ${(amount / 100).toFixed(2)} has been added to your wallet.`,
    type: TYPES.PAYMENT_RECEIVED,
    data: { amount: String(amount) },
  });
}

async function notifyPayoutApproved(driverId, amount) {
  return sendPushNotification(driverId, {
    title: 'Payout Approved',
    body: `Your withdrawal of QR ${(amount / 100).toFixed(2)} has been approved.`,
    type: TYPES.PAYOUT_APPROVED,
    data: { amount: String(amount) },
  });
}

async function notifyDisputeResolved(userId, disputeId, outcome) {
  return sendPushNotification(userId, {
    title: 'Dispute Resolved',
    body: `Your dispute has been resolved. Outcome: ${outcome.replace(/_/g, ' ')}`,
    type: TYPES.DISPUTE_RESOLVED,
    data: { disputeId, outcome },
  });
}

async function notifyPanicAlert(adminIds, incidentData) {
  return sendToMultiple(adminIds, {
    title: 'PANIC ALERT',
    body: `Emergency reported for job ${incidentData.jobId}`,
    type: TYPES.PANIC_ALERT,
    data: incidentData,
  });
}

async function notifyQuoteReceived(customerId, quoteId) {
  return sendPushNotification(customerId, {
    title: 'Quote Received',
    body: 'A garage has responded to your quote request.',
    type: TYPES.QUOTE_RECEIVED,
    data: { quoteId },
  });
}

module.exports = {
  TYPES,
  registerFCMToken,
  sendPushNotification,
  sendToMultiple,
  saveNotification,
  getUserNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount,
  notifyJobAssigned,
  notifyDriverArriving,
  notifyDriverArrived,
  notifyJobCompleted,
  notifyPaymentReceived,
  notifyPayoutApproved,
  notifyDisputeResolved,
  notifyPanicAlert,
  notifyQuoteReceived,
};
