const prisma = require('../config/db');
const socketService = require('./socketService');

/**
 * Notify users when they are assigned to a task.
 * Emits 'notification' to each user room, and 'task:assigned' to all assigned users.
 */
const notifyAssignment = async (taskId, assignedUserIds, assignerName) => {
  const targetTaskId = taskId;
  const parsedUserIds = assignedUserIds;

  try {
    const task = await prisma.task.findUnique({
      where: { id: targetTaskId },
    });
    if (!task) return;

    for (const userId of parsedUserIds) {
      const notification = await prisma.notification.create({
        data: {
          recipientId: userId,
          type: 'Assignment',
          message: `${assignerName} assigned you to task "${task.title}"`,
          relatedTaskId: targetTaskId,
        },
        include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              column: { select: { id: true, name: true, order: true, projectId: true } },
            },
          },
        },
      });

      // Emit with relatedTaskId left as the task's UUID string (matching the REST
      // shape) plus the included relatedTask object for any richer rendering.
      socketService.emitToUser(userId, 'notification', notification);
    }

    // Fetch and format full task details for real-time board updates on the frontend
    const fullTask = await prisma.task.findUnique({
      where: { id: targetTaskId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
          },
        },
        column: { select: { id: true, name: true, order: true, projectId: true } },
      },
    });

    if (fullTask) {
      const formattedTask = { ...fullTask, _id: fullTask.id };
      formattedTask.createdBy = fullTask.creator;
      formattedTask.assignees = fullTask.assignments.map((a) => ({ ...a.user, _id: a.user.id }));
      delete formattedTask.creator;
      delete formattedTask.assignments;

      // Emit task:assigned with the full task object
      socketService.emitToUsers(parsedUserIds, 'task:assigned', formattedTask);
    }
  } catch (error) {
    console.error(`Error in notifyAssignment: ${error.message}`);
  }
};

/**
 * Notify all assigned users and the task creator (except the changer) when a task moves columns.
 * Emits 'notification' and 'task:columnChanged' events.
 */
const notifyColumnChange = async (taskId, newColumnName, changerName, changerId) => {
  const targetTaskId = taskId;
  const parsedChangerId = changerId || null;

  try {
    const task = await prisma.task.findUnique({
      where: { id: targetTaskId },
    });
    if (!task) return;

    // Find all assigned users
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: targetTaskId },
    });
    const assignedUserIds = assignments.map((a) => a.userId);

    // Notify assigned users + creator
    const creatorId = task.createdBy;
    const recipients = new Set(assignedUserIds);
    recipients.add(creatorId);

    // Remove the user who made the change
    if (parsedChangerId) {
      recipients.delete(parsedChangerId);
    }

    const recipientIds = Array.from(recipients);

    for (const userId of recipientIds) {
      const notification = await prisma.notification.create({
        data: {
          recipientId: userId,
          type: 'ColumnChange',
          message: `${changerName} moved "${task.title}" to "${newColumnName}"`,
          relatedTaskId: targetTaskId,
        },
        include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              column: { select: { id: true, name: true, order: true, projectId: true } },
            },
          },
        },
      });

      socketService.emitToUser(userId, 'notification', notification);
    }

    // Emit live task:columnChanged to all involved users (sync active sessions)
    const allInvolved = Array.from(new Set([...assignedUserIds, creatorId]));
    socketService.emitToUsers(allInvolved, 'task:columnChanged', {
      taskId: targetTaskId,
      columnId: task.columnId,
      columnName: newColumnName,
    });
  } catch (error) {
    console.error(`Error in notifyColumnChange: ${error.message}`);
  }
};

/**
 * Notify all assigned users and the task creator (except the commenter) when a
 * comment is added, plus any project members @mentioned in the comment body.
 */
const notifyComment = async (taskId, commenterName, commenterId, commentPreview, fullContent) => {
  const targetTaskId = taskId;
  const parsedCommenterId = commenterId || null;

  try {
    const task = await prisma.task.findUnique({
      where: { id: targetTaskId },
    });
    if (!task) return;

    // Find all assigned users
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: targetTaskId },
    });
    const assignedUserIds = assignments.map((a) => a.userId);

    // Resolve @mentions against project members. A mention is "@" immediately
    // followed by a member's full name (case-insensitive), e.g. "@Emma Wilson".
    const mentionedIds = new Set();
    if (fullContent && task.projectId) {
      const members = await prisma.projectMember.findMany({
        where: { projectId: task.projectId },
        include: { user: { select: { id: true, name: true } } },
      });
      const haystack = fullContent.toLowerCase();
      for (const member of members) {
        const name = member.user?.name;
        if (name && haystack.includes(`@${name.toLowerCase()}`)) {
          mentionedIds.add(member.userId);
        }
      }
    }
    mentionedIds.delete(parsedCommenterId);

    // Notify assigned users + creator (minus the commenter and anyone mentioned,
    // who get the more specific mention notification instead).
    const recipients = new Set(assignedUserIds);
    recipients.add(task.createdBy);
    if (parsedCommenterId) recipients.delete(parsedCommenterId);
    mentionedIds.forEach((id) => recipients.delete(id));

    const emit = async (recipientId, message) => {
      const notification = await prisma.notification.create({
        data: { recipientId, type: 'Comment', message, relatedTaskId: targetTaskId },
        include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              column: { select: { id: true, name: true, order: true, projectId: true } },
            },
          },
        },
      });
      socketService.emitToUser(recipientId, 'notification', notification);
    };

    for (const userId of mentionedIds) {
      await emit(userId, `${commenterName} mentioned you on "${task.title}": "${commentPreview}"`);
    }
    for (const userId of recipients) {
      await emit(userId, `${commenterName} commented on "${task.title}": "${commentPreview}"`);
    }
  } catch (error) {
    console.error(`Error in notifyComment: ${error.message}`);
  }
};

/**
 * Notify a user of an administrative action (e.g., account activation/deactivation).
 */
const notifyAdmin = async (message, recipientId) => {
  const targetRecipientId = recipientId;

  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId: targetRecipientId,
        type: 'Admin',
        message,
      },
    });

    socketService.emitToUser(targetRecipientId, 'notification', notification);
  } catch (error) {
    console.error(`Error in notifyAdmin: ${error.message}`);
  }
};

/**
 * Cron task: Checks all incomplete tasks due within the next 24 hours.
 * Triggers a "Deadline" notification for each assigned user (limited to once a day).
 */
const checkApproachingDeadlines = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due in the next 24 hours that are not in terminal workflow columns.
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: now, lte: next24Hours },
        OR: [
          { columnId: null },
          { column: { name: { notIn: ['Done', 'Completed'] } } },
        ],
      },
    });

    console.log(`[Cron] Found ${tasks.length} tasks due in the next 24 hours.`);

    for (const task of tasks) {
      const assignments = await prisma.taskAssignment.findMany({
        where: { taskId: task.id },
      });
      const assignedUserIds = assignments.map((a) => a.userId);

      if (assignedUserIds.length === 0) continue;

      // Start of today to prevent sending duplicate deadline notifications on the same day
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      for (const userId of assignedUserIds) {
        const alreadyNotified = await prisma.notification.findFirst({
          where: {
            recipientId: userId,
            type: 'Deadline',
            relatedTaskId: task.id,
            createdAt: { gte: startOfDay },
          },
        });

        if (alreadyNotified) continue;

        const notification = await prisma.notification.create({
          data: {
            recipientId: userId,
            type: 'Deadline',
            message: `Task "${task.title}" is due soon (by ${new Date(task.dueDate).toLocaleDateString()})`,
            relatedTaskId: task.id,
          },
          include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              column: { select: { id: true, name: true, order: true, projectId: true } },
            },
          },
          },
        });

        socketService.emitToUser(userId, 'notification', notification);
      }
    }
  } catch (error) {
    console.error(`Error in checkApproachingDeadlines: ${error.message}`);
  }
};

module.exports = {
  notifyAssignment,
  notifyColumnChange,
  notifyComment,
  notifyAdmin,
  checkApproachingDeadlines,
};
