/**
 * @file taskSchemas.js
 * @description Zod validation schemas for Task and Comment operations.
 */

const { z } = require('zod');

// Allowed status and priority values matching the Mongoose Task model
const VALID_STATUSES = ['To Do', 'In Progress', 'Completed'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// Custom validator to check if a date is in the present/future (with a 1-minute grace period)
const isFutureOrPresentDate = (val) => {
  if (!val) return true;
  const dateVal = new Date(val);
  return dateVal.getTime() >= Date.now() - 60000;
};

// ─── Create Task Schema ──────────────────────────────────────────────────────
// Used on: POST /api/tasks (PM creates a task)
const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .optional(),

  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO datetime string' })
    .refine(isFutureOrPresentDate, {
      message: 'Due date must be in the future or present',
    })
    .optional()
    .or(z.string().length(0)), // Allow empty string as optional

  priority: z
    .enum(VALID_PRIORITIES, {
      invalid_type_error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    })
    .default('Medium'),

  status: z
    .enum(VALID_STATUSES, {
      invalid_type_error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
    })
    .default('To Do'),
});

// ─── Update Task Schema ──────────────────────────────────────────────────────
// Used on: PUT /api/tasks/:id (PM updates task details)
const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(100, 'Title cannot exceed 100 characters')
      .optional(),

    description: z
      .string()
      .trim()
      .optional(),

    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO datetime string' })
      .refine(isFutureOrPresentDate, {
        message: 'Due date must be in the future or present',
      })
      .optional()
      .or(z.string().length(0)),

    priority: z
      .enum(VALID_PRIORITIES, {
        invalid_type_error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
      })
      .optional(),

    status: z
      .enum(VALID_STATUSES, {
        invalid_type_error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      })
      .optional(),
  })
  .refine(
    // Require at least one field to prevent empty updates
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

// ─── Assign Users Schema ─────────────────────────────────────────────────────
// Used on: POST /api/tasks/:id/assign (PM assigns users to task)
const assignTaskSchema = z.object({
  userIds: z
    .array(
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    , { required_error: 'userIds is required' })
    .min(1, 'At least one user ID must be provided'),
});

// ─── Update Status Schema ────────────────────────────────────────────────────
// Used on: PATCH /api/tasks/:id/status (Collaborators/PM updating status)
const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    required_error: 'Status is required',
    invalid_type_error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
  }),
});

// ─── Create Comment Schema ───────────────────────────────────────────────────
// Used on: POST /api/tasks/:taskId/comments
const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateStatusSchema,
  createCommentSchema,
};
