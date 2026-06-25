const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Configs and routes
const serveSwagger        = require('./config/swagger');
const authRoutes          = require('./routes/authRoutes');
const userRoutes          = require('./routes/userRoutes');
const taskRoutes          = require('./routes/taskRoutes');
const commentRoutes       = require('./routes/commentRoutes');
const attachmentRoutes    = require('./routes/attachmentRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const projectRoutes       = require('./routes/projectRoutes');
const workspaceRoutes     = require('./routes/workspaceRoutes');
const activityRoutes      = require('./routes/activityRoutes');
const timeLogRoutes       = require('./routes/timeLogRoutes');
const chatRoutes          = require('./routes/chatRoutes');
const searchRoutes        = require('./routes/searchRoutes');
const platformRoutes      = require('./routes/platformRoutes');
const errorHandler        = require('./middleware/errorHandler');

const app = express();

// Trust the Nginx reverse proxy so that secure cookies and rate limiting work correctly
app.set('trust proxy', 1);

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
// Use 'combined' format in production for structured access logs; 'dev' for readability locally.
// Skip health-check probes to avoid log noise in Kubernetes.
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.url === '/api/health',
  })
);

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
  if (req.body)    mongoSanitize.sanitize(req.body);
  if (req.params)  mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  if (req.query)   mongoSanitize.sanitize(req.query);
  next();
});

// ─── Health Check (Kubernetes readiness/liveness probe) ─────────────────────
// Declared before the rate limiters: the kube-probe polls this endpoint every
// few seconds from a single source IP, which would otherwise exhaust the limiter
// and return 429. A failed liveness probe restarts the pod, so throttling the
// health check causes a crash loop.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Limit account-action endpoints (registration, code requests, verification) to
// resist abuse and one-time-code brute forcing, layered on the per-code attempt cap.
const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 12,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/register', authActionLimiter);
app.use('/api/auth/verify-email', authActionLimiter);
app.use('/api/auth/resend-verification', authActionLimiter);
app.use('/api/auth/verify-2fa', authActionLimiter);

// ─── API Documentation ──────────────────────────────────────────────────────
serveSwagger(app);

// ─── Static File Serving (Local uploads fallback for development) ───────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/tasks',         commentRoutes);
app.use('/api/tasks/:id/activity', activityRoutes);  // Audit trail per task
app.use('/api/tasks/:id/timelogs', timeLogRoutes);   // Time tracking per task
app.use('/api/attachments',   attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects',      projectRoutes);         // Projects, columns, epics, members
app.use('/api/workspaces',    workspaceRoutes);       // Workspaces, members, invitations
app.use('/api/chat',          chatRoutes);            // Chat conversations and messages
app.use('/api/search',        searchRoutes);          // Global search
app.use('/api/platform',      platformRoutes);        // SaaS platform console

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// ─── Centralized Global Error Handler (Standardized error response format) ───
app.use(errorHandler);

module.exports = app;
