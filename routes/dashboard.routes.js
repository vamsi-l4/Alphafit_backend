const express = require('express');
const router = express.Router();
const { getDashboardStats, getNotifications } = require('../controllers/dashboard.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, authorizeAdmin, getDashboardStats);
router.get('/notifications', authenticate, authorizeAdmin, getNotifications);

module.exports = router;
