const express = require('express');
const router = express.Router();
const { addPayment, getAllPayments, getMemberPayments, updatePayment, deletePayment } = require('../controllers/payment.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

router.post('/payments', authenticate, authorizeAdmin, addPayment);
router.get('/payments', authenticate, authorizeAdmin, getAllPayments);
router.put('/payments/:id', authenticate, authorizeAdmin, updatePayment);
router.delete('/payments/:id', authenticate, authorizeAdmin, deletePayment);
router.get('/payments/:memberId', authenticate, getMemberPayments);

module.exports = router;
