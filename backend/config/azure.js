const { EmailClient } = require('@azure/communication-email');
const { BlobServiceClient } = require('@azure/storage-blob');

let emailClient = null;
let blobServiceClient = null;

if (process.env.AZURE_ACS_CONNECTION_STRING) {
  try {
    emailClient = new EmailClient(process.env.AZURE_ACS_CONNECTION_STRING);
    console.log('[Azure ACS] EmailClient initialized successfully.');
  } catch (error) {
    console.error('[Azure ACS] Error initializing EmailClient:', error.message);
  }
} else {
  console.log('[Azure ACS] No connection string provided. Email fallback will be used.');
}

if (process.env.AZURE_BLOB_CONNECTION_STRING) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
    console.log('[Azure Blob] BlobServiceClient initialized successfully.');
  } catch (error) {
    console.error('[Azure Blob] Error initializing BlobServiceClient:', error.message);
  }
} else {
  console.log('[Azure Blob] No connection string provided. Local storage fallback will be used.');
}

module.exports = {
  emailClient,
  blobServiceClient
};
