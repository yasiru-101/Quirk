/**
 * @file projectRoutes.js
 * @description API routes for Project, KanbanColumn, Epic, and ProjectMember management.
 */

const express = require('express');
const router  = express.Router();

const {
  createProject, getProjects, getProjectById,
  updateProject, deleteProject,
  createColumn,  updateColumn,  deleteColumn,
  addMember,     removeMember,
} = require('../controllers/projectController');

const { createEpic, getEpics, deleteEpic } = require('../controllers/epicController');
const { protect } = require('../middleware/auth');
const rbac     = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, createColumnSchema } = require('../validations/projectSchemas');

router.use(protect);

// ─── Projects ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               templateType: { type: string, enum: [Software Development, Marketing Campaign, Basic Kanban] }
 *               workspaceId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Project created }
 *       403: { description: Forbidden }
 */
router.post('/', rbac('Project Manager', 'Admin'), validate(createProjectSchema), createProject);

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: List of projects }
 */
router.get('/', getProjects);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project details with columns, members, and epics }
 *       404: { description: Not found }
 */
router.get('/:id', getProjectById);

/**
 * @openapi
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project updated }
 */
router.put('/:id', rbac('Project Manager', 'Admin'), validate(updateProjectSchema), updateProject);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     summary: Soft-delete a project
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project deleted }
 */
router.delete('/:id', rbac('Project Manager', 'Admin'), deleteProject);

// ─── Kanban Columns ───────────────────────────────────────────────────────────
router.post('/:id/columns', rbac('Project Manager'), validate(createColumnSchema), createColumn);
router.put('/:id/columns/:colId', rbac('Project Manager'), updateColumn);
router.delete('/:id/columns/:colId', rbac('Project Manager'), deleteColumn);

// ─── Epics ────────────────────────────────────────────────────────────────────
router.post('/:id/epics',          rbac('Project Manager', 'Admin'), createEpic);
router.get('/:id/epics',           getEpics);
router.delete('/:id/epics/:epicId', rbac('Project Manager', 'Admin'), deleteEpic);

// ─── Project Members ──────────────────────────────────────────────────────────
router.post('/:id/members',            rbac('Project Manager', 'Admin'), addMember);
router.delete('/:id/members/:userId',  rbac('Project Manager', 'Admin'), removeMember);

module.exports = router;
