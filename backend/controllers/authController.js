const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/db');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const withEmailDebug = (payload, emailDebug) => (emailDebug ? { ...payload, emailDebug } : payload);

// A fixed bcrypt hash compared against when no user matches the supplied email. It
// makes the failed-login path do the same work as the success path, so response
// timing no longer reveals whether an account exists. Computed once at startup.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('account-enumeration-guard', 12);

// Helper to generate access token (15 mins)
// JWT_SECRET must be configured in .env — no hardcoded fallback for security
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, isPlatformAdmin: user.isPlatformAdmin },
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

// Short-lived token proving the password step succeeded. It binds the second
// factor to the same login attempt so a code alone cannot authenticate.
const generatePendingToken = (user) =>
  jwt.sign({ id: user.id, purpose: '2fa_pending' }, process.env.JWT_SECRET, { expiresIn: '5m' });

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

// @desc    Request OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't leak whether user exists
      return res.status(200).json({ message: 'If an account exists, an OTP will be sent.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'User account deactivated' });
    }

    const code = await otpService.issueCode(user.id, 'PASSWORD_RESET');
    let emailDebug = null;

    // Send email using email service
    try {
      const emailResult = await emailService.sendOtpEmail({
        to: user.email,
        purpose: 'PASSWORD_RESET',
        code: code,
      });
      emailDebug = emailResult.emailDebug;
    } catch (err) {
      emailDebug = err.emailDebug || null;
      console.error(`Failed to send password reset email to ${user.email}:`, err.message);
    }

    // In development, log to console so developers can retrieve the code without it
    // ever travelling in the HTTP response (which could leak if NODE_ENV is wrong).
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password Reset OTP for ${user.email}: ${code}`);
    }

    return res.status(200).json(withEmailDebug({
      message: 'If an account exists, an OTP will be sent.',
    }, emailDebug));
  } catch (error) {
    console.error(`Forgot password error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error processing request' });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordWithOtp = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Verify OTP using otpService
    const verification = await otpService.verifyCode(user.id, 'PASSWORD_RESET', code);
    if (!verification.ok) {
      return res.status(400).json({ message: verification.reason });
    }

    // OTP verified, update password
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      // Bumping tokenValidFrom invalidates any sessions that existed before this
      // reset, so a password recovery also evicts a hijacked session.
      data: { passwordHash: newHash, mustResetPassword: false, tokenValidFrom: new Date() },
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(`Reset password OTP error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error resetting password' });
  }
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

    // Always run a bcrypt comparison — against the user's hash, or a dummy hash when
    // the email is unknown — so the response time does not betray account existence.
    const isMatch = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        errors: { email: 'Invalid email or password' },
      });
    }

    // Verify account is active. Checked only after the password is confirmed so the
    // deactivated-account message cannot be used to enumerate accounts pre-auth.
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated',
        errors: { email: 'Your account has been deactivated. Please contact an admin.' },
      });
    }

    // Block sign-in until a self-registered user has confirmed their email.
    if (!user.emailVerified) {
      const code = await otpService.issueCode(user.id, otpService.PURPOSES.EMAIL_VERIFY);
      let emailDebug = null;
      try {
        const emailResult = await emailService.sendOtpEmail({ to: user.email, purpose: 'EMAIL_VERIFY', code });
        emailDebug = emailResult.emailDebug;
      } catch (e) {
        emailDebug = e.emailDebug || null;
        console.error(`[Auth] verification email failed: ${e.message}`);
      }
      return res.status(403).json(withEmailDebug({
        message: 'Please verify your email address to continue. A new code has been sent.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      }, emailDebug));
    }

    // If 2FA is enabled, defer sign-in until the second factor is verified.
    if (user.twoFactorEnabled) {
      const code = await otpService.issueCode(user.id, otpService.PURPOSES.LOGIN_2FA);
      let emailDebug = null;
      try {
        const emailResult = await emailService.sendOtpEmail({ to: user.email, purpose: 'LOGIN_2FA', code });
        emailDebug = emailResult.emailDebug;
      } catch (e) {
        emailDebug = e.emailDebug || null;
        console.error(`[Auth] 2FA email failed: ${e.message}`);
      }
      return res.status(200).json(withEmailDebug({
        twoFactorRequired: true,
        pendingToken: generatePendingToken(user),
        email: user.email,
      }, emailDebug));
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

// @desc    Update the authenticated user's own profile (display name)
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { name } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        isPlatformAdmin: true,
        mustResetPassword: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });
    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error(`Update profile error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error updating profile' });
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
      where: { id: decoded.id },
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
      where: { id: userId },
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
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustResetPassword: false,
        // Invalidate all prior sessions; the fresh tokens issued just below carry a
        // later `iat`, so the current caller stays signed in while others are evicted.
        tokenValidFrom: new Date(),
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

// @desc    Register a new self-service account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { email: 'An account with this email already exists' },
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        mustResetPassword: false, // the user chose their own password
        emailVerified: false,     // must confirm via an emailed code
      },
    });

    const code = await otpService.issueCode(user.id, otpService.PURPOSES.EMAIL_VERIFY);
    let emailDebug = null;
    try {
      const emailResult = await emailService.sendOtpEmail({ to: user.email, purpose: 'EMAIL_VERIFY', code });
      emailDebug = emailResult.emailDebug;
    } catch (e) {
      emailDebug = e.emailDebug || null;
      console.error(`[Auth] verification email failed: ${e.message}`);
    }

    return res.status(201).json(withEmailDebug({
      message: 'Account created. Check your email for a verification code.',
      email: user.email,
    }, emailDebug));
  } catch (error) {
    console.error(`Register error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// @desc    Register via invitation token (bypasses email verify)
// @route   POST /api/auth/register-invited
// @access  Public
const registerInvited = async (req, res) => {
  const { name, password, token } = req.body;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation is invalid or has already been used.' });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This invitation has expired.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          passwordHash,
          mustResetPassword: false,
          emailVerified: true, // Bypass verification!
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: newUser.id,
          role: invitation.role,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });

      return newUser;
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = { ...user };
    delete userResponse.passwordHash;

    return res.status(201).json({
      message: 'Account created and workspace joined.',
      user: userResponse,
    });
  } catch (error) {
    console.error(`Register via invite error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// @desc    Set the password for an invitation-provisioned account and sign in
// @route   POST /api/auth/set-invited-password
// @access  Public (requires a valid invitation token)
//
// Used when a workspace invitation created a brand-new account with a temporary
// password. The recipient clicks the emailed link and chooses a password here
// without having to type the temporary one. The membership already exists, so this
// only finalizes the credentials and signs the user in.
const setInvitedPassword = async (req, res) => {
  const { name, password, token } = req.body;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation is invalid or has already been used.' });
    }
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This invitation has expired.' });
    }

    const user = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (!user || !user.mustResetPassword) {
      // No provisioned account awaiting setup — fall back to the normal sign-in path.
      return res.status(400).json({ message: 'This account is already set up. Please sign in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustResetPassword: false,
          // Invalidate any sessions issued before this credential change.
          tokenValidFrom: new Date(),
          ...(name ? { name: name.trim() } : {}),
        },
      });
      // Membership was created with the invitation; upsert keeps this idempotent.
      await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } },
        create: { workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role },
        update: {},
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      return u;
    });

    const accessToken = generateAccessToken(updated);
    const refreshToken = generateRefreshToken(updated);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return res.status(200).json({
      message: 'Password set and workspace joined.',
      user: userResponse,
      workspaceId: invitation.workspaceId,
    });
  } catch (error) {
    console.error(`Set invited password error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error setting password' });
  }
};

// @desc    Verify email with a one-time code and complete sign-in
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification request' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please log in.' });
    }

    const result = await otpService.verifyCode(user.id, otpService.PURPOSES.EMAIL_VERIFY, code);
    if (!result.ok) {
      return res.status(400).json({ message: result.reason, errors: { code: result.reason } });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    const accessToken = generateAccessToken(updated);
    const refreshToken = generateRefreshToken(updated);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = { ...updated };
    delete userResponse.passwordHash;
    return res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error(`Verify email error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during email verification' });
  }
};

// @desc    Resend an email-verification code
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Respond identically whether or not the account exists, to avoid revealing
    // which email addresses are registered.
    let emailDebug = null;
    if (user && !user.emailVerified) {
      const code = await otpService.issueCode(user.id, otpService.PURPOSES.EMAIL_VERIFY);
      try {
        const emailResult = await emailService.sendOtpEmail({ to: user.email, purpose: 'EMAIL_VERIFY', code });
        emailDebug = emailResult.emailDebug;
      } catch (e) {
        emailDebug = e.emailDebug || null;
        console.error(`[Auth] verification email failed: ${e.message}`);
      }
    }
    return res.status(200).json(withEmailDebug({
      message: 'If the account exists and is unverified, a new code has been sent.',
    }, emailDebug));
  } catch (error) {
    console.error(`Resend verification error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Complete a login that requires a second factor
// @route   POST /api/auth/verify-2fa
// @access  Public (requires the pending token issued by /login)
const verifyTwoFactor = async (req, res) => {
  const { pendingToken, code } = req.body;
  try {
    let decoded;
    try {
      decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Your login session expired. Please sign in again.' });
    }
    if (decoded.purpose !== '2fa_pending') {
      return res.status(401).json({ message: 'Invalid login session.' });
    }

    const result = await otpService.verifyCode(decoded.id, otpService.PURPOSES.LOGIN_2FA, code);
    if (!result.ok) {
      return res.status(400).json({ message: result.reason, errors: { code: result.reason } });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account unavailable' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = { ...user };
    delete userResponse.passwordHash;
    return res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error(`Verify 2FA error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during two-factor verification' });
  }
};

// @desc    Begin enabling 2FA by sending a confirmation code
// @route   POST /api/auth/2fa/enable
// @access  Private
const enableTwoFactor = async (req, res) => {
  try {
    const code = await otpService.issueCode(req.user.id, otpService.PURPOSES.LOGIN_2FA);
    let emailDebug = null;
    try {
      const emailResult = await emailService.sendOtpEmail({ to: req.user.email, purpose: 'LOGIN_2FA', code });
      emailDebug = emailResult.emailDebug;
    } catch (e) {
      emailDebug = e.emailDebug || null;
      console.error(`[Auth] 2FA email failed: ${e.message}`);
    }
    return res.status(200).json(withEmailDebug({ message: 'A verification code has been sent to your email.' }, emailDebug));
  } catch (error) {
    console.error(`Enable 2FA error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Confirm and activate 2FA with the emailed code
// @route   POST /api/auth/2fa/confirm
// @access  Private
const confirmTwoFactor = async (req, res) => {
  const { code } = req.body;
  try {
    const result = await otpService.verifyCode(req.user.id, otpService.PURPOSES.LOGIN_2FA, code);
    if (!result.ok) {
      return res.status(400).json({ message: result.reason, errors: { code: result.reason } });
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { twoFactorEnabled: true } });
    return res.status(200).json({ message: 'Two-factor authentication is now enabled.' });
  } catch (error) {
    console.error(`Confirm 2FA error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Disable 2FA (requires the current password)
// @route   POST /api/auth/2fa/disable
// @access  Private
const disableTwoFactor = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { password: 'Incorrect password' },
      });
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { twoFactorEnabled: false } });
    return res.status(200).json({ message: 'Two-factor authentication has been disabled.' });
  } catch (error) {
    console.error(`Disable 2FA error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  me,
  updateProfile,
  logout,
  refresh,
  resetPassword,
  register,
  registerInvited,
  setInvitedPassword,
  verifyEmail,
  resendVerification,
  verifyTwoFactor,
  enableTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  forgotPassword,
  resetPasswordWithOtp,
};
