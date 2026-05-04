/**
 * RoadResQ — Express Server v5.0.0
 *
 * Runs locally (node server.js) or is deployed as a Firebase Cloud Function
 * via functions/index.js.
 *
 * Local: http://localhost:3000
 * Firebase: https://asia-southeast1-roadresq-bd6b0.cloudfunctions.net/api
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const garageRoutes = require('./routes/garageRoutes');         // Week 4: on-site repair
const disciplineRoutes = require('./routes/disciplineRoutes'); // Week 4: driver discipline
const incidentRoutes = require('./routes/incidentRoutes');     // Week 5: admin safety dashboard
const fraudRoutes = require('./routes/fraudRoutes');           // Week 5: fraud detection
const disputeRoutes = require('./routes/disputeRoutes');       // Week 5: dispute resolution (ADR)
const safetyRoutes = require('./routes/safetyRoutes');         // Week 5: safety system 2.0
const dashboardRoutes = require('./routes/dashboardRoutes');   // Week 4+: role-separated dashboards
const completionRoutes = require('./routes/completionRoutes'); // Week 5: finalization + payments + cleanup

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/garage-requests', garageRoutes);     // Week 4: on-site repair bidding
app.use('/api/discipline', disciplineRoutes);      // Week 4: driver discipline + compliance
app.use('/api/incidents', incidentRoutes);         // Week 5: admin safety dashboard
app.use('/api/fraud', fraudRoutes);                // Week 5: fraud detection system
app.use('/api/disputes', disputeRoutes);           // Week 5: automated dispute resolution
app.use('/api/safety', safetyRoutes);              // Week 5: safety system 2.0
app.use('/api/dashboard', dashboardRoutes);        // Week 4+: role-separated dashboards
app.use('/api/completion', completionRoutes);      // Week 5: job finalization + payments + cleanup

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'RoadResQ API',
    version: '6.0.0',
    status: 'running',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    endpoints: {
      auth: '/api/auth/register | /api/auth/login',
      jobs: '/api/jobs | /api/jobs/my-jobs | /api/jobs/:id/status | /api/jobs/available | /api/jobs/price-estimate | /api/jobs/service-info',
      drivers: '/api/drivers | /api/drivers/truck-types | /api/drivers/:id/status | /api/drivers/:id/online | /api/drivers/:id/offline',
      quotes: '/api/quotes | /api/quotes/my-quotes | /api/quotes/:id/bids | /api/quotes/:id/bid',
      garageRequests: '/api/garage-requests (on-site repair: broadcast → estimate → accept)',
      discipline: '/api/discipline (warnings, compliance, safety checklists, priority queue, admin-review)',
      dashboard: '/api/dashboard (admin | driver/:id | user/:id | garage/:id)',
      completion: '/api/completion (/:id/complete | /:id/report | /:id/payment | archive-old | cleanup-files | audit-logs)',
    },
    serviceStructure: {
      '1. Tow': 'Sedan / SUV / 4x4 / Motorcycle / ATV / Others',
      '2. Garage': 'Urgent (auto-dispatch) / Standard (→ Quote)',
      '3. Heavy Equipment': 'Skid Loader / JCB / Excavator / Telehandler / Others',
      '4. Quote Industrial': 'Precast / Pallets / Container / Generator / Others',
      '5. Onsite Repair (NEW)': 'Customer requests → broadcast to nearby garages → estimate bidding',
    },
    week4Features: [
      '10km geo-radius matching with haversine filter',
      'Equipment type constraints (boom_truck, flatbed, flatbed_tow)',
      'Basement / restricted access height filter (clearanceHeightMm)',
      'Gate pass requirement enforcement',
      'Expert-first routing for special loads (yearsExperience priority)',
      'Driver discipline: 3-strike suspension + no-show fee (QR 50)',
      'Customer no-show charge: QR 50.00 (5000 halala)',
      'Document compliance: 30-day notify, 7-day critical alert, expired = block',
      'Integer halala pricing (5000 = QR 50.00) across all services',
      'On-site repair estimate bidding (first-accept-wins, 15min auto-cancel)',
      'Quote bidding system: multi-driver bids, best price highlighted, auto job creation',
      '"Others" dynamic input across all 4 service categories',
      'Job priority queue: urgency + wait time scoring',
      'Admin review queue for custom/Others jobs',
      'Pre-trip driver safety checklist (all items must pass before job starts)',
      'Customer safety confirmation (3 safety items before confirmation)',
      'Traffic buffer ETA: +25% during Qatar peak hours',
      'Driver online/offline toggle with compliance gating',
      'Real-time dispatch: customer my-jobs + live job status endpoint',
      'Scheduled pickup: isScheduled + scheduledPickupDate + scheduledPickupTime (all service types)',
      'Cancellation tracking: cancellationReason + cancelledBy on all job cancellations',
    ],
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found. Check GET / for all available endpoints.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error.',
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
  });
});

// ─── Local Server Start ───────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚗 RoadResQ API v4.0.0 — Week 4 Complete running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check:       http://0.0.0.0:${PORT}/`);
    console.log(`   Jobs (customer):    http://0.0.0.0:${PORT}/api/jobs/my-jobs`);
    console.log(`   Job status:         http://0.0.0.0:${PORT}/api/jobs/:id/status`);
    console.log(`   Garage requests:    http://0.0.0.0:${PORT}/api/garage-requests`);
    console.log(`   Discipline:         http://0.0.0.0:${PORT}/api/discipline`);
    console.log(`   Priority queue:     http://0.0.0.0:${PORT}/api/discipline/priority-queue`);
    console.log(`   Compliance check:   http://0.0.0.0:${PORT}/api/discipline/compliance-check`);
    console.log(`   Quote bidding:      http://0.0.0.0:${PORT}/api/quotes/:id/bids`);
    console.log(`   Service info:       http://0.0.0.0:${PORT}/api/jobs/service-info\n`);
  });
}

// Export for Firebase Functions
module.exports = app;
