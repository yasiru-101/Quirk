const nodemailer = require('nodemailer');
const { emailClient } = require('../config/azure');

const logEmailToConsole = ({ to, subject, html }) => {
  try {
    console.info('\n[Email Console Copy] ========================================');
    console.info(`[Email Console Copy] To: ${to}`);
    console.info(`[Email Console Copy] Subject: ${subject}`);
    console.info('[Email Console Copy] HTML:');
    console.info(html);
    console.info('[Email Console Copy] ========================================\n');
  } catch (error) {
    console.error(`[Email Console Copy] Failed to write email to console: ${error.message}`);
  }
};

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
 * Returns the HTML template for a workspace invitation email.
 */
const getInvitationTemplate = (workspaceName, inviterName, acceptUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f1f5f9; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .header { font-size: 24px; font-weight: bold; color: #1e3a8a; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
    .content { font-size: 16px; color: #475569; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
    .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">You've been invited to Quirk</div>
    <div class="content">
      <p><strong>${inviterName}</strong> has invited you to collaborate in the
      <strong>${workspaceName}</strong> workspace on Quirk Task Management.</p>
      <div class="btn-container">
        <a href="${acceptUrl}" class="btn" target="_blank">Accept Invitation</a>
      </div>
      <p style="font-size: 14px; color: #94a3b8;">This invitation link expires in 7 days.</p>
    </div>
    <div class="footer">
      This is an automated system email. Please do not reply directly to this address.
    </div>
  </div>
</body>
</html>
`;

/**
 * Returns the HTML template for a new workspace member who has no Quirk account yet.
 * Combines the invitation context with the temporary-credentials onboarding flow:
 * the recipient can either sign in with the temp password (and is forced to change
 * it on first login) or click the button to set a password directly.
 */
const getWorkspaceWelcomeTemplate = (to, workspaceName, inviterName, tempPassword, setupUrl) => `
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
    <div class="header">You've been added to Quirk</div>
    <div class="content">
      <p><strong>${inviterName}</strong> has added you to the <strong>${workspaceName}</strong> workspace on
      <strong>Quirk Task Management</strong> and created an account for you.</p>
      <p>You can get started in one of two ways:</p>
      <p><strong>1.</strong> Click the button below to set your own password and sign in straight away.</p>
      <div class="btn-container">
        <a href="${setupUrl}" class="btn" target="_blank">Set Your Password</a>
      </div>
      <p><strong>2.</strong> Or sign in with the temporary credentials below — you'll be asked to choose
      a new password on your first login.</p>
      <div class="credentials">
        <div class="credentials-title">Your Temporary Login Credentials</div>
        <strong>Email:</strong> ${to}<br/>
        <strong>Temporary Password:</strong> <code style="font-size: 16px; color: #0f172a; font-weight: bold;">${tempPassword}</code>
      </div>
      <p style="font-size: 14px; color: #94a3b8;">This invitation link expires in 7 days.</p>
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
    logEmailToConsole({ to, subject, html });
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
    logEmailToConsole({ to, subject, html });
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

/**
 * Sends a workspace invitation email using Azure ACS if available, otherwise Ethereal.
 */
const sendInvitationEmail = async ({ to, workspaceName, inviterName, acceptUrl }) => {
  const subject = `${inviterName} invited you to the ${workspaceName} workspace on Quirk`;
  const html = getInvitationTemplate(workspaceName, inviterName, acceptUrl);

  if (emailClient && process.env.AZURE_ACS_SENDER_ADDRESS) {
    return await sendAzureEmail({ to, name: to, subject, html });
  }
  console.log('[EmailService] Azure ACS not configured. Falling back to Ethereal SMTP...');
  return await sendEtherealEmail({ to, subject, html });
};

/**
 * Sends the combined welcome + temporary-credentials email used when a workspace
 * invitation creates a brand-new Quirk account. Uses Azure ACS if available,
 * otherwise Ethereal.
 */
const sendWorkspaceWelcomeEmail = async ({ to, workspaceName, inviterName, tempPassword, setupUrl }) => {
  const subject = `${inviterName} added you to the ${workspaceName} workspace on Quirk`;
  const html = getWorkspaceWelcomeTemplate(to, workspaceName, inviterName, tempPassword, setupUrl);

  if (emailClient && process.env.AZURE_ACS_SENDER_ADDRESS) {
    return await sendAzureEmail({ to, name: to, subject, html });
  }
  console.log('[EmailService] Azure ACS not configured. Falling back to Ethereal SMTP...');
  return await sendEtherealEmail({ to, subject, html });
};

/**
 * Returns the HTML template for a one-time code email.
 */
const getOtpTemplate = (heading, intro, code) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f1f5f9; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
    .header { font-size: 22px; font-weight: bold; color: #1e3a8a; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
    .content { font-size: 16px; color: #475569; }
    .code { font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #0f172a; text-align: center; background-color: #eff6ff; padding: 18px; border-radius: 8px; margin: 25px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${heading}</div>
    <div class="content">
      <p>${intro}</p>
      <div class="code">${code}</div>
      <p style="font-size: 14px; color: #94a3b8;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      This is an automated system email. Please do not reply directly to this address.
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends a one-time code email (email verification or login 2FA) using Azure ACS if
 * available, otherwise Ethereal.
 */
const sendOtpEmail = async ({ to, purpose, code }) => {
  const isVerify = purpose === 'EMAIL_VERIFY';
  const isReset = purpose === 'PASSWORD_RESET';
  
  let subject = 'Your Quirk login verification code';
  let heading = 'Your login code';
  let intro = 'Use the code below to complete your sign-in:';

  if (isVerify) {
    subject = 'Verify your Quirk email address';
    heading = 'Confirm your email';
    intro = 'Use the code below to verify your email address and activate your account:';
  } else if (isReset) {
    subject = 'Reset your Quirk password';
    heading = 'Password Reset';
    intro = 'Use the code below to reset your password:';
  }

  const html = getOtpTemplate(heading, intro, code);

  if (emailClient && process.env.AZURE_ACS_SENDER_ADDRESS) {
    return await sendAzureEmail({ to, name: to, subject, html });
  }
  console.log('[EmailService] Azure ACS not configured. Falling back to Ethereal SMTP...');
  return await sendEtherealEmail({ to, subject, html });
};

/**
 * Generic transactional template with a single call-to-action button.
 */
const getActionTemplate = (heading, body, actionUrl, actionLabel) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f1f5f9; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; }
    .header { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 15px; color: #475569; }
    .btn { display: inline-block; margin: 24px 0; padding: 12px 22px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 999px; font-weight: 600; }
    .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${heading}</div>
    <div class="content">
      <p>${body}</p>
      ${actionUrl ? `<a class="btn" href="${actionUrl}">${actionLabel || 'Open in Quirk'}</a>` : ''}
    </div>
    <div class="footer">You are receiving this because of activity on a Quirk task. Manage notifications in your account settings.</div>
  </div>
</body>
</html>
`;

/**
 * Sends a task-activity notification email (assignment, mention, deadline) using
 * Azure ACS if configured, otherwise Ethereal.
 */
const sendTaskNotificationEmail = async ({ to, name, subject, heading, body, actionUrl }) => {
  const html = getActionTemplate(heading, body, actionUrl, 'View task');
  if (emailClient && process.env.AZURE_ACS_SENDER_ADDRESS) {
    return await sendAzureEmail({ to, name: name || to, subject, html });
  }
  console.log('[EmailService] Azure ACS not configured. Falling back to Ethereal SMTP...');
  return await sendEtherealEmail({ to, subject, html });
};

module.exports = {
  sendOnboardingEmail,
  sendTaskNotificationEmail,
  sendInvitationEmail,
  sendWorkspaceWelcomeEmail,
  sendOtpEmail,
};
