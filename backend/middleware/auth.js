const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  // 1. Get token from cookies or Authorization header
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check if token exists
  if (!token) {
    return res.status(401).json({
      errorCode: 401,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    // 3. Verify token — JWT_SECRET must be set in environment variables (no fallback)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user associated with the token (exclude passwordHash).
    // User IDs are UUID strings, so the token subject is used as-is.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustResetPassword: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        errorCode: 401,
        message: 'Not authorized, user not found',
      });
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        errorCode: 401,
        message: 'Not authorized, user account is deactivated',
      });
    }

    // 6. Enforce password reset policy on all routes except auth exemptions
    const isAuthExempt =
      req.originalUrl.endsWith('/reset-password') ||
      req.originalUrl.endsWith('/logout') ||
      req.originalUrl.endsWith('/me');

    if (user.mustResetPassword && !isAuthExempt) {
      return res.status(403).json({
        errorCode: 403,
        message: 'Password reset is required. Please reset your password to continue.',
      });
    }

    // 7. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({
      errorCode: 401,
      message: 'Not authorized, token validation failed',
    });
  }
};

module.exports = { protect };
