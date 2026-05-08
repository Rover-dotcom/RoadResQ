/**
 * RoadResQ — Firebase Cloud Functions Entry Point (v7.0.0)
 * Region: me-central1 (Doha, Qatar)
 * URL: https://api-h6acdw3itq-ww.a.run.app
 * 
 * Routes are synced from backend/ (single source of truth).
 * Do NOT add business logic here — all logic lives in backend/.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'roadresq-bd6b0' });
}

// ─── Cloud Function Options ───────────────────────────────────────────────────
setGlobalOptions({
  region: 'me-central1',
  memory: '512MiB',
  timeoutSeconds: 120,
});

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── Routes (synced from backend/) ───────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const jobRoutes          = require('./routes/jobRoutes');
const driverRoutes       = require('./routes/driverRoutes');
const quoteRoutes        = require('./routes/quoteRoutes');
const garageRoutes       = require('./routes/garageRoutes');
const disciplineRoutes   = require('./routes/disciplineRoutes');
const incidentRoutes     = require('./routes/incidentRoutes');
const fraudRoutes        = require('./routes/fraudRoutes');
const disputeRoutes      = require('./routes/disputeRoutes');
const safetyRoutes       = require('./routes/safetyRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const completionRoutes   = require('./routes/completionRoutes');
const trackingRoutes     = require('./routes/trackingRoutes');       // Week 6
const integrationRoutes  = require('./routes/integrationRoutes');    // Week 6

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
app.use('/api/tracking',        trackingRoutes);       // Week 6: GPS tracking
app.use('/api/test',            integrationRoutes);    // Week 6: integration tests

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  service: 'RoadResQ API',
  version: '7.0.0',
  status: 'running',
  region: 'me-central1 (Doha, Qatar)',
  project: 'roadresq-bd6b0',
  endpoints: {
    auth:        '/api/auth',
    jobs:        '/api/jobs',
    drivers:     '/api/drivers',
    quotes:      '/api/quotes',
    garage:      '/api/garage-requests',
    discipline:  '/api/discipline',
    incidents:   '/api/incidents',
    fraud:       '/api/fraud',
    disputes:    '/api/disputes',
    safety:      '/api/safety',
    dashboard:   '/api/dashboard',
    completion:  '/api/completion',
    tracking:    '/api/tracking (location | nearby | route | job/:id | job/:id/eta | driver-arrived/:id)',
    integration: '/api/test (system-health | payment-validation | service-check | full-flow)',
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
