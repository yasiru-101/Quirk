/**
 * @file taskController.js
 * @description Controller handling Task CRUD, column updates, user assignments, and resource cleanups.
 * Emits activity log entries via activityLogger after every meaningful mutation.
 */

const prisma = require('../config/db');
const blobService = require('../services/blobService');
const { logActivity } = require('../utils/activityLogger');
const { resolveProjectAccess, resolveTaskAccess } = require('../middleware/membership');
const { isPlatformAdmin } = require('../utils/roles');

const taskResponseInclude = {
  column: {
    select: {
      id: true,
      name: true,
      order: true,
      projectId: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignments: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  },
  project: { select: { id: true, name: true, workspaceId: true } },
};

const formatTask = (task) => {
  const formatted = { ...task };
  formatted.createdBy = task.creator;
  formatted.assignees = task.assignments.map((a) => a.user);
  if (task.project) {
    formatted.projectName = task.project.name;
  }
  delete formatted.creator;
  delete formatted.assignments;
  return formatted;
};

const parseDate = (value) => {
  if (!value) return null;
  return new Date(value);
};

const ensureProjectAssignees = async (projectId, assigneeIds) => {
  if (!assigneeIds?.length) return null;
  if (!projectId) {
    return { assigneeIds: 'Assignees require a selected project.' };
  }
  const validAssignees = await prisma.projectMember.count({
    where: { projectId, userId: { in: assigneeIds } },
  });
  return validAssignees === assigneeIds.length
    ? null
    : { assigneeIds: 'Assignees must be members of the selected project.' };
};

const resolveTaskPlacement = async ({ projectId, columnId }) => {
  if (columnId) {
    const column = await prisma.kanbanColumn.findUnique({ where: { id: columnId } });
    if (!column) {
      return { error: { status: 400, message: 'Invalid column ID.' } };
    }
    if (projectId && column.projectId !== projectId) {
      return { error: { status: 400, message: 'Column does not belong to the selected project.' } };
    }
    return { projectId: projectId || column.projectId, columnId };
  }

  if (!projectId) {
    return { projectId: null, columnId: null };
  }

  const firstColumn = await prisma.kanbanColumn.findFirst({
    where: { projectId },
    orderBy: { order: 'asc' },
  });

  return { projectId, columnId: firstColumn?.id || null };
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager only)
const createTask = async (req, res) => {
  const { title, description, dueDate, priority, projectId, tags,
          parentTaskId, epicId, columnId, estimatedHours, assigneeIds = [] } = req.body;

  try {
    const placement = await resolveTaskPlacement({ projectId, columnId });
    if (placement.error) {
      return res.status(placement.error.status).json({ message: placement.error.message });
    }

    // A task created inside a project requires manager access to that project.
    if (placement.projectId) {
      const access = await resolveProjectAccess(req.user, placement.projectId, ['Project Manager']);
      if (!access.ok) {
        return res.status(access.status === 404 ? 404 : 403).json({
          message: access.status === 404
            ? 'Project not found'
            : 'Access denied. Only a project manager can create tasks in this project.',
        });
      }
    }

    const assigneeErrors = await ensureProjectAssignees(placement.projectId, assigneeIds);
    if (assigneeErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: assigneeErrors,
      });
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title,
          description,
          dueDate:        parseDate(dueDate),
          priority:       priority       || 'Medium',
          projectId:      placement.projectId,
          tags:           tags           || [],
          parentTaskId:   parentTaskId   || null,
          epicId:         epicId         || null,
          columnId:       placement.columnId,
          estimatedHours: estimatedHours || null,
          createdBy: req.user.id,
        },
      });

      if (assigneeIds.length) {
        await tx.taskAssignment.createMany({
          data: assigneeIds.map((userId) => ({ taskId: created.id, userId })),
          skipDuplicates: true,
        });
      }

      return tx.task.findUnique({
        where: { id: created.id },
        include: taskResponseInclude,
      });
    });

    // Write audit log entry
    await logActivity(task.id, req.user.id, 'task_created', { title });
    if (assigneeIds.length) {
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAssignment(task.id, assigneeIds, req.user.name);
    }

    return res.status(201).json({ task: formatTask(task) });
  } catch (error) {
    console.error(`Create task error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task creation',
    });
  }
};

// @desc    Get all tasks with optional column and priority filtering
// @route   GET /api/tasks
// @access  Private (PM & Collaborator)
const getTasks = async (req, res) => {
  const { columnId, priority, parentTaskId, projectId } = req.query;
  const where = {};

  try {
    // Apply filters if provided
    if (columnId)     where.columnId     = columnId;
    if (priority)     where.priority     = priority;
    if (projectId)    where.projectId    = projectId;
    // parentTaskId filter: 'null' string = top-level tasks only, uuid = subtasks of that parent
    if (parentTaskId === 'null') where.parentTaskId = null;
    else if (parentTaskId)      where.parentTaskId = parentTaskId;

    // Scope to tasks the caller can access: created by them, assigned to them, in a
    // project they belong to, or in a workspace they own/administer. Platform admins
    // see everything.
    if (!isPlatformAdmin(req.user)) {
      where.OR = [
        { createdBy: req.user.id },
        { assignments: { some: { userId: req.user.id } } },
        { project: { members: { some: { userId: req.user.id } } } },
        { project: { workspace: { members: { some: { userId: req.user.id, role: { in: ['Owner', 'Admin'] } } } } } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ...taskResponseInclude,
      },
    });

    const formattedTasks = tasks.map(formatTask);

    return res.status(200).json({
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error(`Get tasks error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching tasks list',
    });
  }
};

// @desc    Get task details by ID with populated assignments and comments
// @route   GET /api/tasks/:id
// @access  Private (PM & Collaborator)
const getTaskById = async (req, res) => {
  const { id } = req.params;
  const targetId = id;

  try {
    // Fetch the task document including relationships using Prisma
    const task = await prisma.task.findUnique({
      where: { id: targetId },
      include: {
        ...taskResponseInclude,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Combine task details with assignments and comments for response mapped to frontend format
    const taskObject = formatTask(task);
    
    // Convert comment list fields if necessary (already contains .user populated by Prisma relation)
    taskObject.comments = task.comments;
    
    if (task.attachments) {
      taskObject.attachments = await Promise.all(task.attachments.map(async (att) => ({
        ...att,
        downloadUrl: await blobService.getDownloadUrl(att.blobUrl),
      })));
    } else {
      taskObject.attachments = [];
    }

    return res.status(200).json({
      task: taskObject,
    });
  } catch (error) {
    console.error(`Get task details error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching task details',
    });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Project Manager only)
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, priority, projectId, tags,
          parentTaskId, epicId, columnId, estimatedHours, assigneeIds } = req.body;
  const targetId = id;

  try {
    const task = await prisma.task.findUnique({ where: { id: targetId } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // A task cannot be its own parent: the self-relation cascades on delete, so a
    // self-reference is a corrupt state that has no valid subtask semantics.
    if (parentTaskId !== undefined && parentTaskId === targetId) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { parentTaskId: 'A task cannot be its own parent.' },
      });
    }

    const nextProjectId = projectId !== undefined ? projectId : task.projectId;
    const placement = columnId !== undefined || projectId !== undefined
      ? await resolveTaskPlacement({ projectId: nextProjectId, columnId })
      : { projectId: nextProjectId, columnId: task.columnId };
    if (placement.error) {
      return res.status(placement.error.status).json({ message: placement.error.message });
    }

    const assigneeErrors = await ensureProjectAssignees(placement.projectId, assigneeIds);
    if (assigneeErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: assigneeErrors,
      });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: targetId },
        data: {
          title:          title          !== undefined ? title                          : undefined,
          description:    description    !== undefined ? description                    : undefined,
          dueDate:        dueDate        !== undefined ? parseDate(dueDate)             : undefined,
          priority:       priority       !== undefined ? priority                       : undefined,
          projectId:      projectId      !== undefined ? placement.projectId            : undefined,
          tags:           tags           !== undefined ? tags                           : undefined,
          parentTaskId:   parentTaskId   !== undefined ? parentTaskId                   : undefined,
          epicId:         epicId         !== undefined ? epicId                         : undefined,
          columnId:       columnId       !== undefined ? placement.columnId             : undefined,
          estimatedHours: estimatedHours !== undefined ? estimatedHours                 : undefined,
        },
      });

      if (assigneeIds) {
        await tx.taskAssignment.deleteMany({ where: { taskId: targetId } });
        if (assigneeIds.length) {
          await tx.taskAssignment.createMany({
            data: assigneeIds.map((userId) => ({ taskId: targetId, userId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.task.findUnique({
        where: { id: targetId },
        include: taskResponseInclude,
      });
    });

    await logActivity(targetId, req.user.id, 'task_updated', { updatedFields: Object.keys(req.body) });
    if (assigneeIds?.length) {
      const notificationService = require('../services/notificationService');
      await notificationService.notifyAssignment(targetId, assigneeIds, req.user.name);
    }

    return res.status(200).json({ task: formatTask(updatedTask) });
  } catch (error) {
    console.error(`Update task error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task update',
    });
  }
};

// @desc    Move a task to a workflow column
// @route   PATCH /api/tasks/:id/column
// @access  Private (PM or assigned Collaborator)
const updateTaskColumn = async (req, res) => {
  const { id } = req.params;
  const { columnId } = req.body;
  const targetId = id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: targetId },
      include: { column: true },
    });
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Managers (project managers, workspace owners/admins, platform admins) may move
    // any task on the board. Everyone else (plain collaborators) may only move tasks
    // they created or are assigned to. We check capability by resource — not by the
    // caller's *global* role — so a workspace owner whose global role is Collaborator
    // is not wrongly blocked.
    const managerAccess = await resolveTaskAccess(req.user, targetId, ['Project Manager']);
    if (!managerAccess.ok) {
      const isAssigned = await prisma.taskAssignment.findUnique({
        where: { taskId_userId: { taskId: targetId, userId: req.user.id } },
      });
      if (!isAssigned && task.createdBy !== req.user.id) {
        return res.status(403).json({
          message: 'Access denied: You can only move tasks assigned to you.',
        });
      }
    }

    const column = await prisma.kanbanColumn.findUnique({ where: { id: columnId } });
    if (!column) {
      return res.status(400).json({ message: 'Invalid column ID.' });
    }
    if (task.projectId && column.projectId !== task.projectId) {
      return res.status(400).json({ message: 'Column does not belong to this task project.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: targetId },
      data: { columnId, projectId: task.projectId || column.projectId },
      include: taskResponseInclude,
    });

    // Trigger real-time notifications
    const notificationService = require('../services/notificationService');
    await notificationService.notifyColumnChange(targetId, column.name, req.user.name, req.user.id);

    await logActivity(targetId, req.user.id, 'column_changed', {
      from: task.column ? { id: task.column.id, name: task.column.name } : null,
      to: { id: column.id, name: column.name },
    });

    return res.status(200).json({ task: formatTask(updatedTask) });
  } catch (error) {
    console.error(`Patch task column error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task column update',
    });
  }
};

// @desc    Delete a task and clean up references (assignments and comments)
// @route   DELETE /api/tasks/:id
// @access  Private (Project Manager only)
const deleteTask = async (req, res) => {
  const { id } = req.params;
  const targetId = id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: targetId },
    });
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Fetch assigned users to notify them before assignments are deleted
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: targetId },
    });
    const assignedUserIds = assignments.map((a) => a.userId);

    // Delete the task document (Prisma cascade onDelete will automatically clean up assignments, comments, attachments)
    await prisma.task.delete({
      where: { id: targetId },
    });

    // Notify assigned users about deletion
    const notificationService = require('../services/notificationService');
    for (const userId of assignedUserIds) {
      await notificationService.notifyAdmin(
        `Task "${task.title}" has been deleted by Project Manager ${req.user.name}`,
        userId
      );
    }

    return res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error(`Delete task error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task deletion',
    });
  }
};

// @desc    Assign users to a task
// @route   POST /api/tasks/:id/assign
// @access  Private (Project Manager only)
const assignUsers = async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  const targetId = id;
  const parsedUserIds = userIds.map((uid) => uid);

  try {
    // 1. Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: targetId },
    });
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    const assignmentErrors = await ensureProjectAssignees(task.projectId, parsedUserIds);
    if (assignmentErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: assignmentErrors,
      });
    }

    // 3. Update assignments in a transaction
    await prisma.$transaction([
      prisma.taskAssignment.deleteMany({ where: { taskId: targetId } }),
      prisma.taskAssignment.createMany({
        data: parsedUserIds.map((userId) => ({
          taskId: targetId,
          userId,
        })),
      }),
    ]);

    // Trigger real-time notifications
    const notificationService = require('../services/notificationService');
    await notificationService.notifyAssignment(targetId, parsedUserIds, req.user.name);

    return res.status(200).json({
      message: 'Task assignments updated successfully',
      assignedUserIds: parsedUserIds,
    });
  } catch (error) {
    console.error(`Assign users error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task assignment',
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskColumn,
  deleteTask,
  assignUsers,
};
