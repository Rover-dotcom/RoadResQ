/**
 * Fraud Controller — RoadResQ Fraud Detection System
 *
 * GET  /api/fraud/jobs          - Flagged jobs (admin)
 * GET  /api/fraud/users         - Top suspicious users
 * GET  /api/fraud/score/:jobId  - Get fraud score for a job
 * PUT  /api/fraud/action        - Apply penalty (warn/block/ban)
 * POST /api/fraud/check         - Run fraud check on a job
 */

const { validationResult } = require('express-validator');
const {
  calculateFraudScore, getUserFraudStats, getDriverFraudStats,
  flagJob, getFlaggedJobs, getFlaggedUsers, applyFraudPenalty,
} = require('../utils/fraudEngine');
const { db } = require('../config/firebase');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail    = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// ─── GET /api/fraud/jobs ──────────────────────────────────────────────────────
const getFlaggedJobsList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const jobs = await getFlaggedJobs(limit);
    return success(res, { jobs, count: jobs.length });
  } catch (err) {
    return fail(res, 'Failed to fetch flagged jobs.', 500);
  }
};

// ─── GET /api/fraud/users ─────────────────────────────────────────────────────
const getFlaggedUsersList = async (req, res) => {
  try {
    const users = await getFlaggedUsers();
    return success(res, { users, count: users.length });
  } catch (err) {
    return fail(res, 'Failed to fetch flagged users.', 500);
  }
};

// ─── GET /api/fraud/score/:jobId ──────────────────────────────────────────────
const getJobFraudScore = async (req, res) => {
  const { jobId } = req.params;
  try {
    const snap = await db.collection('jobs').doc(jobId).get();
    if (!snap.exists) return fail(res, 'Job not found.', 404);
    const job = snap.data();

    const [userStats, driverStats] = await Promise.all([
      job.userId ? getUserFraudStats(job.userId) : Promise.resolve({}),
      job.assignedDriver ? getDriverFraudStats(job.assignedDriver) : Promise.resolve({}),
    ]);

    const result = calculateFraudScore(job, userStats, driverStats);
    return success(res, { jobId, ...result, userStats, driverStats });
  } catch (err) {
    return fail(res, 'Failed to calculate fraud score.', 500);
  }
};

// ─── POST /api/fraud/check ────────────────────────────────────────────────────
// Run fraud check on a job and store result
const checkJobFraud = async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) return fail(res, 'jobId is required.');
  try {
    const snap = await db.collection('jobs').doc(jobId).get();
    if (!snap.exists) return fail(res, 'Job not found.', 404);
    const job = snap.data();

    const [userStats, driverStats] = await Promise.all([
      job.userId ? getUserFraudStats(job.userId) : Promise.resolve({}),
      job.assignedDriver ? getDriverFraudStats(job.assignedDriver) : Promise.resolve({}),
    ]);

    const result = calculateFraudScore(job, userStats, driverStats);
    await flagJob(jobId, result);

    return success(res, { jobId, ...result });
  } catch (err) {
    console.error('checkJobFraud:', err);
    return fail(res, 'Failed to run fraud check.', 500);
  }
};

// ─── PUT /api/fraud/action ────────────────────────────────────────────────────
const applyPenalty = async (req, res) => {
  const { userId, driverId, level, flagId } = req.body;
  if (!level) return fail(res, 'level is required: warning | temporary_block | permanent_ban');
  if (!['warning', 'temporary_block', 'permanent_ban'].includes(level)) {
    return fail(res, 'Invalid level. Use: warning | temporary_block | permanent_ban');
  }
  try {
    await applyFraudPenalty(userId, driverId, level);
    if (flagId) {
      await db.collection('fraud_flags').doc(flagId).update({
        status: 'actioned', actionTaken: level, actionAt: new Date().toISOString(),
      });
    }
    return success(res, { penaltyApplied: level, userId, driverId });
  } catch (err) {
    console.error('applyPenalty:', err);
    return fail(res, 'Failed to apply penalty.', 500);
  }
};

module.exports = { getFlaggedJobsList, getFlaggedUsersList, getJobFraudScore, checkJobFraud, applyPenalty };
