/**
 * @file userSchemas.js
 * @description Zod validation schemas for user management endpoints (Admin only).
 *
 * These schemas enforce the validation rules defined in the SRS:
 *   - Required fields: name, email, role (for creation)
 *   - Email must be valid and unique (uniqueness enforced at DB level)
 *   - All inputs must be validated before submission
 *
 * The schemas are consumed by the `validate` middleware (middleware/validate.js)
 * which runs Zod's `safeParse` and returns structured error responses matching
 * the frontend's expected format: { message, errors: { field: message } }.
 *
 * Valid roles (from SRS §Authorization & RBAC):
 *   - 'Admin'
 *   - 'Project Manager'
 *   - 'Collaborator'
 */

const { z } = require('zod');

// ─── Allowed role values ─────────────────────────────────────────────────────
// These must match the role values defined in the Prisma User model (prisma/schema.prisma).
const VALID_ROLES = ['Admin', 'Project Manager', 'Collaborator'];

// ─── Create User Schema ──────────────────────────────────────────────────────
// Used on: POST /api/users
// Admin creates a new user. The backend generates a temporary password and
// sends an onboarding email, so password is NOT part of this schema.
const createUserSchema = z.object({
  // Name: required, trimmed, minimum 2 characters, maximum 50 characters
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters'),

  // Email: required, valid format, lowercased for consistent storage
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  // Role: required, must be one of the three defined roles
  role: z.enum(VALID_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
  }),
});

// ─── Update User Schema ─────────────────────────────────────────────────────
// Used on: PUT /api/users/:id
// Admin updates an existing user's details. All fields are optional since
// partial updates are supported. At least one field should be present.
const updateUserSchema = z
  .object({
    // Name: optional, but if provided must be at least 2 and at most 50 characters
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),

    // Email: optional, but if provided must be a valid email
    email: z
      .string()
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim()
      .optional(),

    // Role: optional, but if provided must be a valid role enum
    role: z
      .enum(VALID_ROLES, {
        invalid_type_error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
      })
      .optional(),

    // isActive: optional boolean for activating/deactivating users
    isActive: z
      .boolean({ invalid_type_error: 'isActive must be a boolean' })
      .optional(),
  })
  .refine(
    // Ensure at least one field is being updated to prevent empty updates
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

module.exports = {
  createUserSchema,
  updateUserSchema,
};
