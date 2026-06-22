const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');

// Helper to generate access token (15 mins)
// JWT_SECRET must be configured in .env — no hardcoded fallback for security
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Helper to generate refresh token (7 days)
// JWT_REFRESH_SECRET must be configured in .env — no hardcoded fallback for security
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear token cookies
const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  });
};

// ─── Controller Actions ──────────────────────────────────────────────────────

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user using Prisma
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        errors: { email: 'Invalid email or password' },
      });
    }

    // Verify account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated',
        errors: { email: 'Your account has been deactivated. Please contact an admin.' },
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        errors: { email: 'Invalid email or password' },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set HTTP-only cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user details (without passwordHash)
    const userResponse = { ...user };
    delete userResponse.passwordHash;

    return res.status(200).json({
      user: userResponse,
    });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const me = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error(`Get profile error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching user profile',
    });
  }
};

// @desc    Log out user / Clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  try {
    clearTokenCookies(res);
    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(`Logout error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during logout',
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (using refresh token cookie)
const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token not found',
    });
  }

  try {
    // Verify refresh token — JWT_REFRESH_SECRET must be set in environment variables
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user using Prisma
    const user = await prisma.user.findUnique({
      where: { id:  },
    });
    if (!user) {
      return res.status(401).json({
        message: 'User associated with token not found',
      });
    }

    // Check active status
    if (!user.isActive) {
      return res.status(401).json({
        message: 'User account deactivated',
      });
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Set new cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    const userResponse = { ...user };
    delete userResponse.passwordHash;

    return res.status(200).json({
      user: userResponse,
    });
  } catch (error) {
    console.error(`Token refresh error: ${error.message}`);
    clearTokenCookies(res);
    return res.status(401).json({
      message: 'Refresh token expired or invalid',
    });
  }
};

// @desc    Reset password (change password from default/temporary)
// @route   POST /api/auth/reset-password
// @access  Private
const resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From req.user attached in protect middleware

  try {
    // Load user again to include password hash
    const user = await prisma.user.findUnique({
      where: { id:  },
    });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { currentPassword: 'The current password you entered is incorrect' },
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password using Prisma
    const updatedUser = await prisma.user.update({
      where: { id:  },
      data: {
        passwordHash: newPasswordHash,
        mustResetPassword: false,
      },
    });

    // Generate fresh tokens
    const accessToken = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = { ...updatedUser };
    delete userResponse.passwordHash;

    return res.status(200).json({
      user: userResponse,
    });
  } catch (error) {
    console.error(`Password reset error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during password reset',
    });
  }
};

module.exports = {
  login,
  me,
  logout,
  refresh,
  resetPassword,
};
