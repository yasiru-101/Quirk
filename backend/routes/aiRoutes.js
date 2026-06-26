const express = require('express');
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

/**
 * @openapi
 * /ai/chat:
 *   post:
 *     summary: Send a message to the Quirk AI assistant
 *     description: >
 *       Runs a multi-turn, tool-calling conversation with the AI assistant scoped
 *       to a single workspace or project context. The assistant may call the
 *       `get_tasks` and `create_task` tools, which re-apply the same object-level
 *       authorization as the REST API, so it can never read or modify work the
 *       caller has no access to. Providers are tried in priority order (Gemini,
 *       then Groq) with automatic fallback when one is rate-limited or unavailable.
 *     tags: [AI Assistant]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message to the assistant.
 *                 example: What tasks are due this week?
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: >
 *                   Project context. The caller must be a member of this project.
 *                   Required for task creation. Either projectId or workspaceId
 *                   must be provided.
 *               workspaceId:
 *                 type: string
 *                 format: uuid
 *                 description: >
 *                   Workspace context, used when no project is open. The caller
 *                   must be a member of this workspace. Either projectId or
 *                   workspaceId must be provided.
 *               history:
 *                 type: array
 *                 description: >
 *                   Prior turns of the conversation for multi-turn context. Only
 *                   the most recent turns are kept to bound token usage.
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: The assistant's reply.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: The assistant's natural-language answer.
 *                 provider:
 *                   type: string
 *                   description: Which AI provider produced the reply (e.g. gemini, groq).
 *                   example: gemini
 *       400:
 *         description: Message is empty, or no workspace/project context was provided.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: The caller does not belong to the requested workspace or project.
 *       503:
 *         description: The AI assistant is not configured (no provider API key set).
 *       500:
 *         description: The AI request failed; the underlying reason is included in the message.
 */
// Require authentication for AI chat
router.post('/chat', protect, aiController.handleChat);

module.exports = router;
