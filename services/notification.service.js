const prisma = require('../utils/prisma.util');

const isDuplicateNotification = async ({ userId = null, title, message, type }) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const count = await prisma.notification.count({
            where: {
                title,
                message,
                type,
                userId,
                createdAt: {
                    gte: todayStart,
                },
            },
        });

        return count > 0;
    } catch (err) {
        console.error('[notification] isDuplicateNotification error:', err.message);
        return false;
    }
};

const createNotification = async ({ userId = null, title, message, type = 'membership' }) => {
    try {
        const duplicate = await isDuplicateNotification({ userId, title, message, type });
        if (duplicate) return null;

        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                // prisma model fields: isRead, createdAt
                // (we rely on defaults for isRead/createdAt)
            },
        });
    } catch (err) {
        console.error('[notification] createNotification error:', err.message);
        return null;
    }
};

const getNotificationsForUser = async (user) => {
    try {
        const where = user.role === 'admin'
            ? { OR: [{ userId: null }, { userId: user.id }] }
            : { userId: user.id };

        return await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    } catch (err) {
        console.error('[notification] getNotificationsForUser error:', err.message);
        return [];
    }
};

const markNotificationRead = async (id, user) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        if (user.role === 'admin') {
            if (notification.userId !== null && notification.userId !== user.id) {
                throw new Error('Notification not available for admin');
            }
        } else if (notification.userId !== user.id) {
            throw new Error('Notification not available for this member');
        }

        return await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    } catch (err) {
        console.error('[notification] markNotificationRead error:', err.message);
        throw err;
    }
};

module.exports = {
    createNotification,
    getNotificationsForUser,
    markNotificationRead,
};
