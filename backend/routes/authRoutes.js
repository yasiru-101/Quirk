const express = require('express');
const router = express.Router();

const {
  login,
  me,
  logout,
  refresh,
  resetPassword,
  updateProfile,
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
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
  registerSchema,
  registerInvitedSchema,
  setInvitedPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  verifyTwoFactorSchema,
  confirmTwoFactorSchema,
  disableTwoFactorSchema,
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
} = require('../validations/authSchemas');

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user by email and password, setting accessToken and refreshToken cookies.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@taskflow.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful. Cookies set.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     mustResetPassword:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Invalid credentials or deactivated account.
 */
router.post('/login', validate(loginSchema), login);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     description: Creates a self-service account and emails a verification code. No session is issued until the email is verified.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       201: { description: Account created; verification code sent }
 *       400: { description: Validation failed or email already in use }
 */
router.post('/register', validate(registerSchema), register);

/**
 * @openapi
 * /auth/register-invited:
 *   post:
 *     summary: Register a new account via an invitation token
 *     description: Bypasses email verification. Creates an account, accepts the invite, and signs the user in.
 *     tags: [Authentication]
 */
router.post('/register-invited', validate(registerInvitedSchema), registerInvited);

/**
 * @openapi
 * /auth/set-invited-password:
 *   post:
 *     summary: Set a password for an invitation-provisioned account and sign in
 *     description: >-
 *       For a brand-new account created by a workspace invitation (with a temporary
 *       password). Lets the recipient choose a password via the emailed link without
 *       typing the temporary one, then signs them in. The membership already exists.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword, token]
 *             properties:
 *               name: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *               token: { type: string }
 *     responses:
 *       200: { description: Password set; cookies set }
 *       400: { description: Invalid/expired invitation or account already set up }
 */
router.post('/set-invited-password', validate(setInvitedPasswordSchema), setInvitedPassword);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email and sign in
 *     description: Confirms an account with the emailed one-time code and sets session cookies.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Verified; cookies set }
 *       400: { description: Invalid or expired code }
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Resend the email-verification code
 *     tags: [Authentication]
 *     responses:
 *       200: { description: A code is sent if the account exists and is unverified }
 */
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

/**
 * @openapi
 * /auth/verify-2fa:
 *   post:
 *     summary: Complete a 2FA-protected login
 *     description: Exchanges the pending token from /login plus the emailed code for a session.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pendingToken, code]
 *             properties:
 *               pendingToken: { type: string }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Authenticated; cookies set }
 *       400: { description: Invalid or expired code }
 *       401: { description: Login session expired }
 */
router.post('/verify-2fa', validate(verifyTwoFactorSchema), verifyTwoFactor);

/**
 * @openapi
 * /auth/2fa/enable:
 *   post:
 *     summary: Send a code to begin enabling 2FA
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Verification code sent }
 */
router.post('/2fa/enable', protect, enableTwoFactor);

/**
 * @openapi
 * /auth/2fa/confirm:
 *   post:
 *     summary: Confirm and activate 2FA
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: 2FA enabled }
 *       400: { description: Invalid code }
 */
router.post('/2fa/confirm', protect, validate(confirmTwoFactorSchema), confirmTwoFactor);

/**
 * @openapi
 * /auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA (requires current password)
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: 2FA disabled }
 *       400: { description: Incorrect password }
 */
router.post('/2fa/disable', protect, validate(disableTwoFactorSchema), disableTwoFactor);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out user
 *     description: Clears authentication cookies (accessToken and refreshToken).
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Rotates access and refresh tokens using the refreshToken cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed. New cookies set.
 *       401:
 *         description: Refresh token invalid, expired, or missing.
 */
router.post('/refresh', refresh);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset temporary password
 *     description: Updates the user's password and sets mustResetPassword to false. Requires authentication.
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       400:
 *         description: Validation failed or current password incorrect.
 *       401:
 *         description: Not authorized.
 */
router.post('/reset-password', protect, validate(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request OTP for password reset
 *     tags: [Authentication]
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /auth/reset-password-otp:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Authentication]
 */
router.post('/reset-password-otp', validate(resetPasswordWithOtpSchema), resetPasswordWithOtp);

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     summary: Update your own profile
 *     description: Updates the authenticated user's display name. Self-service; does not require admin access.
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Alex Developer
 *     responses:
 *       200:
 *         description: Profile updated; returns the updated user.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Not authorized.
 */
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user details
 *     description: Returns the authenticated user's profile information. Requires authentication.
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile details returned.
 *       401:
 *         description: Not authorized.
 */
router.get('/me', protect, me);

module.exports = router;
