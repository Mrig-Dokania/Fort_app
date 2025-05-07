const express = require('express')

const { handleAuth, handleProfile } = require('../controllers/auth')

const router = express.Router()

router.post('/', handleAuth)
router.put('/', handleProfile)
//modifications yaha se

// Profile management
router.get('/profile', handleProfile.getProfile);
router.post('/profile', handleProfile.updateProfile);

router.get('/test', (req, res) => {
    res.send('Backend connected successfully!');
})
// yaha tak
module.exports = router