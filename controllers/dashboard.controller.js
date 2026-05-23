const prisma = require('../utils/prisma.util');
const { getMembersExpiringIn } = require('../utils/expiry.util');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const [total, active, expired, pending, revenueResult] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'EXPIRED' } }),
      prisma.member.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    // Monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = await prisma.payment.aggregate({
      where: { paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        totalMembers: total,
        activeMembers: active,
        expiredMembers: expired,
        pendingMembers: pending,
        totalRevenue: revenueResult._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/notifications
const getNotifications = async (req, res) => {
  try {
    const [expiring1, expiring3] = await Promise.all([
      getMembersExpiringIn(1),
      getMembersExpiringIn(3),
    ]);

    res.json({
      success: true,
      data: {
        expiringIn1Day: expiring1,
        expiringIn3Days: expiring3,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getNotifications };
