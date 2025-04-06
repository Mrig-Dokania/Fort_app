const asyncHandler = require('express-async-handler');
const { setDocument, updateDatabase, readDocuments, readDatabase, sendNotification, db } = require('../helpers/firebaseConfig');
const { geohashForLocation } = require('geofire-common');
const { findNearbyResponders } = require('./responders'); // Import nearby responders function


// Trigger emergency
// This function triggers an emergency alert
// It requires the user's UID, latitude, and longitude
// It generates a geohash for the initial location
// It fetches trusted contacts from Firestore Profile collection
// It finds nearby responders within a 5 km radius
// It stores emergency details in Firestore and Realtime Database
// It sends FCM notifications to trusted contacts and nearby responders
// It returns a success message with the emergency ID and responders list
// It handles errors and returns an error message with status code
const handleTrigger = asyncHandler(async (req, res) => {
    try {
        // Destructure from request body
        const { latitude, longitude, uid } = req.body;

        // Basic validation
        if (!latitude || !longitude || !uid) {
            return res.status(400).json({ 
                status: "error",
                message: "Missing location data or user ID" 
            });
        }

        // Create emergency document
        const emergencyData = {
            uid,
            latitude,
            longitude,
            createdAt: new Date().toISOString()
        };

        // Save to Firestore
        await setDocument('emergencies', Date.now().toString(), emergencyData);

        // Success response
        res.status(201).json({
            status: "success",
            message: "Emergency triggered!",
            data: emergencyData
        });

    } catch (error) {
        console.error("Emergency error:", error);
        res.status(500).json({ 
            status: "error",
            message: "Failed to trigger emergency" 
        });
    }
});

const handlePush = asyncHandler(async (req, res) => {

    const { eid, latitude, longitude } = req.body;

    if (!eid || !latitude || !longitude) {
        return res.sendError('Missing required fields', 400);
    }

    const geohash = geohashForLocation([latitude, longitude]);
    const timestamp = Date.now();

    try {
        // Append new location to Realtime Database
        await updateDatabase(`emergencies/${eid}/locations`, {
            [timestamp]: { latitude, longitude, geohash }
        });

        // Fetch latest data from Realtime Database
        const emergencyData = await readDatabase(`emergencies/${eid}`);

        if (!emergencyData) {
            return res.sendError('Emergency data not found', 404);
        }

        res.sendResponse('Location updated successfully', emergencyData || {});
    } catch (error) {
        console.error(error);
        res.sendError('Failed to update location', 500);
    }

});

// Cancel emergency
// This function cancels an emergency alert
// It requires the emergency ID and passkey (real or fake)
// It verifies the passkey and updates the emergency status
// It sends FCM notifications to trusted contacts and responders
// It returns a success message with the updated emergency status
// It handles errors and returns an error message with status code
const handleCancel = asyncHandler(async (req, res) => {
    const { eid, passkey } = req.body;

    if (!eid || !passkey) {
        return res.sendError('Missing required fields', 400);
    }

    try {

        // Fetch emergency details from Firestore
        const emergencyDoc = await readDocuments('emergencies', { id: eid });
        if (!emergencyDoc) {

            if (storedFakePasskey  == passkey) {
                res.sendResponse('Trigger Emergency', { status: 'trigger' });
            }

            return res.sendError('Emergency not found', 404);
        }

        const userProfile = await readDocuments('profile', { id: emergencyDoc.userId });
        const storedRealPasskey = userProfile?.passkey?.real;
        const storedFakePasskey = userProfile?.passkey?.fake;

        

        // Fetch stored hashed passkeys from Firestore Profile collection
        let status, notificationTitle, notificationBody;

        if (storedRealPasskey && passkey == storedRealPasskey) {
            // Passkey is REAL → Cancel emergency
            status = "canceled";
            notificationTitle = "Emergency Resolved";
            notificationBody = "The user has verified their identity as safe. No further action required.";
        } else if (storedFakePasskey && passkey == storedFakePasskey) {
            // Passkey is FAKE → Escalate emergency
            status = "escalated";
            notificationTitle = "Emergency Escalated!";
            notificationBody = "The user failed identity verification. Immediate intervention needed!";
        } else {
            // Passkey does NOT match → Invalid request
            return res.sendError('Invalid passkey. Unable to verify identity.', 403);
        }

        // Update status in Firestore
        await db.collection('emergencies').doc(eid).update({ status });

        // Update status in Realtime Database
        await updateDatabase(`emergencies/${eid}`, { status });

        // Send notification to trusted contacts & responders
        const { trustedDeviceTokens = [], responderDeviceTokens = [] } = emergencyDoc;
        const deviceTokens = [...trustedDeviceTokens, ...responderDeviceTokens].filter(Boolean);

        if (deviceTokens.length > 0) {
            await sendNotification(deviceTokens, {
                title: notificationTitle,
                body: notificationBody,
                data: { eid, status }
            });
        }

        res.sendResponse(`Emergency ${status} successfully`, { eid, status });
    } catch (error) {
        console.error(error);
        res.sendError('Failed to update emergency status', 500);
    }
});

// Emergency Chat Handler
// This function handles sending chat messages during emergencies
// Stores messages in Realtime Database under emergencies/{eid}/chat

const handleChat = asyncHandler(async (req, res) => {
    const { eid } = req.params;
    const { message } = req.body;

    if (!eid || !message) {
        return res.status(400).json({
            status: "error",
            message: "Missing emergency ID or message"
        });
    }

    try {
        const chatPath = `emergencies/${eid}/chat/${Date.now()}`;
        await updateDatabase(chatPath, {
            sender: req.user.uid || "anonymous", // Mock user ID
            message: message.trim(),
            timestamp: Date.now()
        });

        res.status(201).json({
            status: "success",
            message: "Message sent",
            data: { eid }
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to send message"
        });
    }
});

//modifications made here
module.exports = {
    handleTrigger,
    handlePush,
    handleCancel,
    handleChat // Added this line here,
}

/*
const asyncHandler = require('express-async-handler');
const { setDocument } = require('../helpers/firebaseConfig');
const { updateDatabase } = require('../helpers/firebaseConfig');

// Simplified Emergency Trigger
const handleTrigger = asyncHandler(async (req, res) => {
    try {
        // Destructure from request body
        const { latitude, longitude, uid } = req.body;

        // Basic validation
        if (!latitude || !longitude || !uid) {
            return res.status(400).json({ 
                status: "error",
                message: "Missing location data or user ID" 
            });
        }

        // Create emergency document
        const emergencyData = {
            uid,
            latitude,
            longitude,
            createdAt: new Date().toISOString()
        };

        // Save to Firestore
        await setDocument('emergencies', Date.now().toString(), emergencyData);

        // Success response
        res.status(201).json({
            status: "success",
            message: "Emergency triggered!",
            data: emergencyData
        });

    } catch (error) {
        console.error("Emergency error:", error);
        res.status(500).json({ 
            status: "error",
            message: "Failed to trigger emergency" 
        });
    }
});

// Emergency Chat Handler
const handleChat = asyncHandler(async (req, res) => {
    const { eid } = req.params;
    const { message } = req.body;

    if (!eid || !message) {
        return res.status(400).json({ 
            status: "error",
            message: "Missing emergency ID or message" 
        });
    }

    try {
        const chatPath = `emergencies/${eid}/chat/${Date.now()}`;
        await updateDatabase(chatPath, {
            sender: req.user.uid,
            message: message.trim(),
            timestamp: Date.now()
        });
        
        res.status(201).json({ 
            status: "success", 
            message: "Message sent",
            data: { eid }
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ 
            status: "error",
            message: "Failed to send message" 
        });
    }
});

module.exports = {
    handleTrigger,
    handleChat 
  };
*/ 