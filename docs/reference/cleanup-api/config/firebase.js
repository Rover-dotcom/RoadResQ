const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "your-project-id.appspot.com" // Found in Firebase Storage tab
});

const bucket = admin.storage().bucket();

module.exports = { bucket };