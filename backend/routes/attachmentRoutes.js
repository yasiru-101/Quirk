/**
 * @file attachmentRoutes.js
 * @description Routing configuration for Attachment upload and download endpoints.
 *
 * Routes:
 *  - POST /api/attachments/upload       → Upload a file (multipart/form-data)
 *  - GET  /api/attachments/:id/download → Get download URL for a specific attachment
 *
 * All routes require authentication. Both PMs and Collaborators may upload/download.
 */

const express = require('express');
const router = express.Router();

const {
  uploadFile,
  getDownloadUrl,
  getTaskAttachments,
  deleteAttachment,
} = require('../controllers/attachmentController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const parseAttachmentUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();

    const isFileSizeError = err.code === 'LIMIT_FILE_SIZE';
    const isValidationError = isFileSizeError || err.message?.startsWith('Unsupported file type');
    const statusCode = isValidationError ? 400 : 500;

    return res.status(statusCode).json({
      errorCode: statusCode,
      message: isValidationError ? 'Validation failed' : 'Internal server error during file upload',
      errors: {
        file: isFileSizeError ? 'File must be 10 MB or smaller.' : err.message,
      },
    });
  });
};

// Require authentication for all attachment operations
router.use(protect);

/**
 * @openapi
 * /attachments/upload:
 *   post:
 *     summary: Upload a file attachment
 *     description: |
 *       Accepts a multipart/form-data upload with a single file field named `file`.
 *       Also requires `taskId` (and optionally `commentId`) in the form body.
 *       Maximum file size is 10 MB. Allowed types: PDF, DOCX, JPEG, PNG, ZIP.
 *     tags: [Attachments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - taskId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (max 10 MB).
 *               taskId:
 *                 type: string
 *                 description: ID of the task this attachment belongs to.
 *               commentId:
 *                 type: string
 *                 description: Optional ID of the comment this attachment belongs to.
 *     responses:
 *       201:
 *         description: Attachment uploaded and record created successfully.
 *       400:
 *         description: Validation failed (no file, missing taskId, or unsupported type).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 */
router.post(
  '/upload',
  parseAttachmentUpload,
  uploadFile
);

/**
 * @openapi
 * /attachments/{id}/download:
 *   get:
 *     summary: Get attachment download URL
 *     description: Returns the download URL and metadata for a specific attachment.
 *     tags: [Attachments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The attachment record ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment metadata and download URL returned.
 *       404:
 *         description: Attachment not found.
 *       401:
 *         description: Unauthorized.
 */
router.get(
  '/:id/download',
  getDownloadUrl
);

/**
 * @openapi
 * /attachments/task/{taskId}:
 *   get:
 *     summary: List all attachments for a task
 *     description: Returns a list of attachments for the specified task.
 *     tags: [Attachments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         description: The task ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attachments returned.
 *       403:
 *         description: Access denied.
 *       404:
 *         description: Task not found.
 */
router.get(
  '/task/:taskId',
  getTaskAttachments
);

/**
 * @openapi
 * /attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     description: Deletes an attachment record and its associated file blob.
 *     tags: [Attachments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The attachment record ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted successfully.
 *       403:
 *         description: Access denied.
 *       404:
 *         description: Attachment not found.
 */
router.delete(
  '/:id',
  deleteAttachment
);

module.exports = router;
