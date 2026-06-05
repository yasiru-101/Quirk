const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Configs and routes
const serveSwagger = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security Middlewares ───────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies
  })
);

// Body and Cookie Parsers
app.use(express.json());
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

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// ─── Centralized Global Error Handler (Standardized error response format) ───
app.use(errorHandler);

module.exports = app;
