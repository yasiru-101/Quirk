/**
 * @file projectController.js
 * @description Controller handling Project, KanbanColumn, and ProjectMember CRUD operations.
 */

const prisma = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// ─── Helper: verify project exists and (optionally) check PM ownership ────────
const findProject = async (id, res) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      columns: { orderBy: { order: 'asc' } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } } },
      epics:   { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!project || project.deletedAt) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }
  return project;
};

// ─── Create Project ───────────────────────────────────────────────────────────
// @route  POST /api/projects
// @access PM | Admin
const createProject = async (req, res) => {
  const { name, description, templateType, workspaceId } = req.body;
  try {
    // A project may only be created inside a workspace the caller belongs to.
    if (workspaceId && req.user.role !== 'Admin') {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: req.user.id } },
      });
      if (!membership) {
        return res.status(403).json({
          message: 'Access denied. You are not a member of this workspace.',
        });
      }
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name,
          description,
          templateType,
          workspaceId: workspaceId || null,
          createdBy: req.user.id,
        },
      });

      // The creator manages the project they created.
      await tx.projectMember.create({
        data: { projectId: created.id, userId: req.user.id, role: 'Project Manager' },
      });

      // Seed default columns based on template
      const defaultColumns =
        templateType === 'Software Development'
          ? ['Backlog', 'To Do', 'In Progress', 'In Review', 'QA Testing', 'Done']
          : templateType === 'Marketing Campaign'
          ? ['Ideas', 'Planning', 'In Progress', 'Review', 'Published']
          : ['To Do', 'In Progress', 'Done']; // Basic Kanban (default)

      await tx.kanbanColumn.createMany({
        data: defaultColumns.map((colName, idx) => ({
          projectId: created.id,
          name: colName,
          order: idx,
        })),
      });

      return created;
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error(`Create project error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during project creation' });
  }
};

// ─── List Projects ────────────────────────────────────────────────────────────
// @route  GET /api/projects
// @access All authenticated roles
const getProjects = async (req, res) => {
  try {
    // Platform Admins see everything; everyone else sees only projects they belong
    // to, or projects in workspaces they own or administer.
    const where = { deletedAt: null };
    if (req.user.role !== 'Admin') {
      where.OR = [
        { members: { some: { userId: req.user.id } } },
        {
          workspace: {
            members: { some: { userId: req.user.id, role: { in: ['Owner', 'Admin'] } } },
          },
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator:  { select: { id: true, name: true, email: true } },
        columns:  { orderBy: { order: 'asc' }, select: { id: true, name: true, order: true } },
        members:  { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count:   { select: { tasks: true } },
      },
    });

    // Enrich with task completion stats
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const taskStats = await prisma.task.aggregate({
          where: { projectId: p.id, deletedAt: null },
          _count: { id: true },
        });
        const completedCount = await prisma.task.count({
          where: { projectId: p.id, deletedAt: null, status: 'Done' },
        });
        return {
          ...p,
          taskCount: taskStats._count.id,
          completedTaskCount: completedCount,
        };
      })
    );

    return res.status(200).json({ projects: enriched });
  } catch (error) {
    console.error(`Get projects error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching projects' });
  }
};

// ─── Get Project by ID ────────────────────────────────────────────────────────
// @route  GET /api/projects/:id
// @access All authenticated roles
const getProjectById = async (req, res) => {
  try {
    const project = await findProject(req.params.id, res);
    if (!project) return;
    return res.status(200).json({ project });
  } catch (error) {
    console.error(`Get project error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching project' });
  }
};

// ─── Update Project ───────────────────────────────────────────────────────────
// @route  PUT /api/projects/:id
// @access PM | Admin
const updateProject = async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const project = await findProject(req.params.id, res);
    if (!project) return;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name:        name        ?? undefined,
        description: description ?? undefined,
        status:      status      ?? undefined,
      },
    });
    return res.status(200).json({ project: updated });
  } catch (error) {
    console.error(`Update project error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during project update' });
  }
};

// ─── Delete Project ───────────────────────────────────────────────────────────
// @route  DELETE /api/projects/:id
// @access PM | Admin
const deleteProject = async (req, res) => {
  try {
    const project = await findProject(req.params.id, res);
    if (!project) return;

    // Soft-delete
    await prisma.project.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(`Delete project error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during project deletion' });
  }
};

// ─── Create Kanban Column ─────────────────────────────────────────────────────
// @route  POST /api/projects/:id/columns
// @access PM
const createColumn = async (req, res) => {
  const { name, order } = req.body;
  try {
    const project = await findProject(req.params.id, res);
    if (!project) return;

    // If order not provided, append at end
    const maxOrder = project.columns.length > 0
      ? Math.max(...project.columns.map((c) => c.order))
      : -1;

    const column = await prisma.kanbanColumn.create({
      data: {
        projectId: req.params.id,
        name,
        order: order !== undefined ? order : maxOrder + 1,
      },
    });
    return res.status(201).json({ column });
  } catch (error) {
    console.error(`Create column error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error creating column' });
  }
};

// ─── Update Kanban Column ─────────────────────────────────────────────────────
// @route  PUT /api/projects/:id/columns/:colId
// @access PM
const updateColumn = async (req, res) => {
  const { name, order } = req.body;
  try {
    const column = await prisma.kanbanColumn.findFirst({
      where: { id: req.params.colId, projectId: req.params.id },
    });
    if (!column) return res.status(404).json({ message: 'Column not found' });

    const updated = await prisma.kanbanColumn.update({
      where: { id: req.params.colId },
      data: {
        name:  name  !== undefined ? name  : undefined,
        order: order !== undefined ? order : undefined,
      },
    });
    return res.status(200).json({ column: updated });
  } catch (error) {
    console.error(`Update column error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error updating column' });
  }
};

// ─── Delete Kanban Column ─────────────────────────────────────────────────────
// @route  DELETE /api/projects/:id/columns/:colId
// @access PM
const deleteColumn = async (req, res) => {
  try {
    const column = await prisma.kanbanColumn.findFirst({
      where: { id: req.params.colId, projectId: req.params.id },
    });
    if (!column) return res.status(404).json({ message: 'Column not found' });

    // Nullify tasks in this column rather than cascade-delete them
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { columnId: req.params.colId },
        data: { columnId: null },
      }),
      prisma.kanbanColumn.delete({ where: { id: req.params.colId } }),
    ]);
    return res.status(200).json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error(`Delete column error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error deleting column' });
  }
};

// ─── Add Project Member ───────────────────────────────────────────────────────
// @route  POST /api/projects/:id/members
// @access PM | Admin
const addMember = async (req, res) => {
  const { userId, role } = req.body;
  try {
    const project = await findProject(req.params.id, res);
    if (!project) return;

    const user = await prisma.user.findUnique({ where: { id: userId, isActive: true } });
    if (!user) return res.status(404).json({ message: 'User not found or inactive' });

    const memberRole = role === 'Project Manager' ? 'Project Manager' : 'Collaborator';

    // Upsert to avoid duplicate member error
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      create: { projectId: req.params.id, userId, role: memberRole },
      update: { role: memberRole },
    });
    return res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error(`Add member error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error adding member' });
  }
};

// ─── Remove Project Member ────────────────────────────────────────────────────
// @route  DELETE /api/projects/:id/members/:userId
// @access PM | Admin
const removeMember = async (req, res) => {
  try {
    await prisma.projectMember.deleteMany({
      where: { projectId: req.params.id, userId: req.params.userId },
    });
    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(`Remove member error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error removing member' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createColumn,
  updateColumn,
  deleteColumn,
  addMember,
  removeMember,
};
