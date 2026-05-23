const membershipExpiryService = require('../services/membershipExpiry.service');

const checkMembershipExpiry = async (req, res) => {
    try {
        await membershipExpiryService.generateExpiryNotifications();

        if (req.user.role === 'member') {
            const memberView = await membershipExpiryService.getMemberExpiryView(req.user.id);
            return res.json({ success: true, data: memberView });
        }

        const summary = await membershipExpiryService.getAdminExpirySummary();
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { checkMembershipExpiry };