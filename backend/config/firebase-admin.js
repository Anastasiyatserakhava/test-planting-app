const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'test-project-torque-80a3cd7a324c.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

module.exports = admin;