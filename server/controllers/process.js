const axios = require('axios')
const { setDocument } = require("../helpers/firebaseConfig")
const geofire = require('geofire-common');
const asyncHandler = require("express-async-handler")
const { searchCrimesRadius } = require('../helpers/maps')

const getSafetyScore = async (route) => {
    return Math.floor(Math.random() * 100) // Mock safety score (0-100)
}

// Handle crimes
// This function adds a crime report to the database
// It requires the latitude, longitude, crime type, and severity of the crime
// It calculates the geohash code for the location and adds the report to the database
const handleCrimes = asyncHandler(async (req, res) => {
    try {
        const { latitude, longitude, crime_type, severity, title } = req.body;

        if (!latitude || !longitude || !crime_type || !severity || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Compute the geohash using geofire-common
        const geohash = geofire.geohashForLocation([latitude, longitude]);

        const report = {
            latitude,
            longitude,
            geohash,
            crime_type,
            severity,
            title,
            timestamp: Date.now(),
        };

        await setDocument("crimes", report);
        res.sendResponse("crime_added", report);
    } catch (error) {
        console.error("Error adding crime:", error);
        res.sendError("error_adding_crime", 500);
    }
});

// Handle routes
// This function fetches routes from the Google Routes API
// It then calculates the safety score for each route
// Finally, it filters the routes based on the safety score
const handleRoutes = asyncHandler( async (req, res) => {
    try {
        const { origin, destination } = req.body
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required.' })
        }

        try {
            const response = await axios({
                method: 'POST',
                url: `https://routes.googleapis.com/directions/v2:computeRoutes`,
                headers: { 
                    'X-Goog-Api-Key': process.env.ROUTES_KEY, 
                    'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline', 
                    'Content-Type': 'application/json' 
                },
                data: {
                    origin,
                    destination,
                    travelMode: 'DRIVE',
                    routingPreference: "TRAFFIC_AWARE",
                    computeAlternativeRoutes: true,
                    languageCode: "en-US",
                }
            })

            let routes = response.data.routes
            if (!routes || routes.length === 0) {
                return res.status(404).json({ error: 'No routes found' })
            }

            // // Get safety scores for each route
            // for (let route of routes) {
            //     route.safetyScore = await getSafetyScore(route)
            // }

            // Filter safest routes based on threshold
            // const safeRoutes = routes.filter(route => route.safetyScore >= 50)

            res.sendResponse('routes_fetched', routes)
        } catch (error) {
            console.log(error.message)
            res.sendError(error.message, 500)
        }
    } catch (error) {
        console.error(error.message)
        res.sendError('error_fetching_routes', 500)
    }
})

// Handle Crimes Search
const handleCrimesSearch = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Missing coordinates' });
    }

    try {
        const crimes = await searchCrimesRadius(parseFloat(latitude), parseFloat(longitude));
        res.sendResponse('crimes_found', crimes);
    } catch (error) {
        console.error("Error searching crimes:", error);
        res.status(500).json({ error: error.message });
    }
});


// Modifications made here
// Handle OCR Scan
// This function saves scanned vehicle details to Firestore with a 12-hour expiry
const handleOCRScan = asyncHandler(async (req, res) => {
    const { details, expiresAt } = req.body;

    if (!details || !expiresAt) {
        return res.status(400).json({
            status: "error",
            message: "Missing required fields (details or expiresAt)"
        });
    }

    try {
        // Create document in Firestore
        const docId = Date.now().toString(); // Use timestamp as document ID
        await setDocument('ocr_scans', docId, {
            details,
            expiresAt,
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({
            status: "success",
            message: "OCR data saved successfully",
            data: { id: docId, details, expiresAt },
        });
    } catch (error) {
        console.error("Error saving OCR data:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to save OCR data"
        });
    }
});


const handleMigration = asyncHandler( async (req, res) => {
    try {
        const now = Date.now();
        const twelveHoursInMillis = 12 * 60 * 60 * 1000;

        // Fetch emergencies that are not migrated
        const emergencies = await readDocuments("emergencies");

        // Filter emergencies that are older than 12 hours and not migrated
        const emergenciesToMigrate = emergencies.filter(emergency => 
            !emergency.migrated && emergency.createdAt <= now - twelveHoursInMillis
        );

        for (const emergency of emergenciesToMigrate) {
            const { id: eid } = emergency;

            // Fetch chat data from Realtime Database
            const chatData = await readDatabase(`emergencies/${eid}/chat`);

            if (chatData) {
                // Update Firestore with chat data and mark as migrated
                await setDocument("emergencies", eid, {
                    chat: chatData,
                    migrated: true
                });

                console.log(`Migrated chat data for emergency: ${eid}`);
            } else {
                console.log(`No chat data found for emergency: ${eid}`);
            }
        }

        res.sendResponse('migration_completed', { migratedCount: emergenciesToMigrate.length });

    } catch (error) {
        console.error("Error during migration:", error);
        res.sendError('migration_failed', 500);
    }
});

module.exports = {
    handleRoutes,
    handleCrimes,
    handleCrimesSearch,
    handleOCRScan, // Added this line for ocr scan
    handleMigration
}
