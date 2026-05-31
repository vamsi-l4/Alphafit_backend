// Force the standard Node query engine. Without this, a machine-level Prisma
// engine setting can route the client through Data Proxy/Accelerate, which
// requires a prisma:// URL instead of this app's postgresql:// DATABASE_URL.
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fixes Neon DB connection timeouts on networks with broken IPv6

const { PrismaClient } = require('@prisma/client');

// Production-ready Prisma client wrapper
// - Adds connection retry logic for transient failures
// - Exposes connect/disconnect helpers
// - Registers graceful shutdown handlers

const MAX_RETRIES = parseInt(process.env.PRISMA_CONNECT_RETRIES || '10', 10);
const RETRY_DELAY_MS = parseInt(process.env.PRISMA_RETRY_DELAY_MS || '3000', 10);

// Dynamically inject a longer connection timeout for Neon to prevent P1001 errors
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('neon.tech') && !dbUrl.includes('connect_timeout')) {
    dbUrl += dbUrl.includes('?') ? '&connect_timeout=30' : '?connect_timeout=30';
}

const prisma = new PrismaClient({ 
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: ['warn', 'error'] 
});

async function connectWithRetry(retries = MAX_RETRIES) {
    let attempt = 0;
    while (true) {
        try {
            await prisma.$connect();
            console.log('[Prisma] Connected to database');
            return;
        } catch (err) {
            attempt += 1;
            console.error(`[Prisma] Connection attempt ${attempt} failed: ${err.message}`);
            if (err.message.includes("Can't reach database server")) {
                console.log(`[Prisma] ⏳ Hint: Your Neon serverless database is likely waking up from sleep. Waiting to retry...`);
            }
            if (attempt >= retries) {
                console.error('[Prisma] Maximum connection attempts reached');
                throw err;
            }
            const delay = Math.min(RETRY_DELAY_MS * attempt, 30000);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}

async function disconnectPrisma() {
    try {
        await prisma.$disconnect();
        console.log('[Prisma] Disconnected');
    } catch (err) {
        console.error('[Prisma] Error while disconnecting:', err.message);
    }
}

// Graceful shutdown
const shutdown = async (signal) => {
    console.log(`[Prisma] Received ${signal} - disconnecting`);
    await disconnectPrisma();
    // allow process to exit naturally after cleanup
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGQUIT', () => shutdown('SIGQUIT'));
process.on('uncaughtException', async (err) => {
    console.error('[Prisma] Uncaught Exception', err);
    await disconnectPrisma();
    process.exit(1);
});
process.on('unhandledRejection', async (reason) => {
    console.error('[Prisma] Unhandled Rejection', reason);
    await disconnectPrisma();
    process.exit(1);
});

// Backwards-compatible export:
// `require('../utils/prisma.util')` returns the Prisma client object (previous behavior),
// and helper functions are attached as properties on that object.
module.exports = prisma;
module.exports.connectWithRetry = connectWithRetry;
module.exports.disconnectPrisma = disconnectPrisma;
