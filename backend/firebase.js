const admin = require('firebase-admin');
const serviceAccount = require('./services/serviceAccountKey.json'); // Path to your service account key

// Initialize Firebase Admin SDK for both Storage and Firestore
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),  // Use service account credentials
    storageBucket: "dirent-bec6b.appspot.com",      // Your Firebase Storage bucket name
    databaseURL: 'https://dirent-bec6b.firebaseio.com',  // Your Firestore Database URL
});

// Get Firebase Firestore instance
const firestore = admin.firestore();

// Get Firebase Storage bucket instance
const bucket = admin.storage().bucket();

module.exports = { firestore, bucket };
