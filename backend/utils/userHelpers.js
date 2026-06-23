/**
 * @file userHelpers.js
 * @description Security utility functions for user management operations.
 *
 * This module provides helper functions that enforce the security requirements
 * defined in the SRS and implementation plan:
 *
 * 1. generateTempPassword() — Creates a random temporary password for user
 *    onboarding that satisfies the password complexity policy.
 *
 * 2. checkLastAdmin(userId) — Prevents the system from losing all administrator
 *    access by blocking deactivation or role changes on the last active Admin.
 *
 * These helpers are imported by the user controller (controllers/userController.js)
 * to enforce security rules during user creation and modification.
 */

const crypto = require('crypto');
const prisma = require('../config/db');

// ─── Password Complexity Constants ──────────────────────────────────────────
// These match the password policy enforced by the frontend (constants.js)
// and backend (validations/authSchemas.js):
//   - Minimum 8 characters
//   - At least 1 uppercase letter
//   - At least 1 lowercase letter
//   - At least 1 digit
//   - At least 1 special character
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIALS = '@$!%*?&#';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIALS;

// Regex used to validate the generated password (same as in authSchemas.js)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

/**
 * Generates a cryptographically random temporary password that satisfies
 * the system's password complexity requirements.
 *
 * The algorithm guarantees compliance by:
 *   1. Placing one character from each required category in the first 4 positions.
 *   2. Filling the remaining positions with random characters from the full set.
 *   3. Shuffling the entire array using Fisher-Yates to avoid predictable patterns.
 *
 * @param {number} [length=12] - The desired password length. Must be >= 8.
 * @returns {string} A plaintext temporary password. The caller must hash this
 *   with bcrypt before storing it in the database.
 *
 * @example
 *   const tempPassword = generateTempPassword();
 *   // e.g. "aK7#mPx!rQ2b"
 */
const generateTempPassword = (length = 12) => {
  const password = [];

  // --- Step 1: Guarantee at least one character from each required category ---
  // This ensures the generated password always passes the complexity regex.
  password.push(UPPERCASE[crypto.randomInt(UPPERCASE.length)]);
  password.push(LOWERCASE[crypto.randomInt(LOWERCASE.length)]);
  password.push(DIGITS[crypto.randomInt(DIGITS.length)]);
  password.push(SPECIALS[crypto.randomInt(SPECIALS.length)]);

  // --- Step 2: Fill remaining positions with random characters ---
  for (let i = 4; i < length; i++) {
    password.push(ALL_CHARS[crypto.randomInt(ALL_CHARS.length)]);
  }

  // --- Step 3: Fisher-Yates shuffle to randomize character positions ---
  // Without this, the first 4 characters would always follow a predictable
  // pattern (uppercase, lowercase, digit, special), making passwords guessable.
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

/**
 * Checks whether the given user is the last active Administrator in the system.
 * If so, throws an error to prevent deactivation or role change.
 *
 * This safeguard ensures the system always retains at least one active Admin,
 * preventing a state where no one can manage users.
 *
 * @param {string} userId - The UUID of the user being modified.
 * @throws {Error} Throws an error with status 400 if the user is the last active Admin.
 *
 * @example
 *   // In userController.js before deactivating or changing role:
 *   await checkLastAdmin(userId);
 *   // If this line is reached, it's safe to proceed.
 */
const checkLastAdmin = async (userId) => {
  const targetId = userId;

  // Count how many active users currently hold the 'Admin' role
  const activeAdminCount = await prisma.user.count({
    where: {
      role: 'Admin',
      isActive: true,
    },
  });

  // If there's only one active Admin left, check if it's the user being modified
  if (activeAdminCount <= 1) {
    // Find the single remaining Admin to compare IDs
    const lastAdmin = await prisma.user.findFirst({
      where: { role: 'Admin', isActive: true },
    });

    // If the user being modified IS the last Admin, block the operation
    if (lastAdmin && lastAdmin.id === targetId) {
      const error = new Error(
        'Cannot modify the last active Administrator. At least one Admin must remain active.'
      );
      error.status = 400;
      throw error;
    }
  }
};

module.exports = {
  generateTempPassword,
  checkLastAdmin,
  PASSWORD_REGEX,
};
