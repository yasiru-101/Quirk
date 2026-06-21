const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Configs and routes
const serveSwagger = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security Middlewares ───────────────────────────────────────────────────
// Helmet sets various HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.)
// HSTS is explicitly configured to enforce HTTPS in production for 1 year + subdomains.
app.use(
  helmet({
    hsts: {
      maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies
  })
);

// Body Parsers — size-limited to prevent denial-of-service via oversized payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// Sanitize against NoSQL injection (Custom wrapper for Express 5 compatibility)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// General Rate Limiter (Prevent general API brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', limiter);

// Strict Rate Limiter for Login Endpoint (10 attempts / 15 minutes) to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per window
  message: { 
    message: 'Too many login attempts, please try again after 15 minutes',
    errors: { email: 'Too many login attempts, please try again after 15 minutes' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// ─── API Documentation ──────────────────────────────────────────────────────
serveSwagger(app);

// ─── Static File Serving (Local uploads fallback for development) ───────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check (Kubernetes readiness/liveness probe) ─────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// ─── Centralized Global Error Handler (Standardized error response format) ───
app.use(errorHandler);

module.exports = app;
