const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma.util');
const { generateExpiryNotifications } = require('../services/membershipExpiry.service');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: 'Phone and password required' });

    // 1. Check secure fixed admin credentials from .env first
    if (
      process.env.ADMIN_PHONE &&
      process.env.ADMIN_PASSWORD &&
      phone === process.env.ADMIN_PHONE &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const name = process.env.ADMIN_NAME || 'Admin';
      
      // Ensure this super-admin actually exists in the DB so that page refreshes/auth middlewares work perfectly
      let superAdmin = await prisma.admin.findUnique({ where: { phone } });
      if (!superAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        superAdmin = await prisma.admin.create({
          data: {
            name,
            phone,
            password: hashedPassword
          }
        });
      }

      const token = generateToken({ id: superAdmin.id, phone: superAdmin.phone, role: 'admin', name: superAdmin.name });
      
      try {
        generateExpiryNotifications().catch(e => console.error('[STARTUP] Background expiry sync failed:', e.message));
      } catch (expiryError) {
        console.error('[LOGIN] Admin expiry sync failed:', expiryError.message);
      }
      return res.json({ success: true, token, user: { id: superAdmin.id, phone: superAdmin.phone, name: superAdmin.name, role: 'admin' } });
    }

    // 2. Fallback to Database Admin check (for secondary admins)
    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (!admin)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken({ id: admin.id, phone: admin.phone, role: 'admin', name: admin.name });
    res.json({ success: true, token, user: { id: admin.id, phone: admin.phone, name: admin.name, role: 'admin' } });

    // Run background tasks without awaiting them to prevent response delays
    try {
      generateExpiryNotifications().catch(e => console.error('[STARTUP] Background expiry sync failed:', e.message));
    } catch (expiryError) {
      console.error('[LOGIN] Admin expiry sync failed:', expiryError.message);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/member-login
const memberLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: 'Phone and password required' });

    const member = await prisma.member.findUnique({ where: { phone } });
    if (!member)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, member.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken({ id: member.id, phone: member.phone, role: 'member', name: member.name });
    res.json({
      success: true,
      token,
      user: { id: member.id, phone: member.phone, name: member.name, role: 'member' },
    });
    try {
      await generateExpiryNotifications();
    } catch (expiryError) {
      console.error('[LOGIN] Member expiry sync failed:', expiryError.message);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/register-member
const registerMember = async (req, res) => {
  try {
    const { name, phone, password, planDuration } = req.body;

    if (!name || !phone || !password || !planDuration) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Generate bcrypt hash for the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calculate expiry date
    const joinDate = new Date();
    const expiryDate = new Date();
    
    const duration = parseInt(planDuration);
    if (isNaN(duration)) return res.status(400).json({ success: false, message: 'Invalid plan duration' });
    expiryDate.setDate(joinDate.getDate() + duration);

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        planDuration: duration,
        joinDate,
        expiryDate,
        status: 'ACTIVE'
      }
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

    const token = generateToken({ id: member.id, phone: member.phone, role: 'member', name: member.name });
    res.status(201).json({
      success: true,
      token,
      user: { id: member.id, phone: member.phone, name: member.name, role: 'member' }
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { adminLogin, memberLogin, registerMember };
