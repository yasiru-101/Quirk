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
  updateTaskColumn,
  deleteTask,
  assignUsers,
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');
const { requireTaskAccess } = require('../middleware/membership');
const validate = require('../middleware/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  updateColumnSchema,
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
 *                 enum: [Low, Medium, High, Urgent]
 *                 example: High
 *               columnId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Forbidden (requires Project Manager role).
 */
router.post('/', validate(createTaskSchema), createTask);

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List tasks
 *     description: Returns a list of tasks. Supports column and priority filters.
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: columnId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks retrieved.
 */
router.get('/', getTasks);

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
router.get('/:id', requireTaskAccess(), getTaskById);

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Update task details
 *     description: Updates task title, description, due date, priority, or workflow column. Restricted to Project Managers.
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
router.put('/:id', requireTaskAccess('Project Manager'), validate(updateTaskSchema), updateTask);

/**
 * @openapi
 * /tasks/{id}/column:
 *   patch:
 *     summary: Move task to a workflow column
 *     description: Updates only the task column. Allowed for PMs or assigned Collaborators.
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
 *               - columnId
 *             properties:
 *               columnId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Column updated successfully.
 *       403:
 *         description: Forbidden (user is Collaborator but not assigned to task).
 *       404:
 *         description: Task not found.
 */
router.patch(
  '/:id/column',
  requireTaskAccess(),
  validate(updateColumnSchema),
  updateTaskColumn
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
router.delete('/:id', requireTaskAccess('Project Manager'), deleteTask);

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
router.post('/:id/assign', requireTaskAccess('Project Manager'), validate(assignTaskSchema), assignUsers);

module.exports = router;
