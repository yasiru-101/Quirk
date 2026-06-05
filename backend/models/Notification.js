const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
    },
    type: {
      type: String,
      enum: ['Assignment', 'StatusChange', 'Comment', 'Deadline', 'Admin'],
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    relatedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster loading of active/unread notifications per user
notificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
