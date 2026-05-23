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
    if (daysLeft > 1 && daysLeft <= 3) {
        return `Your membership expires in ${daysLeft} days`;
    }
    if (daysLeft > 3 && daysLeft <= 7) {
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

    const today = getStartOfDay(new Date());
    const threeDays = getEndOfDay(new Date(today.getTime() + 3 * MS_PER_DAY));
    const sevenDays = getEndOfDay(new Date(today.getTime() + 7 * MS_PER_DAY));
    const tomorrow = getStartOfDay(new Date(today.getTime() + MS_PER_DAY));
    const fourDays = getStartOfDay(new Date(today.getTime() + 4 * MS_PER_DAY));

    const expiringIn3 = await getMembersWithinWindow(today, threeDays);
    const expiringIn7 = await getMembersWithinWindow(fourDays, sevenDays);
    const recentlyExpired = await getRecentlyExpiredMembers(
        new Date(today.getTime() - 7 * MS_PER_DAY),
        today,
    );

    const promises = [];

    expiringIn3.forEach((member) => {
        const daysLeft = getDaysLeft(member.expiryDate);
        const title = `Membership notice: ${member.name}`;
        const message = buildMemberMessage(member, daysLeft);
        const type = daysLeft <= 3 ? 'expiring_3_days' : 'expiring_7_days';
        promises.push(createNotification({ userId: member.id, title: 'Membership Expiry', message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
        promises.push(createNotification({ userId: null, title, message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
    });

    expiringIn7.forEach((member) => {
        const daysLeft = getDaysLeft(member.expiryDate);
        const title = `Membership notice: ${member.name}`;
        const message = buildMemberMessage(member, daysLeft);
        const type = 'expiring_7_days';
        promises.push(createNotification({ userId: member.id, title: 'Membership Expiry', message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
        promises.push(createNotification({ userId: null, title, message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
    });

    recentlyExpired.forEach((member) => {
        const daysLeft = getDaysLeft(member.expiryDate);
        const title = `Membership expired: ${member.name}`;
        const message = buildMemberMessage(member, daysLeft);
        const type = 'expired';
        promises.push(createNotification({ userId: member.id, title: 'Membership Expired', message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
        promises.push(createNotification({ userId: null, title, message, type }).catch((e) => console.error('[expiry] createNotification error:', e.message)));
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
    const threeDays = getEndOfDay(new Date(today.getTime() + 3 * MS_PER_DAY));
    const sevenDays = getEndOfDay(new Date(today.getTime() + 7 * MS_PER_DAY));

    const expiringIn3 = await getMembersWithinWindow(today, threeDays);
    const expiringIn7 = await getMembersWithinWindow(
        getStartOfDay(new Date(today.getTime() + 4 * MS_PER_DAY)),
        sevenDays,
    );
    const alreadyExpired = await getRecentlyExpiredMembers(
        new Date(today.getTime() - 7 * MS_PER_DAY),
        today,
    );

    return {
        expiringIn3Days: expiringIn3.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
        expiringIn7Days: expiringIn7.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
        alreadyExpired: alreadyExpired.map((member) => formatNotificationObject(member, getDaysLeft(member.expiryDate))),
    };
};

module.exports = {
    generateExpiryNotifications,
    getMemberExpiryView,
    getAdminExpirySummary,
};
