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
        isPlatformAdmin: true,
        mustResetPassword: true,
        isActive: true,
        tokenValidFrom: true,
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

    // 5b. Reject sessions issued before the user's session cutoff (set on password
    // change/reset). Compared in whole seconds — JWT `iat` is second-precision — so a
    // token minted immediately after the cutoff is not falsely rejected. Null cutoff
    // means no invalidation has occurred and every existing token stays valid.
    if (user.tokenValidFrom && decoded.iat) {
      const cutoffSec = Math.floor(new Date(user.tokenValidFrom).getTime() / 1000);
      if (decoded.iat < cutoffSec) {
        return res.status(401).json({
          errorCode: 401,
          message: 'Session expired. Please sign in again.',
        });
      }
    }
    // Don't expose the cutoff timestamp on req.user.
    delete user.tokenValidFrom;

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
