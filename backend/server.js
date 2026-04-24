/**
 * RoadResQ — Express Server
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

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'RoadResQ API',
    version: '2.0.0',
    status: 'running',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    endpoints: {
      auth: '/api/auth/register | /api/auth/login',
      jobs: '/api/jobs | /api/jobs/available | /api/jobs/price-estimate | /api/jobs/service-info',
      drivers: '/api/drivers | /api/drivers/truck-types | /api/drivers/status',
      quotes: '/api/quotes',
    },
    serviceStructure: {
      '1. Tow': 'Sedan / SUV / 4x4 / Motorcycle / ATV / Others',
      '2. Garage': 'Urgent (auto-dispatch) / Standard (→ Quote)',
      '3. Heavy Equipment': 'Skid Loader / JCB / Excavator / Telehandler / Others',
      '4. Quote Industrial': 'Precast / Pallets / Container / Generator / Others',
    },
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
    console.log(`\n🚗 RoadResQ API running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check: http://0.0.0.0:${PORT}/`);
    console.log(`   Jobs:         http://0.0.0.0:${PORT}/api/jobs`);
    console.log(`   Service info: http://0.0.0.0:${PORT}/api/jobs/service-info\n`);
  });
}

// Export for Firebase Functions
module.exports = app;
