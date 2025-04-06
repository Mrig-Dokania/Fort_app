const geofire = require('geofire-common');
const { db } = require('../helpers/firebaseConfig');

const searchCrimesRadius = async (centerLat, centerLng, radiusInM = 1000) => {
    const center = [centerLat, centerLng];
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    const promises = [];

    for (const b of bounds) {
        const q = db.collection('crimes')
            .orderBy('geohash')
            .startAt(b[0])
            .endAt(b[1]);

        promises.push(q.get());
    }

    const snapshots = await Promise.all(promises);
    const matchingCrimes = [];

    for (const snap of snapshots) {
        for (const doc of snap.docs) {
            const data = doc.data();
            const location = [data.latitude, data.longitude];
            const distanceInM = geofire.distanceBetween(location, center) * 1000;
            if (distanceInM <= radiusInM) {
                matchingCrimes.push({ id: doc.id, ...data, distanceInM });
            }
        }
    }

    // Sort by distance
    matchingCrimes.sort((a, b) => a.distanceInM - b.distanceInM);

    return matchingCrimes;
};

module.exports = {
    searchCrimesRadius
}