const express = require('express')
//const { handleRoutes, handleCrimes, handleCrimesSearch, handleOCRScan, handleMigration } = require('../controllers/process')
// idk, don't even ask the difference b/w both, for some reason, upper one desired results nahi diiya
const { 
    handleRoutes, 
    handleCrimes, 
    handleCrimesSearch, 
    handleOCRScan, // Add this for ocr
    handleMigration 
  } = require('../controllers/process');

const router = express.Router()

// router.get('/', handleRoutes)

router.post('/routes', handleRoutes)

router.route('/crimes')
    .get(handleCrimesSearch)
    .post(handleCrimes)

router.post('/ocr-scan', handleOCRScan)
router.post('/migration', handleMigration)

module.exports = router
