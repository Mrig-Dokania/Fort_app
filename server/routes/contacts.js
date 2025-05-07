const express = require('express');

const router = express.Router()

const { handleAccept, handleRequest, handleReject } = require('../controllers/contacts');

const { handleContacts } = require('../controllers/contacts')

router.get('/', handleContacts.getContacts)
router.post('/', handleContacts.addContact)
router.delete('/', handleContacts.removeContact)

router.post('/request', handleRequest)
router.post('/accept', handleAccept)
router.post('/reject', handleReject)

module.exports = router