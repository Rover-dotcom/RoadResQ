/**
 * RoadResQ — Firebase Cloud Functions Entry Point
 * Region: me-central1 (Doha, Qatar)
 * URL: https://me-central1-roadresq-bd6b0.cloudfunctions.net/api
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Init Firebase Admin (uses auto-credentials in Cloud Functions)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'roadresq-bd6b0' });
}

// Region: Doha, Qatar
setGlobalOptions({ region: 'me-central1', memory: '256MiB', timeoutSeconds: 60 });

// Build Express app inline (avoids cross-directory import issues)
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Routes — all source is now copied into functions/
const authRoutes   = require('./routes/authRoutes');
const jobRoutes    = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const quoteRoutes  = require('./routes/quoteRoutes');

app.use('/api/auth',    authRoutes);
app.use('/api/jobs',    jobRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/quotes',  quoteRoutes);

app.get('/', (_req, res) => res.json({
  service: 'RoadResQ API',
  version: '2.0.0',
  status: 'running',
  region: 'me-central1 (Doha, Qatar)',
  project: 'roadresq-bd6b0',
}));

app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Route not found' }));
app.use((err, _req, res, _next) => res.status(500).json({ status: 'error', message: err.message }));

exports.api = onRequest({ cors: true, invoker: 'public' }, app);
