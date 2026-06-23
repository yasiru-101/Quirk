const { z } = require('zod');

// Password regex to enforce: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'), // Just check presence on login
});

const resetPasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
});

// Six-digit one-time code (email verification / 2FA).
const otpCodeSchema = z
  .string({ required_error: 'Code is required' })
  .trim()
  .regex(/^\d{6}$/, 'Code must be 6 digits');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
});

const verifyEmailSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Please enter a valid email address').toLowerCase().trim(),
  code: otpCodeSchema,
});

const resendVerificationSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Please enter a valid email address').toLowerCase().trim(),
});

const verifyTwoFactorSchema = z.object({
  pendingToken: z.string({ required_error: 'Login session token is required' }).min(1, 'Login session token is required'),
  code: otpCodeSchema,
});

const confirmTwoFactorSchema = z.object({
  code: otpCodeSchema,
});

const disableTwoFactorSchema = z.object({
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = {
  loginSchema,
  resetPasswordSchema,
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  verifyTwoFactorSchema,
  confirmTwoFactorSchema,
  disableTwoFactorSchema,
};
