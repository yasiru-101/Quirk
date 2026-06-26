const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { BlobSASPermissions } = require('@azure/storage-blob');
const { blobServiceClient } = require('../config/azure');

const CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || 'taskflow-attachments';

const isAzureConfigured = () => {
  return !!(blobServiceClient && process.env.AZURE_BLOB_CONNECTION_STRING);
};

/**
 * Uploads a file to Azure Blob Storage or local storage.
 * @param {Buffer} buffer - File buffer.
 * @param {string} originalName - Original filename.
 * @param {string} mimeType - File MIME type.
 * @returns {Promise<{blobUrl: string}>}
 */
const uploadFile = async (buffer, originalName, mimeType) => {
  const sanitizeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${sanitizeName}`;

  if (isAzureConfigured()) {
    try {
      console.log(`[BlobService] Uploading "${originalName}" to Azure container "${CONTAINER_NAME}"...`);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      
      // Ensure the container exists
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: mimeType }
      });

      console.log(`[BlobService] Azure upload complete. URL: ${blockBlobClient.url}`);
      return { blobUrl: blockBlobClient.url };
    } catch (error) {
      console.error(`[BlobService] Azure upload failed: ${error.message}. Falling back to local storage...`);
    }
  }

  // Local storage fallback path
  console.log(`[BlobService] Saving "${originalName}" to local disk...`);
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);

  const localUrl = `/uploads/${uniqueName}`;
  console.log(`[BlobService] Local save complete. URL path: ${localUrl}`);
  return { blobUrl: localUrl };
};

/**
 * Retrieves the download URL for a file. Returns a SAS-signed URL for Azure or the local path.
 * @param {string} blobUrl - The stored URL from the DB.
 * @returns {Promise<string>} - Public or SAS-signed download URL.
 */
const getDownloadUrl = async (blobUrl) => {
  if (!blobUrl) return '';

  // Local file serving (starts with /uploads/)
  if (blobUrl.startsWith('/uploads/')) {
    return blobUrl;
  }

  // Azure Blob SAS token generation
  if (isAzureConfigured()) {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const parsedUrl = new URL(blobUrl);
      const pathSegments = decodeURIComponent(parsedUrl.pathname).split('/');
      const blobName = pathSegments.pop();

      const blobClient = containerClient.getBlobClient(blobName);
      
      // Generate read-only SAS token valid for 1 hour
      const sasUrl = await blobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse('r'),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000) // 1 hour expiry
      });

      return sasUrl;
    } catch (error) {
      console.error(`[BlobService] SAS URL generation failed: ${error.message}. Returning raw URL.`);
      return blobUrl;
    }
  }

  return blobUrl;
};

/**
 * Deletes a file from Azure Blob Storage or local storage.
 * @param {string} blobUrl - The stored URL from the DB.
 * @returns {Promise<void>}
 */
const deleteFile = async (blobUrl) => {
  if (!blobUrl) return;

  if (blobUrl.startsWith('/uploads/')) {
    try {
      const parsedUrl = new URL(blobUrl, 'http://localhost');
      const filename = decodeURIComponent(parsedUrl.pathname.replace('/uploads/', ''));
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[BlobService] Deleted local file: ${filePath}`);
      }
    } catch (error) {
      console.error(`[BlobService] Failed to delete local file: ${error.message}`);
    }
    return;
  }

  if (isAzureConfigured()) {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const parsedUrl = new URL(blobUrl);
      const pathSegments = decodeURIComponent(parsedUrl.pathname).split('/');
      const blobName = pathSegments.pop();

      const blobClient = containerClient.getBlobClient(blobName);
      await blobClient.deleteIfExists();
      console.log(`[BlobService] Deleted Azure blob: ${blobName}`);
    } catch (error) {
      console.error(`[BlobService] Failed to delete Azure blob: ${error.message}`);
    }
  }
};

module.exports = {
  uploadFile,
  getDownloadUrl,
  deleteFile
};
