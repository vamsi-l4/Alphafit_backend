const prisma = require('../utils/prisma.util');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    // Admin sees global notifications (userId: null), Members see specific ones
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT or PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNotifications, markAsRead };