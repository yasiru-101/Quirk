/**
 * @file otpService.js
 * @description Issues and verifies one-time codes for email verification and login
 * 2FA. Codes are six numeric digits, generated with a cryptographically secure RNG,
 * stored only as a bcrypt hash, and are single-use, time-limited, and attempt-limited.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');

const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

const PURPOSES = Object.freeze({
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  LOGIN_2FA: 'LOGIN_2FA',
});

// Generate a zero-padded numeric code using a uniform, non-biased RNG.
const generateCode = () => {
  const max = 10 ** CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(CODE_LENGTH, '0');
};

/**
 * Issue a fresh code for a user and purpose. Any earlier unconsumed code for the
 * same purpose is discarded so only one code is ever valid at a time.
 *
 * @returns {Promise<string>} the plaintext code, to be delivered by email.
 */
const issueCode = async (userId, purpose) => {
  await prisma.otpCode.deleteMany({ where: { userId, purpose, consumedAt: null } });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

  await prisma.otpCode.create({
    data: { userId, purpose, codeHash, expiresAt: new Date(Date.now() + TTL_MS) },
  });

  return code;
};

/**
 * Verify a submitted code. On success the code is consumed and cannot be reused.
 * A wrong code increments the attempt counter and is rejected once the limit is hit.
 *
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
const verifyCode = async (userId, purpose, code) => {
  const record = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { ok: false, reason: 'No active code. Please request a new one.' };

  if (record.expiresAt < new Date()) {
    await prisma.otpCode.delete({ where: { id: record.id } });
    return { ok: false, reason: 'This code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: 'Invalid code.' };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
};

module.exports = { issueCode, verifyCode, PURPOSES };
