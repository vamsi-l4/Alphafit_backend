const prisma = require('./prisma.util');

/**
 * Updates all members whose expiryDate has passed to EXPIRED status.
 */
async function updateExpiredMembers() {
  try {
    const now = new Date();
    const result = await prisma.member.updateMany({
      where: {
        expiryDate: { lt: now },
        status: { not: 'EXPIRED' },
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) {
      console.log(`[EXPIRY] Marked ${result.count} member(s) as EXPIRED.`);
    }
  } catch (error) {
    console.error('[EXPIRY] Error updating expired members:', error.message);
  }
}

/**
 * Returns members expiring within the given days.
 */
async function getMembersExpiringIn(days) {
  const now = new Date();
  const target = new Date();
  target.setDate(now.getDate() + days);

  // Get members expiring within that day (±12 hours window for the day)
  const startOfDay = new Date(target);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.member.findMany({
    where: {
      expiryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'ACTIVE',
    },
    select: { id: true, name: true, phone: true, expiryDate: true, status: true },
  });
}

// Placeholder for future SMS/WhatsApp integration
async function sendExpiryNotification(member, daysLeft) {
  // TODO: Integrate with Twilio/WhatsApp Business API
  // Example:
  // await twilioClient.messages.create({
  //   body: `Hi ${member.name}, your gym membership expires in ${daysLeft} day(s). Renew now!`,
  //   from: process.env.TWILIO_PHONE,
  //   to: `+91${member.phone}`
  // });
  console.log(`[NOTIFICATION STUB] Would notify ${member.name} (${member.phone}): expires in ${daysLeft} day(s)`);
}

module.exports = { updateExpiredMembers, getMembersExpiringIn, sendExpiryNotification };
