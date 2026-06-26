/**
 * @file taskSchemas.js
 * @description Zod validation schemas for Task and Comment operations.
 */

const { z } = require('zod');

// Allowed task priority values matching the Prisma Task model.
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Custom validator to check if a date is in the present/future (with a 1-minute grace period)
const isFutureOrPresentDate = (val) => {
  if (!val) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${val}T00:00:00.000`).getTime() >= today.getTime();
  }
  const dateVal = new Date(val);
  return dateVal.getTime() >= Date.now() - 60000;
};

const optionalDateString = z
  .string()
  .refine((val) => !val || !Number.isNaN(new Date(val).getTime()), {
    message: 'Due date must be a valid date',
  })
  .refine(isFutureOrPresentDate, {
    message: 'Due date must be in the future or present',
  })
  .optional()
  .or(z.string().length(0));

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
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),

  dueDate: optionalDateString,

  priority: z
    .enum(VALID_PRIORITIES, {
      invalid_type_error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    })
    .default('Medium'),

  projectId: z.string().uuid('Invalid project ID format').optional(),
  
  tags: z.array(z.string().trim().min(1)).optional().default([]),

  // ── New SRS fields (Phase 2 expansion) ────────────────────────────────────
  parentTaskId:   z.string().uuid('Invalid parent task ID format').optional(),
  epicId:         z.string().uuid('Invalid epic ID format').optional(),
  columnId:       z.string().uuid('Invalid column ID format').optional(),
  estimatedHours: z.number().positive('Estimated hours must be positive').optional(),

  assigneeIds: z.array(z.string().uuid('Invalid user ID format')).optional().default([]),
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
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),

    dueDate: optionalDateString,

    priority: z
      .enum(VALID_PRIORITIES, {
        invalid_type_error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
      })
      .optional(),

    projectId: z.string().uuid('Invalid project ID format').optional(),
    
    tags: z.array(z.string().trim().min(1)).optional(),

    // ── New SRS fields (Phase 2 expansion) ──────────────────────────────────
    parentTaskId:   z.string().uuid('Invalid parent task ID format').optional(),
    epicId:         z.string().uuid('Invalid epic ID format').optional(),
    columnId:       z.string().uuid('Invalid column ID format').optional(),
    estimatedHours: z.number().positive('Estimated hours must be positive').optional(),

    assigneeIds: z.array(z.string().uuid('Invalid user ID format')).optional(),
  })
  .refine(
    // Require at least one field to prevent empty updates
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

// ─── Assign Users Schema ─────────────────────────────────────────────────────
// Used on: POST /api/tasks/:id/assign (PM assigns users to task)
// User IDs are UUID strings
const userIdSchema = z.string().uuid('Invalid user ID format');

const assignTaskSchema = z.object({
  userIds: z
    .array(userIdSchema, { required_error: 'userIds is required' })
    .min(1, 'At least one user ID must be provided'),
});

// ─── Update Column Schema ────────────────────────────────────────────────────
// Used on: PATCH /api/tasks/:id/column (Collaborators/PM moving workflow column)
const updateColumnSchema = z.object({
  columnId: z
    .string({ required_error: 'Column ID is required' })
    .uuid('Invalid column ID format'),
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

// ─── Create Time Log Schema ───────────────────────────────────────────────────
// Used on: POST /api/tasks/:id/timelogs
const createTimeLogSchema = z.object({
  hours: z
    .number({ required_error: 'Hours are required' })
    .positive('Hours must be positive')
    .multipleOf(0.5, 'Hours must be in 0.5 increments'),

  note: z.string().trim().max(200, 'Note cannot exceed 200 characters').optional(),

  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO datetime string' })
    .optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateColumnSchema,
  createCommentSchema,
  createTimeLogSchema,
};
