/**
 * @file rbac.js
 * @description Role-Based Access Control (RBAC) authorization middleware.
 *
 * This middleware restricts access to routes based on the authenticated user's role.
 * It works in conjunction with the `protect` middleware (auth.js), which must run
 * BEFORE this middleware to populate `req.user`.
 *
 * Roles defined in the system (from SRS §Authorization & RBAC):
 *   - Admin:           Full access to user management and system configuration.
 *   - Project Manager: Can create/manage tasks, assign tasks, set priorities/deadlines.
 *   - Collaborator:    Can view assigned tasks, update status, add comments/attachments.
 *
 * Usage:
 *   const { protect } = require('./auth');
 *   const rbac = require('./rbac');
 *
 *   // Single role:
 *   router.get('/users', protect, rbac('Admin'), getUsers);
 *
 *   // Multiple roles:
 *   router.patch('/tasks/:id/status', protect, rbac('Project Manager', 'Collaborator'), updateStatus);
 *
 * Response on denial:
 *   HTTP 403 Forbidden
 *   { "message": "Access denied. Insufficient permissions." }
 */

/**
 * Higher-order middleware factory that creates a role-checking middleware.
 *
 * @param {...string} allowedRoles - One or more role strings that are permitted
 *   to access the route. Must match the `role` enum values in the User model:
 *   'Admin', 'Project Manager', or 'Collaborator'.
 * @returns {Function} Express middleware function that checks `req.user.role`
 *   against the allowed roles and either calls `next()` or returns 403.
 */
const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    // --- 1. Verify that the protect middleware has run ---
    // If req.user is missing, the protect middleware was either not applied
    // or the user failed authentication. Return 401 as a safety net.
    if (!req.user) {
      return res.status(401).json({
        errorCode: 401,
        message: 'Not authorized. Authentication required before authorization.',
      });
    }

    if (req.user.isPlatformAdmin) {
      return next();
    }

    // --- 2. Check if the user's role is in the allowed list ---
    // Compare the authenticated user's role against the roles permitted for this route.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        errorCode: 403,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // --- 3. Role is authorized — proceed to the next middleware/controller ---
    next();
  };
};

module.exports = rbac;
