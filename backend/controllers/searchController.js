/**
 * @file searchController.js
 * @description Global search controller for tasks, projects, and users.
 */

const prisma = require('../config/db');
const { isPlatformAdmin } = require('../utils/roles');

// @desc    Search across workspace tasks, projects, and users
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(200).json({ tasks: [], projects: [], users: [] });
  }

  const userId = req.user.id;

  try {
    const platformAdmin = isPlatformAdmin(req.user);
    
    // Project constraints
    const projectWhere = platformAdmin ? { deletedAt: null } : {
      deletedAt: null,
      OR: [
        { members: { some: { userId } } },
        { workspace: { members: { some: { userId, role: { in: ['Owner', 'Admin'] } } } } },
      ],
    };

    // Task constraints
    const taskWhere = platformAdmin ? { deletedAt: null } : {
      deletedAt: null,
      OR: [
        { createdBy: userId },
        { assignments: { some: { userId } } },
        { project: { members: { some: { userId } } } },
        { project: { workspace: { members: { some: { userId, role: { in: ['Owner', 'Admin'] } } } } } },
      ],
    };

    const [tasks, projects, users] = await Promise.all([
      prisma.task.findMany({
        where: {
          ...taskWhere,
          AND: [
            {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ]
            }
          ]
        },
        take: 5,
        select: { id: true, title: true, projectId: true, project: { select: { name: true } } }
      }),
      
      prisma.project.findMany({
        where: {
          ...projectWhere,
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ]
            }
          ]
        },
        take: 5,
        select: { id: true, name: true, workspaceId: true }
      }),

      platformAdmin ? prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, name: true, email: true, avatarUrl: true }
      }) : Promise.resolve([]) 
    ]);

    return res.status(200).json({ tasks, projects, users });
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error during search' });
  }
};

module.exports = { globalSearch };
