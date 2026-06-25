/**
 * @file membership.js
 * @description Object-level authorization middleware.
 *
 * Role checks alone (see rbac.js) answer "what kind of user is this?". They do not
 * answer "is this user allowed to touch *this* resource?". These guards close that
 * gap by resolving the caller's membership of the workspace or project named in the
 * request and enforcing both membership and the required role.
 *
 * They run after `protect`, which populates `req.user`.
 *
 * A platform administrator (User.isPlatformAdmin) bypasses these checks. Tenant
 * roles remain scoped to the workspace or project named by the request.
 */

const prisma = require('../config/db');
const { isPlatformAdmin, isWorkspaceAdmin } = require('../utils/roles');

const deny = (res, status, message) =>
  res.status(status).json({ errorCode: status, message });

/**
 * Guard a route that operates on a workspace. The workspace id is read from
 * `req.params.workspaceId`, then `req.params.id`, then `req.body.workspaceId`.
 *
 * @param {...string} allowedRoles Workspace roles permitted (empty = any member).
 */
const requireWorkspaceRole = (...allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user) return deny(res, 401, 'Authentication required.');
    if (isPlatformAdmin(req.user)) return next();

    const workspaceId =
      req.params.workspaceId || req.params.id || req.body.workspaceId;
    if (!workspaceId) return deny(res, 400, 'Workspace context is required.');

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: req.user.id } },
    });
    if (!membership) {
      return deny(res, 403, 'Access denied. You are not a member of this workspace.');
    }
    if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
      return deny(res, 403, 'Access denied. Insufficient workspace role.');
    }

    req.workspaceMembership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Resolve whether a user may act on a project at one of the allowed project roles.
 * Workspace Owners and Admins of the project's workspace are always permitted, so
 * that workspace managers are not locked out of projects they do not explicitly join.
 *
 * @returns {Promise<{ ok: boolean, status?: number, membership?: object }>}
 */
const resolveProjectAccess = async (user, projectId, allowedRoles) => {
  if (isPlatformAdmin(user)) return { ok: true };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true, deletedAt: true },
  });
  if (!project || project.deletedAt) return { ok: false, status: 404 };

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (membership && (!allowedRoles.length || allowedRoles.includes(membership.role))) {
    return { ok: true, membership };
  }

  // Workspace Owner/Admin override.
  if (project.workspaceId) {
    const wm = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId: user.id } },
    });
    if (isWorkspaceAdmin(wm)) return { ok: true };
  }

  return { ok: false, status: 403 };
};

/**
 * Guard a route that operates on a project. The project id is read from
 * `req.params.projectId` then `req.params.id`.
 *
 * @param {...string} allowedRoles Project roles permitted (empty = any member).
 */
const requireProjectRole = (...allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user) return deny(res, 401, 'Authentication required.');

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return deny(res, 400, 'Project context is required.');

    const result = await resolveProjectAccess(req.user, projectId, allowedRoles);
    if (!result.ok) {
      return result.status === 404
        ? deny(res, 404, 'Project not found.')
        : deny(res, 403, 'Access denied. You do not have access to this project.');
    }

    req.projectMembership = result.membership || null;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Resolve whether a user may act on a task at the given project-role level. The task
 * is resolved to its project and delegated to resolveProjectAccess.
 *
 * With no roles, participant-level access is granted to the task's creator, its
 * assignees, project members, and workspace Owners/Admins. With roles supplied (e.g.
 * 'Project Manager'), the caller must hold that project role; for a task with no
 * project, only its creator qualifies.
 *
 * @returns {Promise<{ ok: boolean, status?: number }>}
 */
const resolveTaskAccess = async (user, taskId, allowedProjectRoles = []) => {
  if (isPlatformAdmin(user)) return { ok: true };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, createdBy: true, deletedAt: true },
  });
  if (!task || task.deletedAt) return { ok: false, status: 404 };

  if (allowedProjectRoles.length) {
    if (!task.projectId) {
      return task.createdBy === user.id ? { ok: true } : { ok: false, status: 403 };
    }
    return resolveProjectAccess(user, task.projectId, allowedProjectRoles);
  }

  if (task.createdBy === user.id) return { ok: true };

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
  });
  if (assignment) return { ok: true };

  if (task.projectId) {
    const result = await resolveProjectAccess(user, task.projectId, []);
    if (result.ok) return { ok: true };
  }
  return { ok: false, status: 403 };
};

/**
 * Guard a route that operates on a task. The task id is read from `req.params.id`
 * then `req.params.taskId`.
 *
 * @param {...string} allowedProjectRoles Project roles required for the action.
 */
const requireTaskAccess = (...allowedProjectRoles) => async (req, res, next) => {
  try {
    if (!req.user) return deny(res, 401, 'Authentication required.');

    const taskId = req.params.id || req.params.taskId;
    if (!taskId) return deny(res, 400, 'Task context is required.');

    const result = await resolveTaskAccess(req.user, taskId, allowedProjectRoles);
    if (!result.ok) {
      return result.status === 404
        ? deny(res, 404, 'Task not found.')
        : deny(res, 403, 'Access denied. You do not have access to this task.');
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireWorkspaceRole,
  requireProjectRole,
  requireTaskAccess,
  resolveProjectAccess,
  resolveTaskAccess,
};
