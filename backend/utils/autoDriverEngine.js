/**
 * Auto Driver Status Engine — RoadResQ v9.0.0 (Week 7)
 *
 * Auto-sets driver to offline if no GPS update in 5 minutes.
 * Also handles: driver performance metrics, earnings history.
 *
 * Usage:
 *   const { checkInactiveDrivers, getDriverEarnings, getDriverPerformance } = require('./autoDriverEngine');
 *   // Call checkInactiveDrivers() via cron or scheduled function
 */

const { db } = require('../config/firebase');
const { logger } = require('./logger');

const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ─── Auto Offline ────────────────────────────────────────────────────────────

async function checkInactiveDrivers() {
  const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_MS).toISOString();

  // Find online drivers whose last location update is older than 5 minutes
  const snap = await db.collection('drivers')
    .where('isOnline', '==', true)
    .get();

  let offlinedCount = 0;
  const batch = db.batch();

  for (const doc of snap.docs) {
    const driver = doc.data();
    const lastUpdate = driver.lastLocationUpdate || driver.updatedAt || driver.createdAt;

    if (lastUpdate && lastUpdate < cutoff) {
      batch.update(doc.ref, {
        isOnline: false,
        autoOfflineReason: 'inactivity',
        autoOfflineAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      offlinedCount++;
    }
  }

  if (offlinedCount > 0) {
    await batch.commit();
    logger.driver('AUTO_OFFLINE', { offlinedCount, threshold: '5 minutes' });
  }

  return { checked: snap.size, offlined: offlinedCount, threshold: '5 minutes' };
}

// ─── Driver Earnings History ─────────────────────────────────────────────────

async function getDriverEarnings(driverId, period = 'all') {
  let query = db.collection('wallet_transactions')
    .where('walletId', '==', driverId)
    .where('type', 'in', ['CREDIT', 'BONUS'])
    .orderBy('createdAt', 'desc');

  // Apply time filter
  if (period === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.where('createdAt', '>=', today.toISOString());
  } else if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query = query.where('createdAt', '>=', weekAgo.toISOString());
  } else if (period === 'month') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    query = query.where('createdAt', '>=', monthAgo.toISOString());
  }

  const snap = await query.limit(200).get();
  const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const totalEarnings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    driverId,
    period,
    totalEarnings,
    totalDisplay: `QR ${(totalEarnings / 100).toFixed(2)}`,
    transactionCount: transactions.length,
    transactions,
  };
}

// ─── Driver Performance Metrics ──────────────────────────────────────────────

async function getDriverPerformance(driverId) {
  // Total jobs
  const allJobs = await db.collection('jobs')
    .where('driverId', '==', driverId)
    .get();

  const completed = allJobs.docs.filter(d => d.data().status === 'completed');
  const cancelled = allJobs.docs.filter(d => d.data().status === 'cancelled');
  const totalJobs = allJobs.size;

  // Acceptance rate (accepted / total offered)
  const acceptanceRate = totalJobs > 0
    ? ((completed.length / totalJobs) * 100).toFixed(1)
    : '0.0';

  // Cancellation rate
  const cancellationRate = totalJobs > 0
    ? ((cancelled.length / totalJobs) * 100).toFixed(1)
    : '0.0';

  // Average rating
  const ratingsSum = completed.reduce((sum, d) => sum + (d.data().driverRating || 0), 0);
  const ratedJobs = completed.filter(d => d.data().driverRating > 0);
  const avgRating = ratedJobs.length > 0
    ? (ratingsSum / ratedJobs.length).toFixed(1)
    : 'N/A';

  // Average response time (from job created to driver accepted)
  const responseTimes = completed
    .map(d => {
      const data = d.data();
      if (data.acceptedAt && data.createdAt) {
        return new Date(data.acceptedAt).getTime() - new Date(data.createdAt).getTime();
      }
      return null;
    })
    .filter(Boolean);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000)
    : null;

  // Today's earnings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTransactions = await db.collection('wallet_transactions')
    .where('walletId', '==', driverId)
    .where('type', 'in', ['CREDIT', 'BONUS'])
    .where('createdAt', '>=', today.toISOString())
    .get();
  const todayEarnings = todayTransactions.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

  return {
    driverId,
    totalJobs,
    completedJobs: completed.length,
    cancelledJobs: cancelled.length,
    acceptanceRate: `${acceptanceRate}%`,
    cancellationRate: `${cancellationRate}%`,
    averageRating: avgRating,
    ratedJobsCount: ratedJobs.length,
    averageResponseTime: avgResponseTime ? `${avgResponseTime}s` : 'N/A',
    todayEarnings: todayEarnings,
    todayEarningsDisplay: `QR ${(todayEarnings / 100).toFixed(2)}`,
  };
}

// ─── Booking History (Customer) ──────────────────────────────────────────────

async function getBookingHistory(userId, limit = 50) {
  const snap = await db.collection('jobs')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      serviceType: data.serviceType,
      status: data.status,
      pickup: data.pickup,
      drop: data.drop,
      totalFare: data.totalFare,
      fareDisplay: data.totalFare ? `QR ${(data.totalFare / 100).toFixed(2)}` : null,
      driverName: data.driverName || null,
      driverRating: data.driverRating || null,
      createdAt: data.createdAt,
      completedAt: data.completedAt || null,
    };
  });
}

// ─── Garage Repair History ───────────────────────────────────────────────────

async function getGarageRepairHistory(garageId, limit = 50) {
  const snap = await db.collection('garage_requests')
    .where('garageId', '==', garageId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      status: data.status,
      issueDescription: data.issueDescription,
      estimatedCost: data.estimatedCost,
      customerName: data.customerName || null,
      vehicleType: data.vehicleType || null,
      createdAt: data.createdAt,
      completedAt: data.completedAt || null,
    };
  });
}

module.exports = {
  checkInactiveDrivers,
  getDriverEarnings,
  getDriverPerformance,
  getBookingHistory,
  getGarageRepairHistory,
  INACTIVITY_THRESHOLD_MS,
};
