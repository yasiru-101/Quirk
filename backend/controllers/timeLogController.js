/**
 * @file timeLogController.js
 * @description Controller for logging and reading time spent on tasks (SRS §Time Tracking).
 */

const prisma = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// @desc   Log time against a task
// @route  POST /api/tasks/:id/timelogs
// @access PM & assigned Collaborator
const createTimeLog = async (req, res) => {
  const { id } = req.params;
  const { hours, note, date } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Collaborators can only log time on tasks assigned to them
    if (req.user.role === 'Collaborator') {
      const isAssigned = await prisma.taskAssignment.findUnique({
        where: { taskId_userId: { taskId: id, userId: req.user.id } },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied: You can only log time on tasks assigned to you.' });
      }
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        taskId: id,
        userId: req.user.id,
        hours: parseFloat(hours),
        note: note || null,
        date: date ? new Date(date) : new Date(),
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await logActivity(id, req.user.id, 'time_logged', { hours: parseFloat(hours), note });

    return res.status(201).json({ timeLog });
  } catch (error) {
    console.error(`Create time log error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error logging time' });
  }
};

// @desc   Get all time logs for a task
// @route  GET /api/tasks/:id/timelogs
// @access All authenticated roles
const getTimeLogs = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const [timeLogs, totalHours] = await Promise.all([
      prisma.timeLog.findMany({
        where: { taskId: id },
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      prisma.timeLog.aggregate({
        where: { taskId: id },
        _sum: { hours: true },
      }),
    ]);

    return res.status(200).json({
      timeLogs,
      totalLoggedHours: totalHours._sum.hours ?? 0,
      estimatedHours: task.estimatedHours ?? null,
    });
  } catch (error) {
    console.error(`Get time logs error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching time logs' });
  }
};

module.exports = { createTimeLog, getTimeLogs };
