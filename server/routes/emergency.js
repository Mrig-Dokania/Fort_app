const express = require('express');

const router = express.Router();

const { handleTrigger, handlePush, handleCancel, handleChat } = require('../controllers/emergency');
//const { handleTrigger } = require('../controllers/emergency');
//const { handleChat } = require('../controllers/emergency');

router.post('/:eid/chat', handleChat);// chat route defined here

router.post('/trigger', handleTrigger);
router.post('/push', handlePush);
router.post('/cancel', handleCancel);
//router.post('/:eid/chat', handleChat);

module.exports = router;

// chat msg is tarah stored rhega [frtd]
// emergencies/{eid}/chat/{timestamp}
//├── sender: "user123"
//├── message: "Help is on the way!"
//└── timestamp: 1711872000000