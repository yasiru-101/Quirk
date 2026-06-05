const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded user ID is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
      trim: true,
    },
    blobUrl: {
      type: String,
      required: [true, 'Blob URL is required'],
    },
    mimeType: {
      type: String,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: [true, 'Size in bytes is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
attachmentSchema.index({ taskId: 1 });
attachmentSchema.index({ commentId: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = Attachment;
