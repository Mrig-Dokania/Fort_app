const express = require('express');

const router = express.Router();

const { handleRespondersLocation } = require('../controllers/responders');

router.post('/location', handleRespondersLocation);

module.exports = router;