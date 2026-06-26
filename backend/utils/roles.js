const WORKSPACE_ADMIN_ROLES = ['Admin', 'Owner'];
const WORKSPACE_ROLES = ['Admin', 'Project Manager', 'Collaborator'];
const PROJECT_ROLES = ['Project Manager', 'Collaborator'];
const PLATFORM_ROLES = ['Admin', 'Project Manager', 'Collaborator'];

const isPlatformAdmin = (user) => Boolean(user?.isPlatformAdmin);

const isWorkspaceAdmin = (membership) =>
  Boolean(membership && WORKSPACE_ADMIN_ROLES.includes(membership.role));

// Authority to create a project is decided solely by the caller's role *in this
// workspace* (plus the global platform-admin escape hatch). The previous global
// User.role check is intentionally gone: roles are per-workspace, so a member
// promoted to Project Manager inside a workspace can create projects regardless
// of any account-wide role.
const canCreateProjectInWorkspace = (user, membership) =>
  isPlatformAdmin(user) ||
  isWorkspaceAdmin(membership) ||
  membership?.role === 'Project Manager';

module.exports = {
  WORKSPACE_ADMIN_ROLES,
  WORKSPACE_ROLES,
  PROJECT_ROLES,
  PLATFORM_ROLES,
  isPlatformAdmin,
  isWorkspaceAdmin,
  canCreateProjectInWorkspace,
};
