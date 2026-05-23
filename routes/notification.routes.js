const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.patch('/:id/read', authenticate, markAsRead); // Bulletproof fallback

module.exports = router;