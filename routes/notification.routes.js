const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markNotificationRead);

module.exports = router;
