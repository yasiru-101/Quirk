/**
 * @file activityController.js
 * @description Controller for reading task activity/audit trail logs.
 */

const prisma = require('../config/db');

// @desc   Get paginated activity log for a task
// @route  GET /api/tasks/:id/activity
// @access PM & Collaborator
const getTaskActivity = async (req, res) => {
  const { id } = req.params;
  const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip  = (page - 1) * limit;

  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { taskId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.activityLog.count({ where: { taskId: id } }),
    ]);

    return res.status(200).json({ logs, total, page, limit });
  } catch (error) {
    console.error(`Get task activity error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching activity log' });
  }
};

module.exports = { getTaskActivity };
