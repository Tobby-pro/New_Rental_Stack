const admin = require('firebase-admin');
const serviceAccount = require('./services/serviceAccountKey.json'); // Path to your service account key

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://dirent-bec6b.appspot.com",
    databaseURL: 'https://<your-project-id>.firebaseio.com',
});

// Get Firestore instance
const firestore = admin.firestore();

// Function to delete all documents in a collection
async function deleteCollection(collectionPath) {
    const collectionRef = firestore.collection(collectionPath);
    const snapshot = await collectionRef.get();

    snapshot.forEach(async (doc) => {
        await doc.ref.delete();
        console.log(`Deleted document: ${doc.id}`);
    });
}

// Delete all documents in a specific collection
deleteCollection('messages')  // Replace 'messages' with your collection name
    .then(() => console.log('All documents deleted!'))
    .catch((error) => console.error('Error deleting documents:', error));
