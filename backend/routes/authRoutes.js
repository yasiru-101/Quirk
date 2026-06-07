const express = require('express');
const router = express.Router();

const {
  login,
  me,
  logout,
  refresh,
  resetPassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, resetPasswordSchema } = require('../validations/authSchemas');

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
