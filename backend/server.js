/**
 * RoadResQ — Express Server v9.1.0 (Week 8: Google Maps Production + New Features)
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
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { httpLogger } = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');

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
const walletRoutes = require('./routes/walletRoutes');             // Week 6 v8: wallet system
const payoutRoutes = require('./routes/payoutRoutes');             // Week 6 v8: driver payouts
const dispatchRoutes = require('./routes/dispatchRoutes');         // Week 6 v8: real-time dispatch
const mapsRoutes = require('./routes/mapsRoutes');                 // Week 6 v8: Google Maps integration
const notificationRoutes = require('./routes/notificationRoutes'); // Week 7 v9: push notifications
const savedLocationRoutes = require('./routes/savedLocationRoutes'); // Week 7 v9: saved locations
const adminRoutes = require('./routes/adminRoutes');                 // Week 7 v9: admin backup/system
const vehicleRoutes = require('./routes/vehicleRoutes');             // Week 7 v9: saved vehicles
const historyRoutes = require('./routes/historyRoutes');             // Week 7 v9: earnings/booking/repair history

const app = express();

// ─── Security + Performance Middleware ────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));   // Security headers (XSS, CSRF, clickjacking)
app.use(compression());                              // Gzip response compression
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Response time tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => res.setHeader('X-Response-Time', `${Date.now() - start}ms`));
  next();
});

// Winston HTTP logger
app.use(httpLogger);

// ─── Rate Limiting (Week 7) ──────────────────────────────────────────────────

// General API: 100 req/min
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 'error', message: 'Too many requests. Limit: 100/min.' },
});
app.use('/api/', generalLimiter);

// Auth endpoints: 10 req/min (prevent login/OTP spam)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, status: 'error', message: 'Too many auth attempts. Limit: 10/min.' },
});
app.use('/api/auth/', authLimiter);

// Job creation: 5 req/min (prevent fake booking attacks)
const jobLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, status: 'error', message: 'Too many bookings. Limit: 5/min.' },
});
app.use('/api/jobs', (req, res, next) => {
  if (req.method === 'POST') return jobLimiter(req, res, next);
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
app.use('/api/tracking', trackingRoutes);         // GPS tracking + live location
app.use('/api/test', integrationRoutes);          // Integration testing
app.use('/api/wallet', walletRoutes);             // Wallet system
app.use('/api/payouts', payoutRoutes);            // Driver payouts
app.use('/api/dispatch', dispatchRoutes);         // Real-time dispatch
app.use('/api/maps', mapsRoutes);                 // Google Maps integration
app.use('/api/notifications', notificationRoutes); // Week 7: push notifications
app.use('/api/saved-locations', savedLocationRoutes); // Week 7: saved locations
app.use('/api/admin', adminRoutes);                    // Week 7: admin backup/system
app.use('/api/vehicles', vehicleRoutes);                // Week 7: customer saved vehicles
app.use('/api/history', historyRoutes);                 // Week 7: earnings/booking/repair history

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'RoadResQ API',
    version: '9.1.0',
    status: 'running',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    security: {
      auth: 'Firebase ID Token (Bearer)',
      rbac: 'customer | driver | garage | admin',
      rateLimiting: 'General 100/min, Auth 10/min, Jobs 5/min',
      headers: 'Helmet (XSS, CSRF, Clickjacking)',
      idempotency: 'Idempotency-Key header on payments',
    },
    googleMaps: {
      status: process.env.GOOGLE_MAPS_API_KEY ? 'ACTIVE (production key)' : 'FALLBACK (Haversine)',
      apis: 'Directions, Distance Matrix, Geocoding, Places Autocomplete',
      cache: '5-minute in-memory cache',
    },
    endpoints: {
      auth: '/api/auth',
      jobs: '/api/jobs',
      drivers: '/api/drivers',
      quotes: '/api/quotes',
      garageRequests: '/api/garage-requests',
      discipline: '/api/discipline',
      dashboard: '/api/dashboard',
      completion: '/api/completion',
      tracking: '/api/tracking',
      wallet: '/api/wallet',
      payouts: '/api/payouts',
      dispatch: '/api/dispatch',
      maps: '/api/maps',
      notifications: '/api/notifications',
      savedLocations: '/api/saved-locations',
      safety: '/api/safety',
      fraud: '/api/fraud',
      disputes: '/api/disputes',
      incidents: '/api/incidents',
      vehicles: '/api/vehicles',
      history: '/api/history',
      admin: '/api/admin',
      integration: '/api/test',
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 'error',
    message: 'Route not found. Check GET / for all available endpoints.',
    requestId: req.requestId,
  });
});

// ─── Global Error Handler (Week 7: centralized) ─────────────────────────────

app.use(globalErrorHandler);

// ─── Local Server Start ───────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nRoadResQ API v9.0.0 — Week 7 Production Ready running on http://0.0.0.0:${PORT}`);
    console.log(`   Health:             http://0.0.0.0:${PORT}/`);
    console.log(`   System health:      http://0.0.0.0:${PORT}/api/test/system-health`);
    console.log(`   Maps status:        http://0.0.0.0:${PORT}/api/maps/status\n`);
  });
}

// Export for Firebase Functions
module.exports = app;
