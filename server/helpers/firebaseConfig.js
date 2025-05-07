const admin = require("firebase-admin");

// Load Firebase credentials
const serviceAccount = require("../credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fort-ff383-default-rtdb.asia-southeast1.firebasedatabase.app/", // Replace with your actual Firebase RTDB URL
});

const db = admin.firestore();
const rtdb = admin.database(); // Initialize Realtime Database

// Firestore: Create or Update a Document
const setDocument = async (collectionName, docId, data) => {
    try {
        await db.collection(collectionName).doc(docId).set(data, { merge: true });
        console.log(`Document ${docId} set in ${collectionName}`);
    } catch (error) {
        console.error("Error setting document:", error);
        throw error;
    }
};

// Firestore: Read Documents
const readDocuments = async (collectionName, options = {}) => {
    const { id } = options;
    try {
        if (id) {
            const docRef = db.collection(collectionName).doc(id);
            const docSnap = await docRef.get();
            return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
        }

        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error reading documents:", error);
        throw error;
    }
};

// Firestore: Delete a Document
const deleteDocument = async (collectionName, docId) => {
    try {
        await db.collection(collectionName).doc(docId).delete();
        console.log(`Document ${docId} deleted from ${collectionName}`);
    } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
    }
};

// Realtime Database: Update or Set Data
const updateDatabase = async (path, data) => {
    try {
        await rtdb.ref(path).update(data);
        console.log(`Updated data at path: ${path}`);
    } catch (error) {
        console.error("Error updating database:", error);
        throw error;
    }
};

// Realtime Database: Set Data (Overwrites existing data)
const setDatabase = async (path, data) => {
    try {
        await rtdb.ref(path).set(data);
        console.log(`Set data at path: ${path}`);
    } catch (error) {
        console.error("Error setting database:", error);
        throw error;
    }
};

const sendNotification = async (deviceTokens, messagePayload) => {
    if (!deviceTokens || deviceTokens.length === 0) {
        console.log("No device tokens available for notification.");
        return;
    }

    const message = {
        notification: {
            title: messagePayload.title,
            body: messagePayload.body,
        },
        data: messagePayload.data || {}, // Optional additional data
        tokens: deviceTokens, // Multicast (send to multiple devices)
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(`FCM Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    } catch (error) {
        console.error("Error sending FCM notification:", error);
    }
};

const readDatabase = async (path) => {
    try {
        const snapshot = await admin.database().ref(path).once("value");
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error("Error reading from Realtime Database:", error);
        throw error;
    }
};

module.exports = {
    db,
    rtdb,
    setDocument,
    readDocuments,
    deleteDocument,
    updateDatabase,
    setDatabase,
    readDatabase,
    sendNotification,
};
