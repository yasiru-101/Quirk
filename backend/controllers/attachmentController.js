/**
 * @file attachmentController.js
 * @description Controller handling file attachment upload and download operations.
 */

const prisma = require('../config/db');
const blobService = require('../services/blobService');

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

    // 3. Build the download URL (Azure Blob URL if buffer exists, otherwise local relative path)
    let blobUrl;
    if (req.file.buffer) {
      const uploadResult = await blobService.uploadFile(req.file.buffer, originalname, mimetype);
      blobUrl = uploadResult.blobUrl;
    } else {
      blobUrl = `/uploads/${filename}`;
    }

    // 4. Read optional associations from request body (taskId is required by model)
    const { taskId, commentId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { taskId: 'taskId is required when uploading an attachment.' },
      });
    }

    // 5. Create the attachment record using Prisma
    const attachment = await prisma.attachment.create({
      data: {
        taskId: ,
        commentId: commentId ?  : null,
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
  const targetId = ;

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
