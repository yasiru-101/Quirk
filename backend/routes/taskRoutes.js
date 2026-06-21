/**
 * @file taskRoutes.js
 * @description Routing configuration for Task resources. Restricts modifications to PMs.
 */

const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignUsers,
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateStatusSchema,
} = require('../validations/taskSchemas');

// Require authentication for all task operations
router.use(protect);

/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create a task
 *     description: Creates a new task. Restricted to Project Managers.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design database schema
 *               description:
 *                 type: string
 *                 example: Plan collections, keys and indexes.
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T00:00:00.000Z
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 example: High
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, Completed]
 *                 example: To Do
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Forbidden (requires Project Manager role).
 */
router.post('/', rbac('Project Manager'), validate(createTaskSchema), createTask);

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List tasks
 *     description: Returns a list of tasks. Supports status and priority filters.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks retrieved.
 */
router.get('/', rbac('Project Manager', 'Collaborator'), getTasks);

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get task details
 *     description: Retrieves details of a specific task, including assignments and comments.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details retrieved.
 *       404:
 *         description: Task not found.
 */
router.get('/:id', rbac('Project Manager', 'Collaborator'), getTaskById);

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Update task details
 *     description: Updates task title, description, due date, priority, or status. Restricted to Project Managers.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       404:
 *         description: Task not found.
 */
router.put('/:id', rbac('Project Manager'), validate(updateTaskSchema), updateTask);

/**
 * @openapi
 * /tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     description: Updates only the status field. Allowed for PMs or assigned Collaborators.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [To Do, In Progress, Completed]
 *     responses:
 *       200:
 *         description: Status updated successfully.
 *       403:
 *         description: Forbidden (user is Collaborator but not assigned to task).
 *       404:
 *         description: Task not found.
 */
router.patch(
  '/:id/status',
  rbac('Project Manager', 'Collaborator'),
  validate(updateStatusSchema),
  updateTaskStatus
);

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Deletes task and cleans up assignments/comments. Restricted to Project Managers.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *       404:
 *         description: Task not found.
 */
router.delete('/:id', rbac('Project Manager'), deleteTask);

/**
 * @openapi
 * /tasks/{id}/assign:
 *   post:
 *     summary: Assign users to task
 *     description: Replaces assignments list for a task. Restricted to Project Managers.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Assignments updated.
 *       400:
 *         description: Validation failed (invalid or deactivated user ID).
 *       404:
 *         description: Task not found.
 */
router.post('/:id/assign', rbac('Project Manager'), validate(assignTaskSchema), assignUsers);

module.exports = router;
