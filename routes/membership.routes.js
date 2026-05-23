const express = require('express');
const router = express.Router();
const { checkMembershipExpiry } = require('../controllers/expiry.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/expiry-check', authenticate, checkMembershipExpiry);

module.exports = router;
