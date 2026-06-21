const nodemailer = require('nodemailer');
const { emailClient } = require('../config/azure');

/**
 * Returns the HTML template for user onboarding email.
 */
const getOnboardingTemplate = (to, name, tempPassword, loginUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f1f5f9; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .header { font-size: 24px; font-weight: bold; color: #1e3a8a; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
    .content { font-size: 16px; color: #475569; }
    .credentials { background-color: #eff6ff; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 0 8px 8px 0; }
    .credentials-title { font-weight: bold; color: #1e40af; margin-bottom: 10px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.2s; }
    .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Welcome to Quirk</div>
    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>
      <p>An administrator has created an account for you on <strong>Quirk Task Management</strong>.</p>
      <p>Please use the temporary credentials below to log in and set up your password:</p>
      <div class="credentials">
        <div class="credentials-title">Your Login Credentials</div>
        <strong>Email:</strong> ${to}<br/>
        <strong>Temporary Password:</strong> <code style="font-size: 16px; color: #0f172a; font-weight: bold;">${tempPassword}</code>
      </div>
      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Log In to Quirk</a>
      </div>
      <p style="font-size: 14px; color: #b91c1c; font-style: italic; margin-top: 20px;">
        Note: You will be prompted to change this temporary password upon your first login.
      </p>
    </div>
    <div class="footer">
      This is an automated system email. Please do not reply directly to this address.
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends email using Ethereal SMTP test account (development fallback).
 */
const sendEtherealEmail = async ({ to, subject, html }) => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Quirk" <no-reply@quirk.app>',
      to,
      subject,
      html,
    });

    console.log(`[Email Fallback] Message successfully sent to ${to}. MessageId: ${info.messageId}`);
    console.log(`[Email Fallback] View preview at: ${nodemailer.getTestMessageUrl(info)}`);
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error(`[Email Fallback] Failed to send email: ${error.message}`);
    throw error;
  }
};

/**
 * Sends email using Azure Communication Services Email SDK (production).
 */
const sendAzureEmail = async ({ to, name, subject, html }) => {
  const senderAddress = process.env.AZURE_ACS_SENDER_ADDRESS;
  if (!senderAddress) {
    throw new Error('AZURE_ACS_SENDER_ADDRESS is not set in environment variables.');
  }

  try {
    const message = {
      senderAddress: senderAddress,
      content: {
        subject: subject,
        html: html,
      },
      recipients: {
        to: [
          {
            address: to,
            displayName: name,
          },
        ],
      },
    };

    console.log(`[Azure ACS] Sending onboarding email to ${to}...`);
    const poller = await emailClient.beginSend(message);
    const response = await poller.pollUntilDone();
    console.log(`[Azure ACS] Email sent successfully. MessageId: ${response.id}`);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error(`[Azure ACS] Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Main entry point: sends onboarding email using Azure ACS if available, otherwise Ethereal.
 */
const sendOnboardingEmail = async ({ to, name, tempPassword, loginUrl }) => {
  const subject = 'Welcome to Quirk — Your Account Has Been Created';
  const html = getOnboardingTemplate(to, name, tempPassword, loginUrl);

  if (emailClient && process.env.AZURE_ACS_SENDER_ADDRESS) {
    return await sendAzureEmail({ to, name, subject, html });
  } else {
    console.log('[EmailService] Azure ACS not configured. Falling back to Ethereal SMTP...');
    return await sendEtherealEmail({ to, subject, html });
  }
};

module.exports = {
  sendOnboardingEmail
};
