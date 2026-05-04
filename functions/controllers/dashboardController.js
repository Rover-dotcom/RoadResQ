/**
 * Dashboard Controller — RoadResQ (Week 4 Addition)
 *
 * Role-separated dashboards. Each role sees ONLY their relevant data.
 *
 * GET /api/dashboard/admin           — admin: all active jobs, incidents, fraud, driver stats
 * GET /api/dashboard/driver/:driverId — driver: assigned jobs, earnings, warnings, compliance
 * GET /api/dashboard/user/:userId     — user: active/past jobs, disputes, safety feedback
 * GET /api/dashboard/garage/:garageId — garage: repair requests, bids, ratings
 */

const { db } = require('../config/firebase');

const success = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const error = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const getAdminDashboard = async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Active jobs
    const activeSnap = await db.collection('jobs')
      .where('status', 'in', ['pending', 'assigned', 'accepted', 'in_progress', 'on_site'])
      .limit(100).get();

    // Today's completed jobs
    const completedSnap = await db.collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', todayStart)
      .limit(100).get();

    // Open incidents
    const incidentsSnap = await db.collection('incidents')
      .where('status', '==', 'open')
      .limit(50).get();

    // Fraud flags
    const fraudSnap = await db.collection('fraud_flags')
      .where('status', '==', 'flagged')
      .limit(50).get();

    // Unread admin alerts
    const alertsSnap = await db.collection('admin_alerts')
      .where('isRead', '==', false)
      .limit(20).get();

    // Active disputes
    const disputeSnap = await db.collection('disputes')
      .where('status', 'in', ['open', 'pending', 'under_review'])
      .limit(50).get();

    // Pending payments
    const paymentSnap = await db.collection('payments')
      .where('status', 'in', ['held', 'disputed'])
      .limit(50).get();

    return success(res, {
      overview: {
        activeJobs: activeSnap.size,
        completedToday: completedSnap.size,
        openIncidents: incidentsSnap.size,
        fraudFlags: fraudSnap.size,
        unreadAlerts: alertsSnap.size,
        activeDisputes: disputeSnap.size,
        pendingPayments: paymentSnap.size,
      },
      activeJobs: activeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      alerts: alertsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      incidents: incidentsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      fraudFlags: fraudSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      disputes: disputeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return error(res, 'Failed to load admin dashboard.', 500);
  }
};

// ─── DRIVER DASHBOARD ─────────────────────────────────────────────────────────

const getDriverDashboard = async (req, res) => {
  const { driverId } = req.params;
  if (!driverId) return error(res, 'driverId is required.');

  try {
    // Driver profile
    const driverSnap = await db.collection('drivers').doc(driverId).get();
    if (!driverSnap.exists) return error(res, 'Driver not found.', 404);
    const driver = driverSnap.data();

    // Active job
    const activeSnap = await db.collection('jobs')
      .where('driverId', '==', driverId)
      .where('status', 'in', ['assigned', 'accepted', 'in_progress', 'on_site'])
      .limit(5).get();

    // Completed jobs (recent 20)
    const completedSnap = await db.collection('jobs')
      .where('driverId', '==', driverId)
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(20).get();

    // Earnings (released payments)
    const earningsSnap = await db.collection('payments')
      .where('driverId', '==', driverId)
      .where('status', '==', 'released')
      .limit(100).get();

    let totalEarnings = 0;
    earningsSnap.docs.forEach(d => { totalEarnings += d.data().amount || 0; });

    // Warnings
    const warningSnap = await db.collection('audit_logs')
      .where('entityId', '==', driverId)
      .where('eventType', '==', 'DRIVER_WARNING')
      .orderBy('timestamp', 'desc')
      .limit(10).get();

    return success(res, {
      profile: { id: driverId, name: driver.name, truckType: driver.truckType, rating: driver.rating || null, isOnline: driver.isOnline || false, isSuspended: driver.isSuspended || false, warningCount: driver.warningCount || 0, completedJobs: driver.completedJobs || 0 },
      activeJobs: activeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      recentCompletedJobs: completedSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      earnings: { totalHalala: totalEarnings, totalDisplay: `QR ${(totalEarnings / 100).toFixed(2)}`, jobCount: earningsSnap.size },
      warnings: warningSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('Driver dashboard error:', err);
    return error(res, 'Failed to load driver dashboard.', 500);
  }
};

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────

const getUserDashboard = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return error(res, 'userId is required.');

  try {
    // User profile
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return error(res, 'User not found.', 404);
    const user = userSnap.data();

    // Active jobs
    const activeSnap = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('status', 'in', ['pending', 'assigned', 'accepted', 'in_progress', 'on_site'])
      .limit(10).get();

    // Past jobs (recent 20)
    const pastSnap = await db.collection('jobs')
      .where('userId', '==', userId)
      .where('status', 'in', ['completed', 'cancelled'])
      .orderBy('createdAt', 'desc')
      .limit(20).get();

    // Disputes
    const disputeSnap = await db.collection('disputes')
      .where('reportedById', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10).get();

    // Safety feedback given
    const feedbackSnap = await db.collection('safety_feedback')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10).get();

    // Payments
    const paymentSnap = await db.collection('payments')
      .where('customerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20).get();

    let totalSpent = 0;
    paymentSnap.docs.forEach(d => {
      if (['released', 'held'].includes(d.data().status)) totalSpent += d.data().amount || 0;
    });

    return success(res, {
      profile: { id: userId, name: user.name, email: user.email, phone: user.phone, role: user.role },
      activeJobs: activeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      pastJobs: pastSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      disputes: disputeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      safetyFeedback: feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      spending: { totalHalala: totalSpent, totalDisplay: `QR ${(totalSpent / 100).toFixed(2)}` },
    });
  } catch (err) {
    console.error('User dashboard error:', err);
    return error(res, 'Failed to load user dashboard.', 500);
  }
};

// ─── GARAGE DASHBOARD ─────────────────────────────────────────────────────────

const getGarageDashboard = async (req, res) => {
  const { garageId } = req.params;
  if (!garageId) return error(res, 'garageId is required.');

  try {
    // Active repair requests assigned to this garage
    const activeSnap = await db.collection('garage_requests')
      .where('garageId', '==', garageId)
      .where('status', 'in', ['pending', 'estimate_sent', 'accepted', 'in_progress'])
      .limit(50).get();

    // Completed repairs
    const completedSnap = await db.collection('garage_requests')
      .where('garageId', '==', garageId)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(20).get();

    // Bids this garage has placed
    const bidsSnap = await db.collection('garage_requests')
      .where('garageId', '==', garageId)
      .limit(50).get();

    // Quote jobs assigned to this garage
    const quoteSnap = await db.collection('jobs')
      .where('garageId', '==', garageId)
      .where('status', 'in', ['quote_pending', 'quoted'])
      .limit(20).get();

    // Earnings
    const earningsSnap = await db.collection('payments')
      .where('driverId', '==', garageId) // garages can also be payment recipients
      .where('status', '==', 'released')
      .limit(100).get();

    let totalEarnings = 0;
    earningsSnap.docs.forEach(d => { totalEarnings += d.data().amount || 0; });

    return success(res, {
      overview: { activeRequests: activeSnap.size, completedRepairs: completedSnap.size, pendingQuotes: quoteSnap.size },
      activeRequests: activeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      completedRepairs: completedSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      pendingQuotes: quoteSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      earnings: { totalHalala: totalEarnings, totalDisplay: `QR ${(totalEarnings / 100).toFixed(2)}`, jobCount: earningsSnap.size },
    });
  } catch (err) {
    console.error('Garage dashboard error:', err);
    return error(res, 'Failed to load garage dashboard.', 500);
  }
};

module.exports = { getAdminDashboard, getDriverDashboard, getUserDashboard, getGarageDashboard };
