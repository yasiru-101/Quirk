/**
 * @file activityRoutes.js
 * @description Routes for the task activity audit trail.
 */

const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams to access :id from parent

const { getTaskActivity } = require('../controllers/activityController');
const { protect }         = require('../middleware/auth');
const rbac                = require('../middleware/rbac');

router.use(protect);

/**
 * @openapi
 * /tasks/{id}/activity:
 *   get:
 *     summary: Get task activity log
 *     description: Returns a paginated audit trail of all actions performed on a task.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: page,  in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Activity log entries }
 *       404: { description: Task not found }
 */
router.get('/', rbac('Project Manager', 'Collaborator'), getTaskActivity);

module.exports = router;
