/**
 * RoadResQ Backend Server — Week 1, Task 2
 *
 * Express.js server with all REST API routes mounted.
 * 
 * Run: node server.js  (or: npm run dev for nodemon)
 * Port: 3000 (configurable via PORT env var)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const driverRoutes = require('./routes/driverRoutes');
const quoteRoutes = require('./routes/quoteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev) ────────────────────────────────────────────────────

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    data: {
      message: 'RoadResQ API is running 🚀',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth  (POST /register, POST /login)',
        jobs: '/api/jobs  (POST / GET / GET /:id / PUT /:id/accept / GET /available)',
        drivers: '/api/drivers  (PUT /status, GET /:id, PUT /:id/approve)',
        quotes: '/api/quotes  (POST /, GET /)',
      },
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/quotes', quoteRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ RoadResQ backend running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
