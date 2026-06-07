/**
 * @file taskController.js
 * @description Controller handling Task CRUD, status updates, user assignments, and resource cleanups.
 */

const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager only)
const createTask = async (req, res) => {
  const { title, description, dueDate, priority, status } = req.body;

  try {
    const task = await Task.create({
      title,
      description,
      dueDate: dueDate || undefined,
      priority,
      status,
      createdBy: req.user._id,
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
  const query = {};

  try {
    // Apply filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      tasks,
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

  try {
    // 1. Fetch the task document
    const task = await Task.findById(id).populate('createdBy', 'name email role');
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Fetch all assignments and populate user details
    const assignments = await TaskAssignment.find({ taskId: id })
      .populate('userId', 'name email role isActive');

    // 3. Fetch comments and populate commenter details
    const comments = await Comment.find({ taskId: id })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 });

    // Combine task details with assignments and comments for response
    const taskObject = task.toObject();
    taskObject.assignments = assignments.map(a => a.userId);
    taskObject.comments = comments;

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

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Perform updates
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (priority) task.priority = priority;
    if (status) task.status = status;

    await task.save();

    return res.status(200).json({
      task,
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

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Safeguard: If caller is a Collaborator, check if they are assigned to this task
    if (req.user.role === 'Collaborator') {
      const isAssigned = await TaskAssignment.findOne({ taskId: id, userId: req.user._id });
      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied: You can only update the status of tasks assigned to you.',
        });
      }
    }

    // Update status
    task.status = status;
    await task.save();

    return res.status(200).json({
      task,
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

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // Delete the task document
    await Task.deleteOne({ _id: id });

    // Clean up related Mongoose documents (Cascading delete)
    await TaskAssignment.deleteMany({ taskId: id });
    await Comment.deleteMany({ taskId: id });

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

  try {
    // 1. Verify task exists
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
      });
    }

    // 2. Validate that all provided userIds belong to active, existing users
    const validUsersCount = await User.countDocuments({
      _id: { $in: userIds },
      isActive: true,
    });

    if (validUsersCount !== userIds.length) {
      return res.status(400).json({
        message: 'Validation failed: One or more assigned users do not exist or are deactivated.',
      });
    }

    // 3. Clear existing assignments for this task
    await TaskAssignment.deleteMany({ taskId: id });

    // 4. Create new assignments
    const newAssignments = userIds.map((userId) => ({
      taskId: id,
      userId,
    }));
    await TaskAssignment.insertMany(newAssignments);

    return res.status(200).json({
      message: 'Task assignments updated successfully',
      assignedUserIds: userIds,
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
