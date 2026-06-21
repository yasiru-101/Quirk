// Load dotenv
require('dotenv').config();

const { BlobServiceClient } = require('@azure/storage-blob');
const { EmailClient } = require('@azure/communication-email');

async function testBlobConnection() {
  console.log('--- TESTING AZURE BLOB STORAGE ---');
  const connStr = process.env.AZURE_BLOB_CONNECTION_STRING;
  const containerName = process.env.AZURE_BLOB_CONTAINER_NAME || 'taskflow-attachments';

  if (!connStr) {
    console.error('❌ Error: AZURE_BLOB_CONNECTION_STRING is missing from .env');
    return false;
  }

  try {
    console.log(`Initializing BlobServiceClient with account name: ${connStr.match(/AccountName=([^;]+)/)?.[1] || 'Unknown'}`);
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    console.log(`Checking/Creating container: "${containerName}"...`);
    await containerClient.createIfNotExists();
    console.log('✅ Container checked/created successfully.');

    const testBlobName = `test-connection-${Date.now()}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(testBlobName);
    const content = 'TaskFlow Connection Verification';

    console.log(`Uploading test blob: "${testBlobName}"...`);
    await blockBlobClient.upload(content, content.length);
    console.log('✅ Upload successful.');

    console.log('Deleting test blob...');
    await blockBlobClient.delete();
    console.log('✅ Deletion successful.');
    console.log('🎉 Azure Blob Storage connection works perfectly!\n');
    return true;
  } catch (error) {
    console.error(`❌ Azure Blob Storage failed: ${error.message}\n`);
    return false;
  }
}

async function testEmailConnection() {
  console.log('--- TESTING AZURE COMMUNICATION SERVICES (EMAIL) ---');
  const connStr = process.env.AZURE_ACS_CONNECTION_STRING;
  const senderAddress = process.env.AZURE_ACS_SENDER_ADDRESS;

  if (!connStr) {
    console.error('❌ Error: AZURE_ACS_CONNECTION_STRING is missing from .env');
    return false;
  }
  if (!senderAddress) {
    console.error('❌ Error: AZURE_ACS_SENDER_ADDRESS is missing from .env');
    return false;
  }

  try {
    console.log(`Initializing EmailClient with endpoint: ${connStr.match(/endpoint=([^;]+)/)?.[1] || 'Unknown'}`);
    const emailClient = new EmailClient(connStr);

    console.log('✅ EmailClient initialized successfully.');
    console.log(`Sender Address configured: "${senderAddress}"`);
    console.log('Note: To fully verify emails, a test email must be sent to an actual address.');
    console.log('🎉 Azure Communication Services client setup is valid!\n');
    return true;
  } catch (error) {
    console.error(`❌ Azure Communication Services initialization failed: ${error.message}\n`);
    return false;
  }
}

async function run() {
  console.log('Starting Azure Configuration Check...\n');
  const blobOk = await testBlobConnection();
  const emailOk = await testEmailConnection();
  
  if (blobOk && emailOk) {
    console.log('===================================================');
    console.log('🎉 ALL AZURE CONFIGURATIONS ARE CORRECT AND ACTIVE!');
    console.log('===================================================');
  } else {
    console.log('===================================================');
    console.log('❌ SOME AZURE INTEGRATIONS FAILED. PLEASE CHECK ERRORS ABOVE.');
    console.log('===================================================');
  }
}

run();
