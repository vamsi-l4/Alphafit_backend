const express = require('express');
const router = express.Router();
const {
  addMember, getAllMembers, getMemberById,
  updateMember, deleteMember, getMemberProfile, getDashboardData, updatePhoto
} = require('../controllers/member.controller');
const { authenticate, authorizeAdmin, authorizeMember } = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware'); // Upload middleware already configured

// Member self-route (must come before /:id)
router.get('/profile', authenticate, authorizeMember, getMemberProfile);
router.get('/dashboard', authenticate, authorizeMember, getDashboardData);
router.put('/photo', authenticate, authorizeMember, uploadMiddleware, updatePhoto);

// Admin-only routes
router.post('/', authenticate, authorizeAdmin, addMember);
router.get('/', authenticate, authorizeAdmin, getAllMembers);
router.get('/:id', authenticate, authorizeAdmin, getMemberById);
router.put('/:id', authenticate, authorizeAdmin, updateMember);
router.delete('/:id', authenticate, authorizeAdmin, deleteMember);

module.exports = router;
