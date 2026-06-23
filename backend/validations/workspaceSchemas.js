/**
 * @file workspaceSchemas.js
 * @description Zod validation schemas for workspace and invitation operations.
 */

const { z } = require('zod');

const WORKSPACE_ROLES = ['Owner', 'Admin', 'Member'];
// Roles that may be granted via invitation or assigned to an existing member.
// Ownership is transferred deliberately, never handed out by invite.
const ASSIGNABLE_ROLES = ['Admin', 'Member'];

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
    .enum(ASSIGNABLE_ROLES, { invalid_type_error: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` })
    .optional()
    .default('Member'),
});

const acceptInvitationSchema = z.object({
  token: z.string({ required_error: 'Invitation token is required' }).min(1, 'Invitation token is required'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(WORKSPACE_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: `Role must be one of: ${WORKSPACE_ROLES.join(', ')}`,
  }),
});

module.exports = {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
};
