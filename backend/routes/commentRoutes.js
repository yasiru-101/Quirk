/**
 * @file commentRoutes.js
 * @description Routing configuration for task Comments. Requires project-level assignment checks.
 */

const express = require('express');
const router = express.Router();

const {
  addComment,
  getComments,
} = require('../controllers/commentController');

const { protect } = require('../middleware/auth');
const { requireTaskAccess } = require('../middleware/membership');
const validate = require('../middleware/validate');
const { createCommentSchema } = require('../validations/taskSchemas');

// Require authentication for all comment operations. Task-level access is enforced
// per route via requireTaskAccess (the controller additionally restricts unassigned
// collaborators).
router.use(protect);

/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     description: Creates a comment. Allowed for PMs or assigned Collaborators.
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: taskId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: I have started working on the database indexing.
 *     responses:
 *       201:
 *         description: Comment created.
 *       403:
 *         description: Forbidden (user is Collaborator but not assigned to task).
 *       404:
 *         description: Task not found.
 */
router.post('/:taskId/comments', requireTaskAccess(), validate(createCommentSchema), addComment);

/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Get comments for a task
 *     description: Retrieves all comments on a task. Allowed for PMs or assigned Collaborators.
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments retrieved.
 *       403:
 *         description: Forbidden (user is Collaborator but not assigned to task).
 *       404:
 *         description: Task not found.
 */
router.get('/:taskId/comments', requireTaskAccess(), getComments);

module.exports = router;
