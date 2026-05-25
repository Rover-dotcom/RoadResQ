/**
 * Fraud Engine — RoadResQ
 *
 * Calculates a fraud score for every job and user/driver.
 * Score 0-2: Safe | 3-5: Suspicious | 6+: High Risk
 *
 * Also handles:
 * - Cancel rate tracking
 * - Price deviation detection
 * - Ghost completion detection
 * - Location fraud check
 * - Auto-flagging
 */

const { db } = require('../config/firebase');

// ─── Score Thresholds ─────────────────────────────────────────────────────────
const SCORE_SAFE        = 2;
const SCORE_SUSPICIOUS  = 5;
// >= 6 = HIGH_RISK

const CANCEL_RATE_THRESHOLD = 0.5;  // 50% cancellation rate = +2
const PRICE_DEVIATION_RATIO = 2.0;  // Price > 2x avg = +3
const MAX_LOCATION_DISTANCE = 5000; // 5km mismatch = +3 (metres)
const TOO_FAST_MINUTES      = 3;    // Job completed < 3 min = +2

// ─── Calculate Fraud Score ────────────────────────────────────────────────────

/**
 * Calculates fraud score for a job at creation/completion.
 * @param {Object} jobData - full job document
 * @param {Object} userStats - { cancelRate, totalJobs, avgPrice }
 * @param {Object} driverStats - { cancelRate, completionRate, warnings }
 * @returns {{ score, level, flags, shouldFlag }}
 */
function calculateFraudScore(jobData = {}, userStats = {}, driverStats = {}) {
  let score = 0;
  const flags = [];

  // 1. User cancel rate
  if ((userStats.cancelRate || 0) > CANCEL_RATE_THRESHOLD) {
    score += 2;
    flags.push('HIGH_USER_CANCEL_RATE');
  }

  // 2. Driver cancel rate
  if ((driverStats.cancelRate || 0) > CANCEL_RATE_THRESHOLD) {
    score += 2;
    flags.push('HIGH_DRIVER_CANCEL_RATE');
  }

  // 3. Price too high vs average
  if (jobData.price && userStats.avgPrice &&
      jobData.price > userStats.avgPrice * PRICE_DEVIATION_RATIO) {
    score += 3;
    flags.push('PRICE_MANIPULATION');
  }

  // 4. Location mismatch (driver GPS vs job pickup)
  if (jobData.distanceMismatch && jobData.distanceMismatch > MAX_LOCATION_DISTANCE) {
    score += 3;
    flags.push('LOCATION_MISMATCH');
  }

  // 5. Too fast completion (ghost completion)
  if (jobData.completionMinutes && jobData.completionMinutes < TOO_FAST_MINUTES) {
    score += 2;
    flags.push('GHOST_COMPLETION_SUSPECTED');
  }

  // 6. No photo proof on completion
  if (jobData.status === 'completed' && !jobData.completionPhotoUrl) {
    score += 1;
    flags.push('NO_PHOTO_PROOF');
  }

  // 7. Driver warnings
  if ((driverStats.warnings || 0) >= 2) {
    score += 1;
    flags.push('DRIVER_HIGH_WARNINGS');
  }

  // Determine level
  let level;
  if (score <= SCORE_SAFE)        level = 'safe';
  else if (score <= SCORE_SUSPICIOUS) level = 'suspicious';
  else                            level = 'high_risk';

  return {
    score,
    level,
    flags,
    shouldFlag: level !== 'safe',
  };
}

// ─── Get User Fraud Stats ─────────────────────────────────────────────────────

async function getUserFraudStats(userId) {
  const snap = await db.collection('jobs')
    .where('userId', '==', userId)
    .limit(100).get();

  const jobs = snap.docs.map(d => d.data());
  const total = jobs.length;
  const cancelled = jobs.filter(j => j.status === 'cancelled').length;
  const prices = jobs.filter(j => j.price).map(j => j.price);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  return {
    totalJobs: total,
    cancelRate: total ? cancelled / total : 0,
    avgPrice,
    cancelled,
  };
}

// ─── Get Driver Fraud Stats ───────────────────────────────────────────────────

async function getDriverFraudStats(driverId) {
  const snap = await db.collection('drivers').doc(driverId).get();
  if (!snap.exists) return { cancelRate: 0, warnings: 0, completionRate: 1 };
  const d = snap.data();
  const total = (d.totalJobsAssigned || 0);
  const completed = (d.totalJobsCompleted || 0);
  return {
    warnings: d.warnings || 0,
    cancelRate: total ? 1 - (completed / total) : 0,
    completionRate: total ? completed / total : 1,
  };
}

// ─── Flag Job ─────────────────────────────────────────────────────────────────

async function flagJob(jobId, fraudResult) {
  await db.collection('jobs').doc(jobId).update({
    fraudScore: fraudResult.score,
    fraudLevel: fraudResult.level,
    fraudFlags: fraudResult.flags,
    isFlagged:  fraudResult.shouldFlag,
    flaggedAt:  fraudResult.shouldFlag ? new Date().toISOString() : null,
    updatedAt:  new Date().toISOString(),
  });

  // Write to fraud_flags collection for admin dashboard
  if (fraudResult.shouldFlag) {
    await db.collection('fraud_flags').add({
      jobId,
      score:    fraudResult.score,
      level:    fraudResult.level,
      flags:    fraudResult.flags,
      status:   'open',
      createdAt: new Date().toISOString(),
    });
  }
}

// ─── Get Flagged Jobs (Admin) ─────────────────────────────────────────────────

async function getFlaggedJobs(limit = 50) {
  const snap = await db.collection('fraud_flags')
    .where('status', '==', 'open')
    .orderBy('createdAt', 'desc')
    .limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Get Flagged Users (Admin) ────────────────────────────────────────────────

async function getFlaggedUsers(limit = 50) {
  const snap = await db.collection('jobs')
    .where('fraudLevel', '==', 'high_risk')
    .orderBy('createdAt', 'desc')
    .limit(limit).get();

  // Group by user
  const userMap = {};
  snap.docs.forEach(d => {
    const job = d.data();
    if (!userMap[job.userId]) {
      userMap[job.userId] = { userId: job.userId, flaggedJobs: 0, maxScore: 0, flags: [] };
    }
    userMap[job.userId].flaggedJobs++;
    userMap[job.userId].maxScore = Math.max(userMap[job.userId].maxScore, job.fraudScore || 0);
    userMap[job.userId].flags = [...new Set([...userMap[job.userId].flags, ...(job.fraudFlags || [])])];
  });
  return Object.values(userMap).sort((a, b) => b.maxScore - a.maxScore);
}

// ─── Block User (fraud enforcement) ──────────────────────────────────────────

async function applyFraudPenalty(userId, driverId, level) {
  const updates = { fraudPenaltyLevel: level, updatedAt: new Date().toISOString() };

  if (level === 'warning') {
    updates.fraudWarnings = (await getFraudWarnings(userId)) + 1;
  } else if (level === 'temporary_block') {
    updates.isBlocked = true;
    updates.blockReason = 'fraud_detection';
    updates.blockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (level === 'permanent_ban') {
    updates.isBlocked = true;
    updates.isPermanentlyBanned = true;
    updates.blockReason = 'fraud_permanent';
  }

  if (userId) await db.collection('users').doc(userId).update(updates);
  if (driverId) await db.collection('drivers').doc(driverId).update(updates);
}

async function getFraudWarnings(userId) {
  const snap = await db.collection('users').doc(userId).get();
  return snap.exists ? (snap.data().fraudWarnings || 0) : 0;
}

// ─── Week 7: Velocity Check ──────────────────────────────────────────────────
// Detects rapid-fire booking attempts (3+ jobs in 1 hour = suspicious)

const VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const VELOCITY_THRESHOLD = 3;

async function checkVelocity(userId) {
  const oneHourAgo = new Date(Date.now() - VELOCITY_WINDOW_MS).toISOString();
  const snap = await db.collection('jobs')
    .where('userId', '==', userId)
    .where('createdAt', '>=', oneHourAgo)
    .get();

  if (snap.size >= VELOCITY_THRESHOLD) {
    return { suspicious: true, reason: 'RAPID_BOOKING', jobsInLastHour: snap.size };
  }
  return { suspicious: false, jobsInLastHour: snap.size };
}

// ─── Week 7: Suspicious Payout Detection ─────────────────────────────────────
// New driver (<7 days) requesting large payout (>QR 200)

const NEW_DRIVER_DAYS = 7;
const SUSPICIOUS_PAYOUT_FILS = 20000; // QR 200

async function checkSuspiciousPayout(driverId) {
  const snap = await db.collection('drivers').doc(driverId).get();
  if (!snap.exists) return { suspicious: false };
  const driver = snap.data();
  const createdAt = driver.createdAt ? new Date(driver.createdAt) : new Date();
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  return {
    suspicious: daysSinceCreation < NEW_DRIVER_DAYS,
    reason: daysSinceCreation < NEW_DRIVER_DAYS ? 'NEW_DRIVER_HIGH_PAYOUT' : null,
    daysSinceCreation: Math.floor(daysSinceCreation),
    threshold: `${NEW_DRIVER_DAYS} days`,
  };
}

// ─── Week 7: Excessive Cancellations ─────────────────────────────────────────
// 5+ cancellations in 24 hours = auto-block

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const CANCEL_BLOCK_THRESHOLD = 5;

async function checkExcessiveCancellations(userId) {
  const oneDayAgo = new Date(Date.now() - CANCEL_WINDOW_MS).toISOString();
  const snap = await db.collection('jobs')
    .where('userId', '==', userId)
    .where('status', '==', 'cancelled')
    .where('createdAt', '>=', oneDayAgo)
    .get();

  if (snap.size >= CANCEL_BLOCK_THRESHOLD) {
    // Auto-block user
    await db.collection('users').doc(userId).update({
      isBlocked: true,
      blockReason: 'excessive_cancellations',
      blockExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { blocked: true, reason: 'EXCESSIVE_CANCELLATIONS', cancellationsIn24h: snap.size };
  }
  return { blocked: false, cancellationsIn24h: snap.size };
}

// ─── Week 7: Duplicate Account Detection ─────────────────────────────────────

async function checkDuplicateAccounts(phone, email) {
  const flags = [];
  if (phone) {
    const phoneSnap = await db.collection('users').where('phone', '==', phone).get();
    if (phoneSnap.size > 1) {
      flags.push({ type: 'DUPLICATE_PHONE', phone, accountCount: phoneSnap.size });
    }
  }
  if (email) {
    const emailSnap = await db.collection('users').where('email', '==', email).get();
    if (emailSnap.size > 1) {
      flags.push({ type: 'DUPLICATE_EMAIL', email, accountCount: emailSnap.size });
    }
  }
  return { hasDuplicates: flags.length > 0, flags };
}

// ─── Week 7: Auto Fraud Check (call on job create/complete) ──────────────────

async function autoFraudCheck(jobData, userId, driverId) {
  const [userStats, driverStats, velocity] = await Promise.all([
    userId ? getUserFraudStats(userId) : Promise.resolve({}),
    driverId ? getDriverFraudStats(driverId) : Promise.resolve({}),
    userId ? checkVelocity(userId) : Promise.resolve({ suspicious: false }),
  ]);

  const result = calculateFraudScore(jobData, userStats, driverStats);

  // Add velocity flag
  if (velocity.suspicious) {
    result.score += 2;
    result.flags.push('RAPID_BOOKING');
    result.shouldFlag = true;
    if (result.score > SCORE_SUSPICIOUS) result.level = 'high_risk';
    else if (result.score > SCORE_SAFE) result.level = 'suspicious';
  }

  // Auto-flag if needed
  if (result.shouldFlag && jobData.id) {
    await flagJob(jobData.id || 'unknown', result).catch(() => {});
  }

  return { ...result, velocity, userStats, driverStats };
}

module.exports = {
  calculateFraudScore, getUserFraudStats, getDriverFraudStats,
  flagJob, getFlaggedJobs, getFlaggedUsers, applyFraudPenalty,
  SCORE_SAFE, SCORE_SUSPICIOUS,
  // Week 7 additions
  checkVelocity, checkSuspiciousPayout, checkExcessiveCancellations,
  checkDuplicateAccounts, autoFraudCheck,
};
