/**
 * @file searchRoutes.js
 * @description Routing configuration for global search.
 */

const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

// Require authentication
router.use(protect);

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Global search
 *     description: Search across tasks, projects, and users.
 *     tags: [Search]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results.
 */
router.get('/', globalSearch);

module.exports = router;
