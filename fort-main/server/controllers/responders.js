const { updateDatabase, readDatabase } = require('../helpers/firebaseConfig');
const asyncHandler = require('express-async-handler');
const { distanceBetween, geohashQueryBounds, geohashForLocation } = require('geofire-common');

// Find nearby responders
// This function finds nearby responders within a 5 km radius
// It requires the user's latitude and longitude
// It calculates the geohash bounds for the given radius
// It queries responders within the geohash range
// It calculates the actual distance between the user and responders
// It sorts responders by proximity and returns the list
// It handles errors and returns an error message with status code
const findNearbyResponders = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;
    const searchRadiusInKm = 5; // Search within 5 km

    if (!latitude || !longitude) {
        return res.sendError('Missing required fields', 400);
    }

    try {
        // Get geohash bounds for the given radius
        const bounds = geohashQueryBounds([latitude, longitude], searchRadiusInKm * 1000);
        
        let nearbyResponders = [];

        for (const [start, end] of bounds) {
            // Query responders within geohash range
            const responders = await readDatabase('responders');

            Object.keys(responders || {}).forEach((uid) => {
                const responder = responders[uid].location;
                if (!responder) return;

                const responderLat = responder.latitude;
                const responderLng = responder.longitude;
                const responderGeohash = responder.geohash;

                // Check if responder's geohash falls within bounds
                if (responderGeohash >= start && responderGeohash <= end) {
                    // Calculate actual distance
                    const dist = distanceBetween([latitude, longitude], [responderLat, responderLng]);

                    if (dist <= searchRadiusInKm) {
                        nearbyResponders.push({ uid, ...responder, distance: dist });
                    }
                }
            });
        }

        // Sort responders by proximity
        nearbyResponders.sort((a, b) => a.distance - b.distance);

        res.sendResponse('Nearby responders found', { responders: nearbyResponders });
    } catch (error) {
        console.error("Error finding nearby responders:", error);
        res.sendError('Failed to find responders', 500);
    }
});


// Update responder's location in Realtime Database
// This function updates the responder's location in the Realtime Database
// It requires the responder's UID, latitude, and longitude
// It generates a geohash and a timestamp for the location
// It returns a success message with the updated location details
// It handles errors and returns an error message with status code
const handleRespondersLocation = asyncHandler(async (req, res) => {
    const { uid } = req.user;  // Get responder ID from authenticated user
    const { latitude, longitude } = req.body;

    if (!uid || !latitude || !longitude) {
        return res.sendError('Missing required fields', 400);
    }

    const geohash = geohashForLocation([latitude, longitude]);  // Generate geohash
    const timestamp = Date.now();

    try {
        // Update responder's latest location in RTDB
        await updateDatabase(`responders/${uid}/location`, {
            deviceToken: req.user.deviceToken,
            geohash,
            timestamp
        });

        res.sendResponse('Responder location updated successfully', { uid, latitude, longitude, geohash, timestamp });
    } catch (error) {
        console.error("Error updating responder location:", error);
        res.sendError('Failed to update responder location', 500);
    }
});


module.exports = { handleRespondersLocation, findNearbyResponders };