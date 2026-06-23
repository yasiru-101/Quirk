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
} = require('../controllers/attachmentController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
  upload.single('file'),
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

module.exports = router;
