/**
 * @file commentController.js
 * @description Controller handling task Comments creation and listing with task-assignment validation.
 */

const Comment = require('../models/Comment');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private (PM or assigned Collaborator)
const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  try {
    // 1. Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Safeguard: Collaborators can only comment if they are assigned to the task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await TaskAssignment.findOne({ taskId, userId: req.user._id });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only add comments to tasks assigned to you.',
        });
      }
    }

    // 3. Create the comment
    const comment = await Comment.create({
      taskId,
      userId: req.user._id,
      content,
    });

    // Populate commenter details for response
    const populatedComment = await comment.populate('userId', 'name email role');

    return res.status(201).json({
      comment: populatedComment,
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

  try {
    // 1. Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Safeguard: Collaborators can only view comments if they are assigned to the task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await TaskAssignment.findOne({ taskId, userId: req.user._id });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only view comments for tasks assigned to you.',
        });
      }
    }

    // 3. Retrieve comments sorted chronologically
    const comments = await Comment.find({ taskId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 });

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
