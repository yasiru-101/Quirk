require('dotenv').config();

// ─── Fail-fast: Validate critical environment variables at startup ───────────
// The server must NOT start without proper JWT secrets configured.
// This prevents accidental deployment with missing or weak authentication keys.
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set them in your .env file before starting the server.');
  process.exit(1);
}

const http = require('http');
const app = require('./app');
const prisma = require('./config/db');
const initSocket = require('./config/socket');
const { setIO } = require('./services/socketService');

// Connect and verify PostgreSQL Database Connection
prisma.$connect()
  .then(() => {
    console.log('PostgreSQL Connected successfully via Prisma.');
  })
  .catch((err) => {
    console.error('FATAL: Could not connect to PostgreSQL database:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
setIO(io);

// Schedule approaching deadlines check (runs every hour at minute 0)
const cron = require('node-cron');
const { checkApproachingDeadlines } = require('./services/notificationService');
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running scheduled deadline check...');
  await checkApproachingDeadlines();
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle uncaught exceptions and unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
