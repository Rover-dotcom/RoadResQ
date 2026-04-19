const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin SDK initialization.
 * Uses serviceAccountKey.json placed in backend/config/
 *
 * To get your key:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

let serviceAccount;

try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  // Fallback: build credentials from individual environment variables
  // (useful for CI/CD / deployment without file)
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'roadresq-bd6b0',
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
