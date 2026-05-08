/**
 * RoadResQ — Express Server v7.0.0 (Week 6: Maps + Integration + Tracking)
 *
 * Runs locally (node server.js) or is deployed as a Firebase Cloud Function
 * via functions/index.js.
 *
 * Local: http://localhost:3000
 * Firebase: https://api-h6acdw3itq-ww.a.run.app
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const garageRoutes = require('./routes/garageRoutes');             // Week 4: on-site repair
const disciplineRoutes = require('./routes/disciplineRoutes');     // Week 4: driver discipline
const incidentRoutes = require('./routes/incidentRoutes');         // Week 5: admin safety dashboard
const fraudRoutes = require('./routes/fraudRoutes');               // Week 5: fraud detection
const disputeRoutes = require('./routes/disputeRoutes');           // Week 5: dispute resolution (ADR)
const safetyRoutes = require('./routes/safetyRoutes');             // Week 5: safety system 2.0
const dashboardRoutes = require('./routes/dashboardRoutes');       // Week 4+: role-separated dashboards
const completionRoutes = require('./routes/completionRoutes');     // Week 5: finalization + payments + cleanup
const trackingRoutes = require('./routes/trackingRoutes');         // Week 6: GPS tracking + live location
const integrationRoutes = require('./routes/integrationRoutes');   // Week 6: system integration testing

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Response time tracking header
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  next();
});

// Request logger (dev)
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Simple rate limiting (per IP, 100 req/min)
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  const entry = requestCounts.get(ip);
  if (now - entry.windowStart > windowMs) {
    entry.count = 1;
    entry.windowStart = now;
    return next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please try again later.',
    });
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/garage-requests', garageRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/completion', completionRoutes);
app.use('/api/tracking', trackingRoutes);         // Week 6: GPS tracking
app.use('/api/test', integrationRoutes);          // Week 6: integration testing

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'RoadResQ API',
    version: '7.0.0',
    status: 'running',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    endpoints: {
      auth: '/api/auth/register | /api/auth/login',
      jobs: '/api/jobs | /api/jobs/my-jobs | /api/jobs/:id/status | /api/jobs/available | /api/jobs/price-estimate | /api/jobs/service-info',
      drivers: '/api/drivers | /api/drivers/truck-types | /api/drivers/:id/status | /api/drivers/:id/online | /api/drivers/:id/offline',
      quotes: '/api/quotes | /api/quotes/my-quotes | /api/quotes/:id/bids | /api/quotes/:id/bid',
      garageRequests: '/api/garage-requests (on-site repair: broadcast -> estimate -> accept)',
      discipline: '/api/discipline (warnings, compliance, safety checklists, priority queue, admin-review)',
      dashboard: '/api/dashboard (admin | driver/:id | user/:id | garage/:id)',
      completion: '/api/completion (/:id/complete | /:id/report | /:id/payment | archive-old | cleanup-files | audit-logs)',
      tracking: '/api/tracking (location | nearby | route | driver/:id | job/:jobId | job/:jobId/eta | driver-arrived/:jobId)',
      integration: '/api/test (system-health | payment-validation | service-check | full-flow | simulate-tracking)',
    },
    serviceStructure: {
      '1. Tow': 'Sedan / SUV / 4x4 / Motorcycle / ATV / Others',
      '2. Garage': 'Urgent (auto-dispatch) / Standard (-> Quote)',
      '3. Heavy Equipment': 'Skid Loader / JCB / Excavator / Telehandler / Others',
      '4. Quote Industrial': 'Precast / Pallets / Container / Generator / Others',
      '5. Onsite Repair': 'Customer requests -> broadcast to nearby garages -> estimate bidding',
    },
    week6Features: [
      'Live GPS tracking via Firebase Realtime Database',
      'Nearby driver search with Haversine formula',
      'Traffic-adjusted ETA (Qatar peak-hour buffers)',
      'Driver arrival auto-detection (< 100m threshold)',
      'Job tracking state machine (assigned -> en_route -> arrived -> in_progress -> completed)',
      'Route distance calculation with 1.3x road factor',
      'PM cleanup API integrated (Firebase Storage upload/delete)',
      'System health monitoring endpoint',
      'Payment state machine validation (stuck/orphaned/duplicate detection)',
      'Full booking-to-payout flow simulation',
      'Rate limiting (100 req/min per IP)',
      'Response time tracking header',
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
    console.log(`\nRoadResQ API v7.0.0 — Week 6 Complete running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check:       http://0.0.0.0:${PORT}/`);
    console.log(`   Tracking:           http://0.0.0.0:${PORT}/api/tracking`);
    console.log(`   Nearby drivers:     http://0.0.0.0:${PORT}/api/tracking/nearby`);
    console.log(`   Job tracking:       http://0.0.0.0:${PORT}/api/tracking/job/:id`);
    console.log(`   System health:      http://0.0.0.0:${PORT}/api/test/system-health`);
    console.log(`   Payment validation: http://0.0.0.0:${PORT}/api/test/payment-validation\n`);
  });
}

// Export for Firebase Functions
module.exports = app;
