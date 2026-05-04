/**
 * RoadResQ — Firebase Cloud Functions Entry Point (v4.1.0)
 * Region: me-central1 (Doha, Qatar)
 * URL: https://api-h6acdw3itq-ww.a.run.app
 * 
 * Routes are imported from ../backend/ (single source of truth).
 * Do NOT add business logic here — all logic lives in backend/.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
// Uses auto-credentials (ADC) in Cloud Functions environment
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'roadresq-bd6b0' });
}

// ─── Cloud Function Options ───────────────────────────────────────────────────
setGlobalOptions({
  region: 'me-central1',   // Doha, Qatar
  memory: '512MiB',        // Increased from 256 for Week 4 logic complexity
  timeoutSeconds: 120,     // Increased for compliance-all batch operations
});

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (lightweight — only non-prod or errors)
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── Routes (deployed copies — kept in sync with backend/) ───────────────────
const authRoutes       = require('./routes/authRoutes');
const jobRoutes        = require('./routes/jobRoutes');
const driverRoutes     = require('./routes/driverRoutes');
const quoteRoutes      = require('./routes/quoteRoutes');
const garageRoutes     = require('./routes/garageRoutes');
const disciplineRoutes = require('./routes/disciplineRoutes');
const incidentRoutes   = require('./routes/incidentRoutes');
const fraudRoutes      = require('./routes/fraudRoutes');
const disputeRoutes    = require('./routes/disputeRoutes');
const safetyRoutes     = require('./routes/safetyRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');
const completionRoutes = require('./routes/completionRoutes');

app.use('/api/auth',            authRoutes);
app.use('/api/jobs',            jobRoutes);
app.use('/api/drivers',         driverRoutes);
app.use('/api/quotes',          quoteRoutes);
app.use('/api/garage-requests', garageRoutes);
app.use('/api/discipline',      disciplineRoutes);
app.use('/api/incidents',       incidentRoutes);
app.use('/api/fraud',           fraudRoutes);
app.use('/api/disputes',        disputeRoutes);
app.use('/api/safety',          safetyRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/completion',      completionRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  service: 'RoadResQ API',
  version: '6.0.0',
  status: 'running',
  region: 'me-central1 (Doha, Qatar)',
  project: 'roadresq-bd6b0',
  endpoints: {
    auth:           '/api/auth',
    jobs:           '/api/jobs',
    drivers:        '/api/drivers',
    quotes:         '/api/quotes',
    garageRequests: '/api/garage-requests',
    discipline:     '/api/discipline',
    incidents:      '/api/incidents',
    fraud:          '/api/fraud',
    disputes:       '/api/disputes',
    safety:         '/api/safety',
    dashboard:      '/api/dashboard (admin | driver/:id | user/:id | garage/:id)',
    completion:     '/api/completion (/:id/complete | /:id/report | /:id/payment | archive-old | cleanup-files | audit-logs)',
  },
}));

// ─── 404 + Error Handlers ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[RoadResQ Error]', err.message);
  res.status(500).json({ status: 'error', message: 'Internal server error.', detail: err.message });
});

// ─── Export Cloud Function ────────────────────────────────────────────────────
exports.api = onRequest({ cors: true, invoker: 'public' }, app);
