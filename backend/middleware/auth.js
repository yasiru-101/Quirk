const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      message: 'Not authorized, no token provided',
    });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_access_token_key_12345');

    // 4. Find the user associated with the token
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        message: 'Not authorized, user not found',
      });
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Not authorized, user account is deactivated',
      });
    }

    // 6. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({
      message: 'Not authorized, token validation failed',
    });
  }
};

module.exports = { protect };
