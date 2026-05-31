const prisma = require('../utils/prisma.util');
const { updateExpiredMembers } = require('../utils/expiry.util');
const { createNotification } = require('./notification.service');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getDaysLeft = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - now) / MS_PER_DAY);
};

const getStartOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const getEndOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
};

const buildMemberMessage = (member, daysLeft) => {
    if (daysLeft === 0) return `${member.name} membership expires today`;
    if (daysLeft === 1) return `${member.name} membership expires in 1 day`;
    if (daysLeft > 1) return `${member.name} membership expires in ${daysLeft} days`;

    const expiredDays = Math.abs(daysLeft);
    if (expiredDays === 1) return `${member.name} membership expired yesterday`;
    return `${member.name} membership expired ${expiredDays} days ago`;
};

const buildClientMessage = (daysLeft, status) => {
    if (status === 'EXPIRED') {
        return 'Your membership has expired. Contact gym administration.';
    }
    if (daysLeft === 1) {
        return 'Your membership expires in 1 day';
    }
    if (daysLeft > 1 && daysLeft <= 2) {
        return `Your membership expires in ${daysLeft} days`;
    }
    if (daysLeft > 2 && daysLeft <= 7) {
        return `Your membership expires in ${daysLeft} days`;
    }
    return null;
};

const getMembersWithinWindow = async (fromDate, toDate) => {
    return prisma.member.findMany({
        where: {
            expiryDate: {
                gte: fromDate,
                lte: toDate,
            },
            status: { not: 'EXPIRED' },
        },
        select: {
            id: true,
            name: true,
            expiryDate: true,
            status: true,
        },
        orderBy: { expiryDate: 'asc' },
    });
};

const getRecentlyExpiredMembers = async (fromDate, toDate) => {
    return prisma.member.findMany({
        where: {
            expiryDate: {
                gte: fromDate,
                lt: toDate,
            },
            status: 'EXPIRED',
        },
        select: {
            id: true,
            name: true,
            expiryDate: true,
            status: true,
        },
        orderBy: { expiryDate: 'desc' },
    });
};

const formatNotificationObject = (member, daysLeft) => ({
    id: member.id,
    name: member.name,
    daysLeft,
    expiryDate: member.expiryDate,
    status: member.status,
});

const generateExpiryNotifications = async () => {
    await updateExpiredMembers();

    const todayStart = getStartOfDay(new Date());
    const todayEnd = getEndOfDay(new Date());

    const twoDaysStart = new Date(todayStart.getTime() + 2 * MS_PER_DAY);
    const twoDaysEnd = new Date(todayEnd.getTime() + 2 * MS_PER_DAY);

    // Exactly 2 days before expiry (Only fires once)
    const expiringIn2 = await prisma.member.findMany({
        where: {
            expiryDate: {
                gte: twoDaysStart,
                lte: twoDaysEnd,
            },
            status: { not: 'EXPIRED' },
        },
        select: { id: true, name: true, expiryDate: true, status: true },
    });

    // Exactly on the day of expiry (Only fires once)
    const expiringToday = await prisma.member.findMany({
        where: {
            expiryDate: {
                gte: todayStart,
                lte: todayEnd,
            }
        },
        select: { id: true, name: true, expiryDate: true, status: true },
    });

    const promises = [];

    expiringIn2.forEach((member) => {
        const title = `Membership notice: ${member.name}`;
        const messageAdmin = `${member.name} membership expires in 2 days`;
        const messageMember = `Your membership expires in 2 days`;
        const type = 'expiring_2_days';
        
        promises.push(createNotification({ userId: member.id, title: 'Membership Expiry', message: messageMember, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
        promises.push(createNotification({ userId: null, title, message: messageAdmin, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
    });

    expiringToday.forEach((member) => {
        const title = `Membership expired: ${member.name}`;
        const messageAdmin = `${member.name} membership has expired today`;
        const messageMember = `Your membership has expired today. Please renew.`;
        const type = 'expired';
        
        promises.push(createNotification({ userId: member.id, title: 'Membership Expired', message: messageMember, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
        promises.push(createNotification({ userId: null, title, message: messageAdmin, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
    });

    await Promise.allSettled(promises);
};

const getMemberExpiryView = async (memberId) => {
    const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
            id: true,
            name: true,
            phone: true,
            joinDate: true,
            planDuration: true,
            expiryDate: true,
            status: true,
            payments: { orderBy: { paymentDate: 'desc' } },
        },
    });

    if (!member) {
        throw new Error('Member not found');
    }

    const daysLeft = getDaysLeft(member.expiryDate);
    const alert = buildClientMessage(daysLeft, member.status);

    return {
        ...member,
        daysLeft,
        alert,
    };
};

const getAdminExpirySummary = async () => {
    const today = getStartOfDay(new Date());
    const twoDays = getEndOfDay(new Date(today.getTime() + 2 * MS_PER_DAY));
    const sevenDays = getEndOfDay(new Date(today.getTime() + 7 * MS_PER_DAY));

    const expiringIn2 = await getMembersWithinWindow(today, twoDays);
    const expiringIn7 = await getMembersWithinWindow(
        getStartOfDay(new Date(today.getTime() + 3 * MS_PER_DAY)),
        sevenDays,
    );
    const alreadyExpired = await getRecentlyExpiredMembers(
        new Date(today.getTime() - 7 * MS_PER_DAY),
        today,
    );

    return {
        expiringIn2Days: expiringIn2.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
        expiringIn7Days: expiringIn7.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
        alreadyExpired: alreadyExpired.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
    };
};

module.exports = {
    generateExpiryNotifications,
    getMemberExpiryView,
    getAdminExpirySummary,
};
