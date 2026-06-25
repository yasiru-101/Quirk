/**
 * @file attachmentController.js
 * @description Controller handling file attachment upload and download operations.
 */

const fs = require('fs/promises');
const prisma = require('../config/db');
const blobService = require('../services/blobService');
const { resolveTaskAccess } = require('../middleware/membership');

// Remove a file multer already wrote to disk when the request is rejected before a
// DB record is created, so failed/unauthorized uploads don't accumulate as orphans.
// No-op for in-memory (Azure) uploads, which were never written locally.
const cleanupTempFile = async (file) => {
  if (file?.path) {
    await fs.unlink(file.path).catch(() => {});
  }
};

// @desc    Upload a file attachment and create a database record
// @route   POST /api/attachments/upload
// @access  Private (PM or Collaborator)
const uploadFile = async (req, res) => {
  try {
    // 1. Verify that multer successfully parsed a file from the request
    if (!req.file) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { file: 'No file was uploaded. Please attach a file.' },
      });
    }

    // 2. Extract metadata from the uploaded file (populated by multer)
    const { originalname, mimetype, size, filename } = req.file;

    // 3. Read associations and authorize BEFORE persisting the blob, so an
    //    unauthorized upload never reaches durable storage (Azure or DB).
    const { taskId, commentId } = req.body;

    if (!taskId) {
      await cleanupTempFile(req.file);
      return res.status(400).json({
        message: 'Validation failed',
        errors: { taskId: 'taskId is required when uploading an attachment.' },
      });
    }

    const access = await resolveTaskAccess(req.user, taskId);
    if (!access.ok) {
      await cleanupTempFile(req.file);
      return res.status(access.status === 404 ? 404 : 403).json({
        message: access.status === 404
          ? 'Task not found'
          : 'Access denied. You do not have access to this task.',
      });
    }

    // 4. Build the download URL (Azure Blob URL if buffer exists, otherwise local relative path)
    let blobUrl;
    if (req.file.buffer) {
      const uploadResult = await blobService.uploadFile(req.file.buffer, originalname, mimetype);
      blobUrl = uploadResult.blobUrl;
    } else {
      blobUrl = `/uploads/${filename}`;
    }

    // 5. Create the attachment record using Prisma
    const attachment = await prisma.attachment.create({
      data: {
        taskId: taskId,
        commentId: commentId ? commentId : null,
        uploadedBy: req.user.id,
        originalName: originalname,
        blobUrl,
        mimeType: mimetype,
        sizeBytes: size,
      },
    });

    // Provide _id alias for frontend compatibility
    const responseAttachment = {
      ...attachment,
      _id: attachment.id,
    };

    return res.status(201).json({
      attachment: responseAttachment,
    });
  } catch (error) {
    console.error(`Upload attachment error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during file upload',
    });
  }
};

// @desc    Get the download URL (or serve the file) for an attachment
// @route   GET /api/attachments/:id/download
// @access  Private (PM or Collaborator)
const getDownloadUrl = async (req, res) => {
  const { id } = req.params;
  const targetId = id;

  try {
    // 1. Find the attachment record
    const attachment = await prisma.attachment.findUnique({
      where: { id: targetId },
    });
    if (!attachment) {
      return res.status(404).json({
        message: 'Attachment not found',
      });
    }

    // Authorize: the caller must have access to the attachment's task.
    const access = await resolveTaskAccess(req.user, attachment.taskId);
    if (!access.ok) {
      return res.status(403).json({
        message: 'Access denied. You do not have access to this attachment.',
      });
    }

    // 2. Return the download URL (SAS URL if Azure, otherwise local path) and metadata
    const downloadUrl = await blobService.getDownloadUrl(attachment.blobUrl);

    return res.status(200).json({
      attachment: {
        id: attachment.id,
        _id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error(`Get download URL error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching download URL',
    });
  }
};

module.exports = {
  uploadFile,
  getDownloadUrl,
};
