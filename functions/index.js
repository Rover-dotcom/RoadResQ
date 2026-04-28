/**
 * RoadResQ — Firebase Cloud Functions Entry Point (Week 4 / v4.0.0)
 * Region: me-central1 (Doha, Qatar)
 * URL: https://me-central1-roadresq-bd6b0.cloudfunctions.net/api
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

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const jobRoutes       = require('./routes/jobRoutes');
const driverRoutes    = require('./routes/driverRoutes');
const quoteRoutes     = require('./routes/quoteRoutes');
const garageRoutes    = require('./routes/garageRoutes');     // Week 4: on-site repair
const disciplineRoutes = require('./routes/disciplineRoutes'); // Week 4: driver discipline

app.use('/api/auth',            authRoutes);
app.use('/api/jobs',            jobRoutes);
app.use('/api/drivers',         driverRoutes);
app.use('/api/quotes',          quoteRoutes);
app.use('/api/garage-requests', garageRoutes);     // Week 4
app.use('/api/discipline',      disciplineRoutes); // Week 4

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({
  service: 'RoadResQ API',
  version: '4.0.0',
  status: 'running',
  region: 'me-central1 (Doha, Qatar)',
  project: 'roadresq-bd6b0',
  endpoints: {
    auth:           '/api/auth/register | /api/auth/login',
    jobs:           '/api/jobs | /api/jobs/my-jobs | /api/jobs/:id/status | /api/jobs/available | /api/jobs/price-estimate | /api/jobs/service-info',
    drivers:        '/api/drivers | /api/drivers/truck-types | /api/drivers/:id/status | /api/drivers/:id/online | /api/drivers/:id/offline',
    quotes:         '/api/quotes | /api/quotes/my-quotes | /api/quotes/:id/bids | /api/quotes/:id/bid',
    garageRequests: '/api/garage-requests (on-site repair: broadcast → estimate → accept)',
    discipline:     '/api/discipline (warnings, compliance, safety checklists, priority queue, admin-review)',
  },
  week4Features: [
    '10km geo-radius matching (haversine)',
    'Equipment type constraints (boom_truck / flatbed / flatbed_tow)',
    'Basement/restricted height filter (clearanceHeightMm)',
    'Gate pass enforcement (requiresGatePass)',
    'Expert-first routing (yearsExperience priority)',
    'Driver discipline: 3-strike suspension + no-show fee (QR 50)',
    'Customer no-show charge: QR 50.00 (5000 halala)',
    'Document compliance: 30-day notify, 7-day critical, expired = block',
    'Integer halala pricing (5000 = QR 50.00)',
    'On-site repair estimate bidding (first-accept-wins, 15min auto-cancel)',
    'Quote bidding: multi-driver bids, price-sorted, best highlighted, auto job creation',
    '"Others" dynamic input across all 4 service categories',
    'Job priority queue: urgency + wait time scoring',
    'Admin review queue for custom/Others jobs',
    'Pre-trip driver safety checklist (6 mandatory items)',
    'Customer safety confirmation (3 mandatory items)',
    'Traffic buffer ETA: +25% during Qatar peak hours',
    'Driver online/offline toggle with compliance gating',
    'Real-time dispatch: customer my-jobs + live job status',
  ],
}));

// ─── 404 + Error Handlers ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[RoadResQ Error]', err.message);
  res.status(500).json({ status: 'error', message: 'Internal server error.', detail: err.message });
});

// ─── Export Cloud Function ────────────────────────────────────────────────────
exports.api = onRequest({ cors: true, invoker: 'public' }, app);
