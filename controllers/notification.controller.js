const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotificationsForUser(req.user);
        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id, 10);
        if (isNaN(notificationId)) return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        
        const notification = await notificationService.markNotificationRead(notificationId, req.user);
        res.json({ success: true, data: notification });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getNotifications, markNotificationRead };