/**
 * Incident Controller — RoadResQ Admin Safety Dashboard
 *
 * POST   /api/incidents              - Report an incident
 * GET    /api/incidents              - List incidents (admin, with filters)
 * GET    /api/incidents/:id          - Get incident detail
 * PUT    /api/incidents/:id/action   - Admin takes action (warn/suspend/ban/resolve)
 * GET    /api/incidents/live         - Live safety monitor feed (active jobs + flags)
 * GET    /api/incidents/analytics    - Safety analytics metrics
 * POST   /api/incidents/:id/panic    - Panic button trigger
 * POST   /api/incidents/inactivity-check - Check inactive jobs
 */

const { validationResult } = require('express-validator');
const { createIncident, getIncidentById, listIncidents, updateIncident } = require('../models/incidentModel');
const { triggerPanic, checkInactiveJobs } = require('../utils/safetyEngine');
const { db } = require('../config/firebase');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail    = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// ─── POST /api/incidents ──────────────────────────────────────────────────────
const reportIncident = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ status: 'error', errors: errors.array() });

  try {
    const incident = await createIncident(req.body);
    return success(res, { incident }, 201);
  } catch (err) {
    console.error('reportIncident:', err);
    return fail(res, 'Failed to create incident.', 500);
  }
};

// ─── GET /api/incidents ───────────────────────────────────────────────────────
const getIncidents = async (req, res) => {
  try {
    const { status, type, riskLevel, jobId, limit } = req.query;
    const incidents = await listIncidents({ status, type, riskLevel, jobId, limit });
    return success(res, { incidents, count: incidents.length });
  } catch (err) {
    console.error('getIncidents:', err);
    return fail(res, 'Failed to list incidents.', 500);
  }
};

// ─── GET /api/incidents/live ──────────────────────────────────────────────────
// Returns active jobs with safety flags for the live monitor dashboard
const getLiveMonitor = async (req, res) => {
  try {
    const activeSnap = await db.collection('jobs')
      .where('status', 'in', ['pending', 'assigned', 'accepted', 'in_progress', 'on_site'])
      .orderBy('createdAt', 'desc')
      .limit(100).get();

    const jobs = activeSnap.docs.map(d => {
      const job = { id: d.id, ...d.data() };
      // Assign dashboard color
      if (job.isPanicTriggered || job.riskLevel === 'critical') job._dashboardColor = 'red';
      else if (job.riskLevel === 'high' || job.safetyFlags?.length) job._dashboardColor = 'yellow';
      else job._dashboardColor = 'green';
      return job;
    });

    // Open incidents count
    const incidentSnap = await db.collection('incidents')
      .where('status', '==', 'open').get();

    // Admin alerts (unread)
    const alertSnap = await db.collection('admin_alerts')
      .where('isRead', '==', false).get();

    return success(res, {
      activeJobs: jobs,
      jobCount: jobs.length,
      openIncidents: incidentSnap.size,
      unreadAlerts: alertSnap.size,
      summary: {
        red:    jobs.filter(j => j._dashboardColor === 'red').length,
        yellow: jobs.filter(j => j._dashboardColor === 'yellow').length,
        green:  jobs.filter(j => j._dashboardColor === 'green').length,
      },
    });
  } catch (err) {
    console.error('getLiveMonitor:', err);
    return fail(res, 'Failed to load live monitor.', 500);
  }
};

// ─── GET /api/incidents/analytics ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    // Jobs today
    const jobsSnap = await db.collection('jobs')
      .where('createdAt', '>=', todayIso).get();
    const jobs = jobsSnap.docs.map(d => d.data());

    // Incidents
    const incSnap = await db.collection('incidents').get();
    const incidents = incSnap.docs.map(d => d.data());

    // Drivers
    const driversSnap = await db.collection('drivers')
      .where('isOnline', '==', true).get();

    const avgResponseMs = jobs
      .filter(j => j.acceptedAt && j.createdAt)
      .map(j => new Date(j.acceptedAt) - new Date(j.createdAt));
    const avgResponseMin = avgResponseMs.length
      ? Math.round(avgResponseMs.reduce((a, b) => a + b, 0) / avgResponseMs.length / 60000)
      : null;

    return success(res, {
      today: {
        totalJobs:     jobs.length,
        completedJobs: jobs.filter(j => j.status === 'completed').length,
        cancelledJobs: jobs.filter(j => j.status === 'cancelled').length,
        highRiskJobs:  jobs.filter(j => j.riskLevel === 'high' || j.riskLevel === 'critical').length,
        panicJobs:     jobs.filter(j => j.isPanicTriggered).length,
      },
      incidents: {
        total:      incidents.length,
        open:       incidents.filter(i => i.status === 'open').length,
        resolved:   incidents.filter(i => i.status === 'resolved').length,
        byType:     incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {}),
      },
      drivers: {
        onlineNow:  driversSnap.size,
      },
      performance: {
        avgResponseTimeMinutes: avgResponseMin,
      },
    });
  } catch (err) {
    console.error('getAnalytics:', err);
    return fail(res, 'Failed to load analytics.', 500);
  }
};

// ─── GET /api/incidents/:id ───────────────────────────────────────────────────
const getIncidentDetail = async (req, res) => {
  try {
    const incident = await getIncidentById(req.params.id);
    if (!incident) return fail(res, 'Incident not found.', 404);

    // Fetch related job
    let job = null;
    if (incident.jobId) {
      const jobSnap = await db.collection('jobs').doc(incident.jobId).get();
      if (jobSnap.exists) job = { id: jobSnap.id, ...jobSnap.data() };
    }
    return success(res, { incident, job });
  } catch (err) {
    return fail(res, 'Failed to get incident.', 500);
  }
};

// ─── PUT /api/incidents/:id/action ───────────────────────────────────────────
// Admin takes action: warn | suspend | ban | resolve | escalate
const adminAction = async (req, res) => {
  const { action, adminId, notes, driverId, userId } = req.body;
  if (!action) return fail(res, 'action is required.');

  try {
    const updates = {
      adminAction: action,
      adminId:     adminId || null,
      adminNotes:  notes   || null,
      status:      action === 'resolve' ? 'resolved' : action === 'escalate' ? 'escalated' : 'under_review',
      resolvedAt:  action === 'resolve' ? new Date().toISOString() : null,
    };
    const incident = await updateIncident(req.params.id, updates);

    // Apply driver consequences
    if (driverId && ['warn', 'suspend', 'ban'].includes(action)) {
      const driverUpdates = { updatedAt: new Date().toISOString() };
      if (action === 'warn') {
        const driverSnap = await db.collection('drivers').doc(driverId).get();
        const currentWarnings = driverSnap.exists ? (driverSnap.data().warnings || 0) : 0;
        driverUpdates.warnings = currentWarnings + 1;
        if (driverUpdates.warnings >= 3) {
          driverUpdates.isSuspended = true;
          driverUpdates.suspendedAt = new Date().toISOString();
          driverUpdates.suspendReason = 'auto_suspend_3_warnings';
        }
      } else if (action === 'suspend') {
        driverUpdates.isSuspended = true;
        driverUpdates.suspendedAt = new Date().toISOString();
        driverUpdates.suspendReason = 'admin_manual_suspend';
      } else if (action === 'ban') {
        driverUpdates.isSuspended = true;
        driverUpdates.isPermanentlyBanned = true;
        driverUpdates.bannedAt = new Date().toISOString();
      }
      await db.collection('drivers').doc(driverId).update(driverUpdates);
    }

    return success(res, { incident, actionApplied: action });
  } catch (err) {
    console.error('adminAction:', err);
    return fail(res, 'Failed to apply admin action.', 500);
  }
};

// ─── POST /api/incidents/panic ────────────────────────────────────────────────
const panicButton = async (req, res) => {
  const { jobId, triggeredBy, location } = req.body;
  if (!jobId || !triggeredBy) return fail(res, 'jobId and triggeredBy required.');
  try {
    const result = await triggerPanic(jobId, triggeredBy, location);
    return success(res, result);
  } catch (err) {
    console.error('panicButton:', err);
    return fail(res, 'Failed to trigger panic alert.', 500);
  }
};

// ─── POST /api/incidents/inactivity-check ─────────────────────────────────────
const inactivityCheck = async (req, res) => {
  try {
    const inactive = await checkInactiveJobs();
    return success(res, { flaggedJobs: inactive, count: inactive.length });
  } catch (err) {
    console.error('inactivityCheck:', err);
    return fail(res, 'Failed to check inactive jobs.', 500);
  }
};

// ─── GET /api/incidents/alerts ────────────────────────────────────────────────
const getAdminAlerts = async (req, res) => {
  try {
    const snap = await db.collection('admin_alerts')
      .orderBy('createdAt', 'desc').limit(50).get();
    const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return success(res, { alerts, unread: alerts.filter(a => !a.isRead).length });
  } catch (err) {
    return fail(res, 'Failed to fetch alerts.', 500);
  }
};

// ─── PUT /api/incidents/alerts/:id/read ───────────────────────────────────────
const markAlertRead = async (req, res) => {
  try {
    await db.collection('admin_alerts').doc(req.params.id).update({ isRead: true });
    return success(res, { alertId: req.params.id, isRead: true });
  } catch (err) {
    return fail(res, 'Failed to mark alert as read.', 500);
  }
};

module.exports = {
  reportIncident, getIncidents, getLiveMonitor, getAnalytics,
  getIncidentDetail, adminAction, panicButton, inactivityCheck,
  getAdminAlerts, markAlertRead,
};
