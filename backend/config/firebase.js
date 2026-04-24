/**
 * Firebase Admin SDK — RoadResQ
 *
 * Initialization strategy (in priority order):
 *
 * 1. Cloud Functions (deployed):
 *    Uses Application Default Credentials automatically — NO key file needed.
 *
 * 2. Local development with serviceAccountKey.json:
 *    Place file at: backend/config/serviceAccountKey.json
 *    Download from: Firebase Console → Project Settings → Service Accounts
 *
 * 3. Local development with environment variables:
 *    Set in backend/.env (see .env.example)
 */

const admin = require('firebase-admin');

const PROJECT_ID = 'roadresq-bd6b0';

if (!admin.apps.length) {
  // ── Strategy 1: Cloud Functions auto-credentials (deployed environment)
  // When running inside Cloud Functions, FUNCTION_NAME env var is set.
  // Admin SDK auto-detects service account from the Function's IAM role.
  if (process.env.FUNCTION_NAME || process.env.K_SERVICE) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });

  // ── Strategy 2: Local service account key file
  } else {
    let credential;

    try {
      const serviceAccount = require('./serviceAccountKey.json');
      credential = admin.credential.cert(serviceAccount);
      console.log('[Firebase] Using serviceAccountKey.json');
    } catch (_e) {
      // ── Strategy 3: Environment variables (.env)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        credential = admin.credential.cert({
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        console.log('[Firebase] Using environment variable credentials');
      } else {
        // Strategy 4: Application Default Credentials (gcloud auth, etc.)
        credential = admin.credential.applicationDefault();
        console.log('[Firebase] Using Application Default Credentials');
      }
    }

    admin.initializeApp({
      credential,
      projectId: PROJECT_ID,
    });
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Set Firestore to use the me-central1 (Doha, Qatar) database
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db, auth };
