/**
 * @file workspaceRoutes.js
 * @description API routes for workspace tenancy, membership, and invitations.
 */

const express = require('express');
const router = express.Router();

const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  listMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  inviteMember,
  verifyInvitation,
  acceptInvitation,
} = require('../controllers/workspaceController');

const { protect } = require('../middleware/auth');
const { requireWorkspaceRole } = require('../middleware/membership');
const validate = require('../middleware/validate');
const {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
} = require('../validations/workspaceSchemas');

// Public route for invitation verification
router.get('/invitations/verify', verifyInvitation);

router.use(protect);

/**
 * @openapi
 * /workspaces:
 *   post:
 *     summary: Create a workspace
 *     description: Creates a workspace and makes the caller its Owner.
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Workspace created }
 *   get:
 *     summary: List the caller's workspaces
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of workspaces the caller belongs to }
 */
router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/', getMyWorkspaces);

/**
 * @openapi
 * /workspaces/invitations/accept:
 *   post:
 *     summary: Accept a workspace invitation
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Invitation accepted }
 *       400: { description: Invalid or expired invitation }
 *       403: { description: Invitation issued to a different email }
 */
router.post('/invitations/accept', validate(acceptInvitationSchema), acceptInvitation);

/**
 * @openapi
 * /workspaces/{id}:
 *   get:
 *     summary: Get a workspace by ID
 *     tags: [Workspaces]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Workspace with members and projects }
 *       403: { description: Not a member }
 */
router.get('/:id', requireWorkspaceRole(), getWorkspaceById);

router.delete('/:id/leave', requireWorkspaceRole(), leaveWorkspace);

// ─── Members ──────────────────────────────────────────────────────────────────
router.get('/:id/members', requireWorkspaceRole(), listMembers);
router.patch(
  '/:id/members/:userId',
  requireWorkspaceRole('Owner', 'Admin'),
  validate(updateMemberRoleSchema),
  updateMemberRole
);
router.delete('/:id/members/:userId', requireWorkspaceRole('Owner', 'Admin'), removeMember);

// ─── Invitations ────────────────────────────────────────────────────────────
router.post(
  '/:id/invitations',
  requireWorkspaceRole('Owner', 'Admin'),
  validate(inviteMemberSchema),
  inviteMember
);

module.exports = router;
