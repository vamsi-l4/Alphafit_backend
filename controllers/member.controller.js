const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma.util');

// POST /api/members
const addMember = async (req, res) => {
  try {
    const { name, phone, password, planDuration, joinDate } = req.body;
    if (!name || !phone || !password || !planDuration)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (!prisma || !prisma.member) {
      console.error('[addMember] Prisma client is not initialized or `member` model missing', { prismaDefined: !!prisma });
      return res.status(500).json({ success: false, message: 'Database client not available' });
    }

    const existing = await prisma.member.findUnique({ where: { phone } });
    if (existing)
      return res.status(409).json({ success: false, message: 'Phone already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const join = joinDate ? new Date(joinDate) : new Date();
    const expiry = new Date(join);
    
    const duration = parseInt(planDuration);
    if (isNaN(duration)) return res.status(400).json({ success: false, message: 'Invalid plan duration' });
    expiry.setDate(expiry.getDate() + duration);

    const now = new Date();
    const status = expiry < now ? 'EXPIRED' : 'ACTIVE';

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        password: hashed,
        planDuration: duration,
        joinDate: join,
        expiryDate: expiry,
        status,
      },
    });

    // 1. Notify Admin globally
    await prisma.notification.create({
      data: {
        title: 'New Member Registered',
        message: `${name} has been successfully registered for a ${duration}-day plan.`,
        type: 'MEMBER_REGISTERED'
      }
    });

    // 2. Notify the specific Member
    await prisma.notification.create({
      data: {
        userId: member.id,
        title: 'Welcome to Alpha Fit!',
        message: `Hi ${name}, your membership is now active! Get ready to train like an Alpha.`,
        type: 'WELCOME'
      }
    });

    const { password: _, ...memberData } = member;
    res.status(201).json({ success: true, data: memberData });
  } catch (err) {
    console.error('[addMember] Error creating member:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members
const getAllMembers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const members = await prisma.member.findMany({
      where,
      select: {
        id: true, name: true, phone: true, joinDate: true,
        planDuration: true, expiryDate: true, status: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members/:id
const getMemberById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid member ID' });
    
    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true, name: true, phone: true, joinDate: true,
        planDuration: true, expiryDate: true, status: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!member)
      return res.status(404).json({ success: false, message: 'Member not found' });

    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/members/:id
const updateMember = async (req, res) => {
  try {
    const { name, phone, password, planDuration, joinDate, status } = req.body;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid member ID' });

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ success: false, message: 'Member not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (status) updateData.status = status;

    // Recalculate expiry if plan or joinDate changed
    const newDuration = planDuration ? parseInt(planDuration) : existing.planDuration;
    const newJoin = joinDate ? new Date(joinDate) : existing.joinDate;

    if (planDuration || joinDate) {
      const expiry = new Date(newJoin);
      expiry.setDate(expiry.getDate() + newDuration);
      updateData.planDuration = newDuration;
      updateData.joinDate = newJoin;
      updateData.expiryDate = expiry;
      if (!status) {
        updateData.status = expiry < new Date() ? 'EXPIRED' : 'ACTIVE';
      }
    }

    const updated = await prisma.member.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, phone: true, joinDate: true,
        planDuration: true, expiryDate: true, status: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/members/:id
const deleteMember = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid member ID' });
    
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ success: false, message: 'Member not found' });

    await prisma.member.delete({ where: { id } });
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members/profile  (member self)
const getMemberProfile = async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true, joinDate: true,
        planDuration: true, expiryDate: true, status: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!member)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members/dashboard
const getDashboardData = async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.user.id },
      select: {
        name: true,
        expiryDate: true,
        photo: true
      }
    });

    if (!member) return res.status(404).json({ message: "Member not found" });

    const today = new Date();
    const expiry = new Date(member.expiryDate);
    const diffTime = expiry - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let alert = null;
    if (daysLeft === 1) alert = "Expires tomorrow";
    else if (daysLeft <= 3 && daysLeft > 0) alert = `Expires in ${daysLeft} days`;

    res.json({ success: true, ...member, daysLeft, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching dashboard" });
  }
};

// PUT /api/members/photo
const updatePhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const filePath = `/uploads/${req.file.filename}`;
  try {
    await prisma.member.update({ where: { id: req.user.id }, data: { photo: filePath } });
    res.json({ success: true, photo: filePath });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

module.exports = { addMember, getAllMembers, getMemberById, updateMember, deleteMember, getMemberProfile, getDashboardData, updatePhoto };
