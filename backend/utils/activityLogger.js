/**
 * @file activityLogger.js
 * @description Shared helper to write ActivityLog entries. Called by controllers
 * after any meaningful task mutation to build the automated audit trail (SRS §Activity Log).
 *
 * @param {string} taskId   - The affected task's UUID
 * @param {string} userId   - The acting user's UUID
 * @param {string} action   - Action key e.g. 'column_changed', 'assigned', 'commented', 'time_logged'
 * @param {object} metadata - Arbitrary JSON payload with before/after data
 */

const prisma = require('../config/db');

const logActivity = async (taskId, userId, action, metadata = {}) => {
  try {
    await prisma.activityLog.create({
      data: { taskId, userId, action, metadata },
    });
  } catch (err) {
    // Non-critical — log the error but do NOT throw; never let audit logging break the main flow.
    console.error(`[ActivityLogger] Failed to write log for task ${taskId}: ${err.message}`);
  }
};

module.exports = { logActivity };
