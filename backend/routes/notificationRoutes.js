/**
 * @file notificationRoutes.js
 * @description Routing configuration for Notification retrieval and read-status management.
 *
 * Routes:
 *  - GET   /api/notifications           → List notifications for the logged-in user
 *  - PATCH /api/notifications/:id/read  → Mark a single notification as read
 *  - PATCH /api/notifications/read-all  → Mark all notifications as read
 *
 * All routes require authentication. Notifications are user-scoped (a user can
 * only access their own notifications).
 */

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

// Require authentication for all notification operations
router.use(protect);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List notifications
 *     description: Returns all notifications for the currently authenticated user, sorted newest first.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 */
router.get('/', getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Bulk-updates all unread notifications for the authenticated user to read status.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read. Returns count of modified records.
 *       401:
 *         description: Unauthorized.
 */
router.patch('/read-all', markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Sets a specific notification to read. Only the notification owner can do this.
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The notification record ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *       403:
 *         description: Forbidden (notification belongs to another user).
 *       404:
 *         description: Notification not found.
 *       401:
 *         description: Unauthorized.
 */
router.patch('/:id/read', markAsRead);

module.exports = router;
