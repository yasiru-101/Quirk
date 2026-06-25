const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const requirePlatformAdmin = require('../middleware/platformAdmin');
const { getOverview, getWorkspaces, getAudit } = require('../controllers/platformController');

router.use(protect);
router.use(requirePlatformAdmin);

/**
 * @openapi
 * /platform/overview:
 *   get:
 *     summary: Platform overview metrics
 *     tags: [Platform]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Platform metrics }
 *       403: { description: Platform administrator access required }
 */
router.get('/overview', getOverview);

/**
 * @openapi
 * /platform/workspaces:
 *   get:
 *     summary: List tenant workspaces for platform support
 *     tags: [Platform]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Workspace support list }
 *       403: { description: Platform administrator access required }
 */
router.get('/workspaces', getWorkspaces);

/**
 * @openapi
 * /platform/audit:
 *   get:
 *     summary: Recent platform support audit events
 *     tags: [Platform]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Recent audit events }
 *       403: { description: Platform administrator access required }
 */
router.get('/audit', getAudit);

module.exports = router;
