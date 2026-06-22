/**
 * @file epicController.js
 * @description Controller for Epic CRUD operations within a project.
 */

const prisma = require('../config/db');

// @desc   Create an epic within a project
// @route  POST /api/projects/:id/epics
// @access PM | Admin
const createEpic = async (req, res) => {
  const { name, color } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.deletedAt) return res.status(404).json({ message: 'Project not found' });

    const epic = await prisma.epic.create({
      data: { projectId: req.params.id, name, color: color || null },
    });
    return res.status(201).json({ epic });
  } catch (error) {
    console.error(`Create epic error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error creating epic' });
  }
};

// @desc   List epics for a project
// @route  GET /api/projects/:id/epics
// @access All authenticated roles
const getEpics = async (req, res) => {
  try {
    const epics = await prisma.epic.findMany({
      where: { projectId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
    return res.status(200).json({ epics });
  } catch (error) {
    console.error(`Get epics error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error fetching epics' });
  }
};

// @desc   Delete an epic
// @route  DELETE /api/projects/:id/epics/:epicId
// @access PM | Admin
const deleteEpic = async (req, res) => {
  try {
    const epic = await prisma.epic.findFirst({
      where: { id: req.params.epicId, projectId: req.params.id },
    });
    if (!epic) return res.status(404).json({ message: 'Epic not found' });

    // Nullify tasks in this epic rather than cascade-delete
    await prisma.$transaction([
      prisma.task.updateMany({ where: { epicId: req.params.epicId }, data: { epicId: null } }),
      prisma.epic.delete({ where: { id: req.params.epicId } }),
    ]);
    return res.status(200).json({ message: 'Epic deleted successfully' });
  } catch (error) {
    console.error(`Delete epic error: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error deleting epic' });
  }
};

module.exports = { createEpic, getEpics, deleteEpic };
