const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');
const membershipRoutes = require('./routes/membership.routes');
const { generateExpiryNotifications } = require('./services/membershipExpiry.service');

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/workout', require('./routes/workout.routes'));
app.use('/api', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/membership', membershipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Cron: Run every day at 9AM to update expiry status and create membership notifications
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running daily membership expiry sync...');
  try {
    await generateExpiryNotifications();
  } catch (err) {
    console.error('[CRON] Expiry sync failed:', err.message);
  }
});
// Ensure DB is connected before starting the server
const { connectWithRetry, disconnectPrisma } = require('./db');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectWithRetry();
  } catch (err) {
    console.error('[STARTUP] Database connection failed, exiting.');
    process.exit(1);
  }

  // Start listening
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
      await generateExpiryNotifications();
    } catch (error) {
      console.error('[STARTUP] Expiry sync failed:', error.message);
    }
  });

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[STARTUP] Error: Port ${PORT} is already in use.`);
      await disconnectPrisma();
      process.exit(1);
    }
    throw err;
  });
}

startServer();
