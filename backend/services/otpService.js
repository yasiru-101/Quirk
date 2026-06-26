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
  PASSWORD_RESET: 'PASSWORD_RESET',
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

  // Atomically claim one attempt, but only while the code is still unconsumed and
  // under the cap. Performing the limit check and the increment as a single
  // conditional write closes the race where several concurrent submissions each
  // read `attempts < MAX` and collectively exceed the brute-force limit.
  const claim = await prisma.otpCode.updateMany({
    where: { id: record.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (claim.count === 0) {
    return { ok: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    return { ok: false, reason: 'Invalid code.' };
  }

  // Consume atomically; the `consumedAt: null` guard prevents a concurrent request
  // from accepting the same code twice.
  const consumed = await prisma.otpCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count === 0) {
    return { ok: false, reason: 'No active code. Please request a new one.' };
  }

  return { ok: true };
};

/**
 * Delete spent codes: any that have been consumed, or that expired some time ago.
 * OTP rows are ephemeral — once a code is consumed or expired it serves no purpose,
 * so purging keeps the table from growing without bound. A short grace period past
 * expiry is kept so an in-flight verify request still finds its (expired) row and
 * can return a clean "expired" message rather than "no active code".
 *
 * @returns {Promise<number>} number of rows removed.
 */
const purgeExpired = async () => {
  const graceCutoff = new Date(Date.now() - TTL_MS); // expired at least one TTL ago
  const { count } = await prisma.otpCode.deleteMany({
    where: {
      OR: [{ consumedAt: { not: null } }, { expiresAt: { lt: graceCutoff } }],
    },
  });
  return count;
};

module.exports = { issueCode, verifyCode, purgeExpired, PURPOSES };
