const prisma = require('../config/db');

const getTemplates = async (req, res) => {
  try {
    const templates = await prisma.projectTemplate.findMany({
      include: { columns: { orderBy: { order: 'asc' } } }
    });
    return res.status(200).json({ templates });
  } catch (err) {
    console.error(`Get templates error: ${err.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplate = async (req, res) => {
  // Only Admin can create templates
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Only Admins can manage templates.' });
  }

  const { name, description, columns } = req.body;
  try {
    const template = await prisma.$transaction(async (tx) => {
      const t = await tx.projectTemplate.create({
        data: { name, description }
      });
      if (columns && columns.length > 0) {
        await tx.projectTemplateColumn.createMany({
          data: columns.map((col, idx) => ({
            templateId: t.id,
            name: typeof col === 'string' ? col : col.name,
            order: idx
          }))
        });
      }
      return tx.projectTemplate.findUnique({
        where: { id: t.id },
        include: { columns: { orderBy: { order: 'asc' } } }
      });
    });
    return res.status(201).json({ template });
  } catch (err) {
    console.error(`Create template error: ${err.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTemplate = async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Only Admins can manage templates.' });
  }
  try {
    await prisma.projectTemplate.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error(`Delete template error: ${err.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getTemplates, createTemplate, deleteTemplate };
