/**
 * @file timeLogRoutes.js
 * @description Routes for time tracking on tasks (SRS §Time Tracking).
 */

const express = require('express');
const router  = express.Router({ mergeParams: true });

const { createTimeLog, getTimeLogs } = require('../controllers/timeLogController');
const { protect }                    = require('../middleware/auth');
const rbac                           = require('../middleware/rbac');
const validate                       = require('../middleware/validate');
const { createTimeLogSchema }        = require('../validations/taskSchemas');

router.use(protect);

/**
 * @openapi
 * /tasks/{id}/timelogs:
 *   post:
 *     summary: Log time on a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hours]
 *             properties:
 *               hours: { type: number, minimum: 0.5 }
 *               note:  { type: string }
 *               date:  { type: string, format: date-time }
 *     responses:
 *       201: { description: Time logged }
 *       403: { description: Forbidden (collaborator not assigned) }
 */
router.post('/', rbac('Project Manager', 'Collaborator'), validate(createTimeLogSchema), createTimeLog);

/**
 * @openapi
 * /tasks/{id}/timelogs:
 *   get:
 *     summary: Get time logs for a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Time logs with running total }
 */
router.get('/', rbac('Project Manager', 'Collaborator'), getTimeLogs);

module.exports = router;
