/**
 * @file upload.js
 * @description Multer middleware configuration for parsing multipart/form-data file uploads.
 *
 * Stores files locally in `backend/uploads/` as a development fallback.
 * In production, this can be replaced with Azure Blob Storage or another cloud provider.
 *
 * Constraints:
 *  - Maximum file size: 10 MB
 *  - Allowed MIME types: PDFs, Word documents, images (JPEG/PNG), and ZIP archives
 */

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ─── Allowed MIME types ─────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
];

// The MIME type is client-supplied and trivially spoofed, so we also require the
// file extension to be in a known-good set. Both must pass — this rejects, e.g.,
// an `evil.exe` relabelled with an image Content-Type.
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip'];

// ─── Storage Configuration (Dynamic fallback) ───────────────────────────────
const useAzure = !!process.env.AZURE_BLOB_CONNECTION_STRING;

const storage = useAzure
  ? multer.memoryStorage()
  : multer.diskStorage({
      /**
       * Destination directory for uploaded files.
       * Creates `backend/uploads/` if it doesn't exist (handled by multer automatically
       * when used with `express.static`; we ensure the directory exists at startup in app.js).
       */
      destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
      },

      /**
       * Generate a unique filename: <timestamp>-<random>-<original-name>
       * This prevents filename collisions while preserving the original extension.
       */
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const sanitizedName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
      },
    });

// ─── File Filter ────────────────────────────────────────────────────────────
/**
 * Validates the uploaded file's MIME type against the allowed list.
 * Rejects unsupported file types with a descriptive error message.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, DOCX, JPEG, PNG, ZIP.'), false);
  }
};

// ─── Multer Instance ────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
  },
});

module.exports = upload;
