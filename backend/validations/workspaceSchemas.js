/**
 * @file workspaceSchemas.js
 * @description Zod validation schemas for workspace and invitation operations.
 */

const { z } = require('zod');

const WORKSPACE_ROLES = ['Owner', 'Admin', 'Member'];
// Roles that may be granted via invitation. Ownership is transferred deliberately.
const ASSIGNABLE_VIA_INVITE = ['Admin', 'Member'];
// Roles that may be set when updating an existing member. Ownership can only be
// transferred by the current Owner; Admins may set Member or Admin only.
const ASSIGNABLE_ROLES = ['Owner', 'Admin', 'Member'];

const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: 'Workspace name is required' })
    .trim()
    .min(1, 'Workspace name cannot be empty')
    .max(80, 'Workspace name cannot exceed 80 characters'),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .optional(),
});

const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  role: z
    .enum(ASSIGNABLE_VIA_INVITE, { invalid_type_error: `Invited role must be one of: ${ASSIGNABLE_VIA_INVITE.join(', ')}` })
    .optional()
    .default('Member'),
});

const acceptInvitationSchema = z.object({
  token: z.string({ required_error: 'Invitation token is required' }).min(1, 'Invitation token is required'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
  }),
});

module.exports = {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
};
