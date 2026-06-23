/**
 * @file chatRoutes.js
 * @description API routes for the chat and direct-message module.
 *
 * All routes require authentication (protect middleware applied at the top).
 * Project-conversation routes additionally require project membership, enforced
 * by requireProjectRole from the membership middleware.
 */

const express = require('express');
const router = express.Router();

const {
  listConversations,
  getOrCreateProjectConversation,
  getOrCreateDmConversation,
  getMessages,
  sendMessage,
  deleteMessage,
} = require('../controllers/chatController');

const { protect } = require('../middleware/auth');
const { requireProjectRole } = require('../middleware/membership');
const validate = require('../middleware/validate');
const { sendMessageSchema, createDmSchema } = require('../validations/chatSchemas');

router.use(protect);

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /chat/conversations:
 *   get:
 *     summary: List the caller's conversations
 *     description: Returns all conversations (project rooms and DMs) the authenticated user participates in, newest first, with the latest message preview.
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 */
router.get('/conversations', listConversations);

/**
 * @openapi
 * /chat/conversations/dm:
 *   post:
 *     summary: Open or retrieve a direct-message conversation
 *     description: |
 *       Finds the existing DM conversation between the caller and the target user
 *       within the given workspace, or creates one if none exists.
 *       Both users must be workspace members; a caller who is not a member receives 403.
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId, workspaceId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the user to message
 *               workspaceId:
 *                 type: string
 *                 format: uuid
 *                 description: Shared workspace that scopes the DM
 *     responses:
 *       200: { description: Existing DM conversation returned }
 *       201: { description: New DM conversation created }
 *       400: { description: Validation error or self-DM attempted }
 *       403: { description: Caller or target not a workspace member }
 */
router.post('/conversations/dm', validate(createDmSchema), getOrCreateDmConversation);

/**
 * @openapi
 * /chat/conversations/project/{projectId}:
 *   post:
 *     summary: Open or retrieve a project group conversation
 *     description: |
 *       Returns the existing group conversation for the project, or creates one and
 *       seeds it with current project members.
 *       Caller must be a ProjectMember (or workspace Owner/Admin).
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Project conversation returned }
 *       403: { description: Not a project member }
 *       404: { description: Project not found }
 */
router.post(
  '/conversations/project/:projectId',
  requireProjectRole(),
  getOrCreateProjectConversation
);

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Fetch message history
 *     description: |
 *       Returns up to `limit` messages (default 50, max 100) in ascending
 *       chronological order. Pass `before=<messageId>` for cursor-based pagination
 *       (load older messages).
 *       Caller must be a conversation participant.
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: conversationId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: before
 *         in: query
 *         required: false
 *         schema: { type: string, format: uuid }
 *         description: Return messages older than this message ID
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 100 }
 *     responses:
 *       200: { description: Paginated message list }
 *       403: { description: Not a participant }
 *   post:
 *     summary: Send a message
 *     description: Persists the message and pushes a chat:message event to all connected participants via Socket.IO.
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: conversationId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 4000
 *     responses:
 *       201: { description: Message created and delivered }
 *       403: { description: Not a participant }
 */
router.get('/conversations/:conversationId/messages', getMessages);
router.post(
  '/conversations/:conversationId/messages',
  validate(sendMessageSchema),
  sendMessage
);

/**
 * @openapi
 * /chat/conversations/{conversationId}/messages/{messageId}:
 *   delete:
 *     summary: Delete (soft-delete) a message
 *     description: Only the message author may delete it. The message row is retained and its content replaced with "[deleted]" on subsequent reads.
 *     tags: [Chat]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: conversationId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: messageId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Message deleted }
 *       403: { description: Not the message author }
 *       404: { description: Message not found }
 */
router.delete('/conversations/:conversationId/messages/:messageId', deleteMessage);

module.exports = router;
