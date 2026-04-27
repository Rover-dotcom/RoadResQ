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
const garageRoutes = require('./routes/garageRoutes');     // Week 4: on-site repair
const disciplineRoutes = require('./routes/disciplineRoutes'); // Week 4: driver discipline

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

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'RoadResQ API',
    version: '3.0.0', // Week 4: Intelligence + Safety + Logistics
    status: 'running',
    project: 'roadresq-bd6b0',
    region: 'me-central1 (Doha, Qatar)',
    endpoints: {
      auth: '/api/auth/register | /api/auth/login',
      jobs: '/api/jobs | /api/jobs/available | /api/jobs/price-estimate | /api/jobs/service-info',
      drivers: '/api/drivers | /api/drivers/truck-types | /api/drivers/status',
      quotes: '/api/quotes',
      garageRequests: '/api/garage-requests (Week 4: on-site repair bidding)',
      discipline: '/api/discipline (Week 4: driver discipline + compliance)',
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
      'Driver discipline: 3-strike suspension system',
      'Customer no-show charge: QR 50.00 (5000 halala)',
      'Document compliance blocking (license, insurance, visa, roadworthiness)',
      'Integer halala pricing (5000 = QR 50.00) across all services',
      'On-site repair estimate bidding (first-accept-wins, 15min auto-cancel)',
      '"Others" dynamic input across all 4 service categories',
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
    console.log(`\n🚗 RoadResQ API v3.0.0 — Week 4 running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check:       http://0.0.0.0:${PORT}/`);
    console.log(`   Jobs:               http://0.0.0.0:${PORT}/api/jobs`);
    console.log(`   Garage requests:    http://0.0.0.0:${PORT}/api/garage-requests`);
    console.log(`   Discipline:         http://0.0.0.0:${PORT}/api/discipline`);
    console.log(`   Service info:       http://0.0.0.0:${PORT}/api/jobs/service-info\n`);
  });
}

// Export for Firebase Functions
module.exports = app;
