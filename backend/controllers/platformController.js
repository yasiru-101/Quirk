const prisma = require('../config/db');

const getOverview = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      platformAdmins,
      unverifiedUsers,
      workspaces,
      projects,
      pendingInvitations,
      recentUsers,
      recentWorkspaces,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isPlatformAdmin: true, isActive: true } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.workspace.count(),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.invitation.count({ where: { status: 'pending' } }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.workspace.count({ where: { createdAt: { gte: since } } }),
    ]);

    return res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        platformAdmins,
        unverifiedUsers,
        workspaces,
        projects,
        pendingInvitations,
        recentUsers,
        recentWorkspaces,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getWorkspaces = async (req, res, next) => {
  const { search } = req.query;

  try {
    const workspaces = await prisma.workspace.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        owner: { select: { id: true, name: true, email: true, isActive: true } },
        _count: { select: { members: true, projects: true, invitations: true } },
        members: {
          where: { role: { in: ['Admin', 'Owner'] } },
          take: 5,
          include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
        },
      },
    });

    return res.status(200).json({
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        owner: workspace.owner,
        adminMembers: workspace.members,
        memberCount: workspace._count.members,
        projectCount: workspace._count.projects,
        invitationCount: workspace._count.invitations,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const getAudit = async (req, res, next) => {
  try {
    const [users, workspaces, invitations, taskActivity] = await Promise.all([
      prisma.user.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          name: true,
          email: true,
          isPlatformAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.workspace.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 12,
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      }),
      prisma.invitation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          workspace: { select: { id: true, name: true } },
          inviter: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, title: true, project: { select: { id: true, name: true, workspace: { select: { id: true, name: true } } } } } },
        },
      }),
    ]);

    const events = [
      ...users.map((user) => ({
        id: `user:${user.id}:${user.updatedAt.toISOString()}`,
        type: user.createdAt.getTime() === user.updatedAt.getTime() ? 'user.created' : 'user.updated',
        title: user.name,
        detail: `${user.email}${user.isPlatformAdmin ? ' - platform admin' : ''}${user.isActive ? '' : ' - inactive'}`,
        actor: 'Platform',
        createdAt: user.updatedAt,
      })),
      ...workspaces.map((workspace) => ({
        id: `workspace:${workspace.id}:${workspace.updatedAt.toISOString()}`,
        type: workspace.createdAt.getTime() === workspace.updatedAt.getTime() ? 'workspace.created' : 'workspace.updated',
        title: workspace.name,
        detail: 'Workspace record changed',
        actor: 'Platform',
        createdAt: workspace.updatedAt,
      })),
      ...invitations.map((invite) => ({
        id: `invite:${invite.id}`,
        type: 'workspace.invitation',
        title: invite.email,
        detail: `${invite.status} invitation to ${invite.workspace?.name || 'workspace'} as ${invite.role}`,
        actor: invite.inviter?.name || 'Unknown',
        createdAt: invite.createdAt,
      })),
      ...taskActivity.map((activity) => ({
        id: `activity:${activity.id}`,
        type: `task.${activity.action}`,
        title: activity.task?.title || 'Task activity',
        detail: activity.task?.project?.workspace?.name
          ? `${activity.task.project.workspace.name} / ${activity.task.project.name}`
          : activity.task?.project?.name || 'Project activity',
        actor: activity.user?.name || 'Unknown',
        createdAt: activity.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40);

    return res.status(200).json({ events });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOverview,
  getWorkspaces,
  getAudit,
};
