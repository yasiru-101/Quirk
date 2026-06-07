/**
 * @file userRoutes.js
 * @description Authentication-guarded routing for administrator operations on User resources.
 * All routes mounted here require the logged-in user to have the 'Admin' role.
 */

const express = require('express');
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validations/userSchemas');

// Enforce authentication ('protect') and role validation ('rbac') for ALL user routes
router.use(protect);
router.use(rbac('Admin'));

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create new user
 *     description: Creates a user with a generated temporary password and triggers onboarding. Restricted to Admins.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@taskflow.com
 *               role:
 *                 type: string
 *                 enum: [Admin, Project Manager, Collaborator]
 *                 example: Project Manager
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Validation failed or email already in use.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Not authorized (requires Admin role).
 */
router.post('/', validate(createUserSchema), createUser);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Lists users matching search queries or filtering. Restricted to Admins.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by active status (true/false)
 *     responses:
 *       200:
 *         description: List of users retrieved successfully.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Not authorized.
 */
router.get('/', getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     description: Retrieves user information. Restricted to Admins.
 *     tags: [Users]
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
 *         description: User details retrieved.
 *       404:
 *         description: User not found.
 */
router.get('/:id', getUserById);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update user details
 *     description: Updates name, role, or active status. Prevents demoting the last admin. Restricted to Admins.
 *     tags: [Users]
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
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, Project Manager, Collaborator]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       400:
 *         description: Safeguard block on last admin or validation failure.
 *       404:
 *         description: User not found.
 */
router.put('/:id', validate(updateUserSchema), updateUser);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Soft deactivate a user
 *     description: Deactivates a user's login access. Safeguard prevents deactivating last admin. Restricted to Admins.
 *     tags: [Users]
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
 *         description: User deactivated successfully.
 *       400:
 *         description: Safeguard block on last admin.
 *       404:
 *         description: User not found.
 */
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;
