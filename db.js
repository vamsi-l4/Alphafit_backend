// db.js
// Lightweight wrapper exporting Prisma client and a connect helper
const prismaUtil = require('./utils/prisma.util');

const prisma = prismaUtil; // default export is the prisma client
const connectWithRetry = prismaUtil.connectWithRetry;
const disconnectPrisma = prismaUtil.disconnectPrisma;

module.exports = { prisma, connectWithRetry, disconnectPrisma };
