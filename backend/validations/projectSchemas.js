/**
 * @file projectSchemas.js
 * @description Zod validation schemas for Project and KanbanColumn operations.
 */

const { z } = require('zod');

const TEMPLATE_TYPES = ['Software Development', 'Marketing Campaign', 'Basic Kanban'];

// ─── Create Project Schema ────────────────────────────────────────────────────
const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),

  templateType: z
    .enum(TEMPLATE_TYPES, {
      invalid_type_error: `Template must be one of: ${TEMPLATE_TYPES.join(', ')}`,
    })
    .optional(),

  templateId: z.string().uuid('Invalid template ID format').optional(),

  // Optional custom workflow columns chosen at creation. When provided they
  // override the template/templateType defaults, so users can tailor the board
  // up front instead of creating then reconfiguring.
  columns: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Column name cannot be empty').max(50, 'Column name cannot exceed 50 characters'),
        order: z.number().int().nonnegative().optional(),
      })
    )
    .min(1, 'Provide at least one column')
    .max(12, 'A project can start with at most 12 columns')
    .optional(),

  workspaceId: z
    .string({ required_error: 'Workspace is required' })
    .uuid('Invalid workspace ID format'),
});

// ─── Update Project Schema ────────────────────────────────────────────────────
const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),

  status: z
    .enum(['active', 'archived'], {
      invalid_type_error: 'Status must be either "active" or "archived"',
    })
    .optional(),
});

// ─── Create KanbanColumn Schema ───────────────────────────────────────────────
const createColumnSchema = z.object({
  name: z
    .string({ required_error: 'Column name is required' })
    .trim()
    .min(1, 'Column name cannot be empty')
    .max(50, 'Column name cannot exceed 50 characters'),

  order: z.number().int().nonnegative().optional(),
});

const updateColumnSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Column name cannot be empty')
    .max(50, 'Column name cannot exceed 50 characters')
    .optional(),
  order: z.number().int().nonnegative().optional(),
});

module.exports = { createProjectSchema, updateProjectSchema, createColumnSchema, updateColumnSchema };
