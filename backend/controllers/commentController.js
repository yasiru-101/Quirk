/**
 * @file commentController.js
 * @description Controller handling task Comments creation and listing with task-assignment validation.
 */

const prisma = require('../config/db');

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private (PM or assigned Collaborator)
const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const targetTaskId = ;

  try {
    // 1. Verify task exists
    const task = await prisma.task.findUnique({ where: { id: targetTaskId } });
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Safeguard: Collaborators can only comment if they are assigned to the task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await prisma.taskAssignment.findUnique({
        where: {
          taskId_userId: {
            taskId: targetTaskId,
            userId: req.user.id,
          },
        },
      });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only add comments to tasks assigned to you.',
        });
      }
    }

    // 3. Create the comment using Prisma and include commenter user profile details
    const comment = await prisma.comment.create({
      data: {
        taskId: targetTaskId,
        userId: req.user.id,
        content,
      },
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
    });

    // Trigger real-time notifications
    const notificationService = require('../services/notificationService');
    const commentPreview = content.length > 80 ? `${content.substring(0, 80)}...` : content;
    await notificationService.notifyComment(targetTaskId, req.user.name, req.user.id, commentPreview);

    return res.status(201).json({
      comment,
    });
  } catch (error) {
    console.error(`Add comment error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error during comment creation',
    });
  }
};

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private (PM or assigned Collaborator)
const getComments = async (req, res) => {
  const { taskId } = req.params;
  const targetTaskId = ;

  try {
    // 1. Verify task exists
    const task = await prisma.task.findUnique({ where: { id: targetTaskId } });
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Safeguard: Collaborators can only view comments if they are assigned to the task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await prisma.taskAssignment.findUnique({
        where: {
          taskId_userId: {
            taskId: targetTaskId,
            userId: req.user.id,
          },
        },
      });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only view comments for tasks assigned to you.',
        });
      }
    }

    // 3. Retrieve comments sorted chronologically using Prisma
    const comments = await prisma.comment.findMany({
      where: { taskId: targetTaskId },
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
    });

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error(`Get comments error: ${error.message}`);
    return res.status(500).json({
      message: 'Internal server error fetching comments list',
    });
  }
};

module.exports = {
  addComment,
  getComments,
};
