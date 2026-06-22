/**
 * @file taskController.js
 * @description Controller handling Task CRUD, status updates, user assignments, and resource cleanups.
 */

const prisma = require('../config/db');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager only)
const createTask = async (req, res) => {
  const { title, description, dueDate, priority, status } = req.body;

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        createdBy: req.user.id,
      },
    });

    return res.status(201).json({
      task,
    });
  } catch (error) {
    console.error(`Create task error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task creation',
    });
  }
};

// @desc    Get all tasks with optional status and priority filtering
// @route   GET /api/tasks
// @access  Private (PM & Collaborator)
const getTasks = async (req, res) => {
  const { status, priority } = req.query;
  const where = {};

  try {
    // Apply filters if provided
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Map tasks to shape expected by frontend (createdBy as object, assignments as assignees array of users)
    const formattedTasks = tasks.map((task) => {
      const t = { ...task };
      t.createdBy = task.creator;
      t.assignees = task.assignments.map((a) => a.user);
      delete t.creator;
      delete t.assignments;
      return t;
    });

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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Combine task details with assignments and comments for response mapped to frontend format
    const taskObject = { ...task };
    taskObject.createdBy = task.creator;
    taskObject.assignees = task.assignments.map((a) => a.user);
    
    // Convert comment list fields if necessary (already contains .user populated by Prisma relation)
    taskObject.comments = task.comments;

    delete taskObject.creator;
    delete taskObject.assignments;

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
  const { title, description, dueDate, priority, status } = req.body;
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

    // Perform updates using Prisma
    const updatedTask = await prisma.task.update({
      where: { id: targetId },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        priority: priority || undefined,
        status: status || undefined,
      },
    });

    return res.status(200).json({
      task: updatedTask,
    });
  } catch (error) {
    console.error(`Update task error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task update',
    });
  }
};

// @desc    Update status of a task
// @route   PATCH /api/tasks/:id/status
// @access  Private (PM or assigned Collaborator)
const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
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

    // Safeguard: If caller is a Collaborator, check if they are assigned to this task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await prisma.taskAssignment.findUnique({
        where: {
          taskId_userId: {
            taskId: targetId,
            userId: req.user.id,
          },
        },
      });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only update the status of tasks assigned to you.',
        });
      }
    }

    // Update status using Prisma
    const updatedTask = await prisma.task.update({
      where: { id: targetId },
      data: { status },
    });

    // Trigger real-time notifications
    const notificationService = require('../services/notificationService');
    await notificationService.notifyStatusChange(targetId, status, req.user.name, req.user.id);

    return res.status(200).json({
      task: updatedTask,
    });
  } catch (error) {
    console.error(`Patch task status error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during task status update',
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

    // 2. Validate that all provided userIds belong to active, existing users
    const validUsersCount = await prisma.user.count({
      where: {
        id: { in: parsedUserIds },
        isActive: true,
      },
    });

    if (validUsersCount !== userIds.length) {
      return res.status(400).json({
        message: 'Validation failed: One or more assigned users do not exist or are deactivated.',
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
  updateTaskStatus,
  deleteTask,
  assignUsers,
};
