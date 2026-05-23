const prisma = require('../utils/prisma.util');

// POST /api/payments
const addPayment = async (req, res) => {
  try {
    const { memberId, amount, method, paymentDate } = req.body;
    if (!memberId || !amount)
      return res.status(400).json({ success: false, message: 'memberId and amount are required' });

    const id = parseInt(memberId);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid member ID' });

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member)
      return res.status(404).json({ success: false, message: 'Member not found' });

    const payment = await prisma.payment.create({
      data: {
        memberId: parseInt(memberId),
        amount: parseFloat(amount),
        method: method || 'CASH',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
      include: { member: { select: { id: true, name: true, phone: true } } },
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments
const getAllPayments = async (req, res) => {
  try {
    console.log('GET /payments hit');

    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      include: { member: true },
    });

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/:memberId
const getMemberPayments = async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ success: false, message: 'Invalid member ID' });

    // Members can only see their own payments
    if (req.user.role === 'member' && req.user.id !== memberId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const payments = await prisma.payment.findMany({
      where: { memberId },
      orderBy: { paymentDate: 'desc' },
      include: { member: { select: { id: true, name: true, phone: true } } },
    });

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/payments/:id
const updatePayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });

    const { amount, method, paymentDate } = req.body;

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        method: method || existing.method,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
      },
      include: { member: { select: { id: true, name: true, phone: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });

    await prisma.payment.delete({ where: { id } });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addPayment, getAllPayments, getMemberPayments, updatePayment, deletePayment };
