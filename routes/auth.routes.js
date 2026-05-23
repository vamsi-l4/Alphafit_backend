const express = require('express');
const router = express.Router();
const { adminLogin, memberLogin, registerMember } = require('../controllers/auth.controller');

/**
 * Auth Routes
 */
router.post('/admin-login', adminLogin);
router.post('/member-login', memberLogin);
router.post('/register-member', registerMember);

module.exports = router;