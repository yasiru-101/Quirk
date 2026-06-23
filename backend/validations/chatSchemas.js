/**
 * @file chatSchemas.js
 * @description Zod validation schemas for the chat and direct-message module.
 */

const { z } = require('zod');

// ─── Send a Message ───────────────────────────────────────────────────────────
const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters'),
});

// ─── Create / Open a Direct-Message Conversation ─────────────────────────────
const createDmSchema = z.object({
  targetUserId: z
    .string({ required_error: 'Target user ID is required' })
    .uuid('Target user ID must be a valid UUID'),
  workspaceId: z
    .string({ required_error: 'Workspace ID is required' })
    .uuid('Workspace ID must be a valid UUID'),
});

// ─── List Messages (query params) ─────────────────────────────────────────────
// Parsed separately from req.query, not req.body, so this is used by the
// controller directly rather than through the validate middleware.
const listMessagesQuerySchema = z.object({
  before: z.string().uuid().optional(), // cursor: return messages older than this ID
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

module.exports = {
  sendMessageSchema,
  createDmSchema,
  listMessagesQuerySchema,
};
