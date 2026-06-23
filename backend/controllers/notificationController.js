/**
 * @file notificationController.js
 * @description Controller handling notification retrieval and read-status management.
 */

const prisma = require('../config/db');

// @desc    Get all notifications for the currently authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // Retrieve notifications scoped to the logged-in user, sorted newest first
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            column: { select: { id: true, name: true, order: true, projectId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map notifications to fit frontend structure where relatedTaskId is the populated object
    const formattedNotifications = notifications.map((n) => {
      const obj = { ...n };
      obj.relatedTaskId = n.relatedTask;
      delete obj.relatedTask;
      return obj;
    });

    return res.status(200).json({
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error(`Get notifications error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching notifications',
    });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const targetId = id;

  try {
    // 1. Find the notification using Prisma
    const notification = await prisma.notification.findUnique({
      where: { id: targetId },
    });
    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
      });
    }

    // 2. Ownership check: ensure this notification belongs to the requesting user
    if (notification.recipientId !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied: You can only manage your own notifications.',
      });
    }

    // 3. Update read status using Prisma
    const updatedNotification = await prisma.notification.update({
      where: { id: targetId },
      data: { isRead: true },
    });

    return res.status(200).json({
      notification: updatedNotification,
    });
  } catch (error) {
    console.error(`Mark notification read error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error marking notification as read',
    });
  }
};

// @desc    Mark all notifications as read for the currently authenticated user
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    // Bulk update all unread notifications for this user using Prisma
    const result = await prisma.notification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.count,
    });
  } catch (error) {
    console.error(`Mark all notifications read error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error marking all notifications as read',
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
