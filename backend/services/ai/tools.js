/**
 * @file services/ai/tools.js
 * @description Provider-agnostic tool definitions and their server-side
 * implementations for the AI assistant. Tool *schemas* are declared once in
 * neutral JSON-Schema form; each provider adapter translates them to its own
 * format. Tool *execution* runs here so the same RBAC and data-access rules
 * apply no matter which model (Gemini, Groq, …) decided to call the tool.
 */

const prisma = require('../../config/db');
const { resolveProjectAccess } = require('../../middleware/membership');
const { isPlatformAdmin } = require('../../utils/roles');
const { logActivity } = require('../../utils/activityLogger');

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const normalizePriority = (value) => {
  if (!value) return 'Medium';
  const match = PRIORITIES.find((p) => p.toLowerCase() === String(value).trim().toLowerCase());
  return match || 'Medium';
};

// Parse an ISO date string (YYYY-MM-DD or full ISO). Returns a Date, or
// undefined when absent, or null when present-but-invalid (so callers can
// reject invalid input rather than silently dropping it).
const parseDueDate = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Neutral tool schemas (JSON-Schema style, lowercase types). Adapters convert
// these to provider-specific shapes.
const toolSpecs = [
  {
    name: 'get_tasks',
    description:
      'List tasks in the user\'s current project (or current workspace if no project is open). Use this whenever the user asks what tasks exist, or about their status, priority, or due dates. Supports filtering and sorting by due date.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Optional. Filter by board column/status name, matched case-insensitively (e.g. "To Do", "In Progress", "Done").',
        },
        priority: {
          type: 'string',
          description: 'Optional. Filter by exact priority: Low, Medium, High, or Urgent.',
        },
        due_before: {
          type: 'string',
          description: 'Optional. Only tasks due on or before this date (ISO YYYY-MM-DD).',
        },
        due_after: {
          type: 'string',
          description: 'Optional. Only tasks due on or after this date (ISO YYYY-MM-DD).',
        },
        sort_by: {
          type: 'string',
          description: 'Optional ordering: "due_date" (earliest first, undated last) or "created" (newest first, default).',
        },
      },
    },
  },
  {
    name: 'create_task',
    description:
      'Create a new task in the user\'s current project. Only call this when the user clearly asks to create/add a task. Requires an open project and Project Manager permission.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title of the task.' },
        description: { type: 'string', description: 'Optional longer description.' },
        priority: { type: 'string', description: 'Priority: Low, Medium, High, or Urgent. Defaults to Medium.' },
        due_date: { type: 'string', description: 'Optional due date as ISO YYYY-MM-DD. Resolve relative dates (e.g. "next Friday") against today\'s date before calling.' },
      },
      required: ['title'],
    },
  },
];

/**
 * Execute a tool call. Returns a plain, JSON-serializable object that is fed
 * back to the model. Errors and permission denials are returned (not thrown)
 * as structured results so the model can relay them honestly to the user.
 *
 * @param {string} name
 * @param {object} args
 * @param {{ user: object, projectId?: string, workspaceId?: string }} ctx
 */
async function executeTool(name, args = {}, ctx) {
  try {
    if (name === 'get_tasks') return await getTasks(args, ctx);
    if (name === 'create_task') return await createTask(args, ctx);
    return { error: 'unknown_tool', message: `No such tool: ${name}.` };
  } catch (err) {
    console.error(`AI tool "${name}" failed:`, err);
    return { error: 'tool_error', message: 'The action could not be completed due to a server error.' };
  }
}

async function getTasks(args, ctx) {
  const where = { deletedAt: null };
  if (ctx.projectId) where.projectId = ctx.projectId;
  else if (ctx.workspaceId) where.project = { workspaceId: ctx.workspaceId };
  else return { error: 'no_context', message: 'No project or workspace is open, so there are no tasks to read.' };

  if (args.priority) where.priority = normalizePriority(args.priority);

  // Due-date range filter (e.g. "tasks due this week").
  const dueAfter = parseDueDate(args.due_after);
  const dueBefore = parseDueDate(args.due_before);
  if (dueAfter || dueBefore) {
    where.dueDate = {};
    if (dueAfter) where.dueDate.gte = dueAfter;
    if (dueBefore) where.dueDate.lte = dueBefore;
  }

  // Row-level scoping identical to the REST GET /tasks endpoint: a caller only
  // sees tasks they created, are assigned to, belong to the project of, or
  // administer the workspace of. This prevents a workspace member from reading
  // tasks in projects they are not part of when querying at workspace scope.
  if (!isPlatformAdmin(ctx.user)) {
    where.OR = [
      { createdBy: ctx.user.id },
      { assignments: { some: { userId: ctx.user.id } } },
      { project: { members: { some: { userId: ctx.user.id } } } },
      { project: { workspace: { members: { some: { userId: ctx.user.id, role: { in: ['Owner', 'Admin'] } } } } } },
    ];
  }

  const orderBy = args.sort_by === 'due_date'
    ? { dueDate: { sort: 'asc', nulls: 'last' } }
    : { createdAt: 'desc' };

  const rows = await prisma.task.findMany({
    where,
    select: { id: true, title: true, priority: true, dueDate: true, column: { select: { name: true } } },
    orderBy,
    take: 25,
  });

  let tasks = rows.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.column?.name || 'No status',
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
  }));

  if (args.status) {
    const needle = String(args.status).toLowerCase();
    tasks = tasks.filter((t) => t.status.toLowerCase().includes(needle));
  }

  return { count: tasks.length, tasks };
}

async function createTask(args, ctx) {
  if (!ctx.projectId) {
    return {
      error: 'no_project',
      message: 'No project is currently open. The user needs to navigate to a specific project (e.g. via the sidebar or Projects page) and then ask again.',
    };
  }
  if (!args.title || !String(args.title).trim()) {
    return { error: 'missing_title', message: 'A task title is required.' };
  }

  const dueDate = parseDueDate(args.due_date);
  if (dueDate === null) {
    return { error: 'invalid_due_date', message: 'The due date could not be understood. Use an ISO date like 2026-07-15.' };
  }

  // Same rule as the REST endpoint: only a Project Manager (or workspace
  // Owner/Admin, or platform admin) may create tasks. Collaborators are denied.
  const access = await resolveProjectAccess(ctx.user, ctx.projectId, ['Project Manager']);
  if (!access.ok) {
    if (access.status === 404) {
      return { error: 'not_found', message: 'That project could not be found.' };
    }
    return {
      error: 'permission_denied',
      message:
        'You do not have permission to create tasks in this project. Only a Project Manager (or a workspace admin) can do that.',
    };
  }

  // Find the first column (lowest order) of the project so the new task
  // appears on the board immediately instead of floating without a column.
  const firstColumn = await prisma.kanbanColumn.findFirst({
    where: { projectId: ctx.projectId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  const task = await prisma.task.create({
    data: {
      title: String(args.title).trim(),
      description: args.description ? String(args.description) : null,
      priority: normalizePriority(args.priority),
      dueDate: dueDate || null,
      projectId: ctx.projectId,
      columnId: firstColumn?.id ?? null,
      createdBy: ctx.user.id,
    },
  });

  await logActivity(task.id, ctx.user.id, 'task_created', { title: task.title }).catch(() => {});

  return {
    status: 'success',
    task: {
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    },
  };
}

module.exports = { toolSpecs, executeTool };
