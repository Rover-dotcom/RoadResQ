/**
 * Firebase Cloud Functions — RoadResQ
 *
 * This wraps the Express backend (backend/server.js) as a
 * Firebase HTTPS Cloud Function.
 *
 * Deployed URL: https://us-central1-roadresq-bd6b0.cloudfunctions.net/api
 *
 * To deploy: firebase deploy --only functions
 * To test locally: firebase emulators:start --only functions
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set function region to me-central1 — Doha, Qatar (boss requirement)
setGlobalOptions({
  region: 'me-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
});

// Import the Express app — same app used locally
const app = require('../backend/server');

/**
 * Main API function — all endpoints available at /api/*
 * 
 * Examples:
 *   POST https://asia-southeast1-roadresq-bd6b0.cloudfunctions.net/api/api/auth/register
 *   GET  https://asia-southeast1-roadresq-bd6b0.cloudfunctions.net/api/api/jobs
 *   POST https://asia-southeast1-roadresq-bd6b0.cloudfunctions.net/api/api/jobs
 */
exports.api = onRequest(
  {
    cors: true,
    invoker: 'public', // Allow unauthenticated requests (JWT handled by app layer)
  },
  app
);
