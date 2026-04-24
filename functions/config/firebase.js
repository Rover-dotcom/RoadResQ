/**
 * Firebase Admin — auto-detects Cloud Functions credentials (ADC).
 * No service account key needed when deployed.
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'roadresq-bd6b0' });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = admin.auth();

module.exports = { admin, db, auth };
