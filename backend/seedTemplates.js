require('dotenv').config();
const prisma = require('./config/db');

async function main() {
  const templates = [
    { name: 'Software Development', columns: ['Backlog', 'To Do', 'In Progress', 'In Review', 'QA Testing', 'Done'] },
    { name: 'Marketing Campaign', columns: ['Ideas', 'Planning', 'In Progress', 'Review', 'Published'] },
    { name: 'Basic Kanban', columns: ['To Do', 'In Progress', 'Done'] }
  ];
  for (const t of templates) {
    const existing = await prisma.projectTemplate.findUnique({ where: { name: t.name } });
    if (!existing) {
      const created = await prisma.projectTemplate.create({ data: { name: t.name, description: 'System default template' } });
      await prisma.projectTemplateColumn.createMany({
        data: t.columns.map((c, i) => ({ templateId: created.id, name: c, order: i }))
      });
      console.log(`Created template ${t.name}`);
    } else {
      console.log(`Template ${t.name} already exists`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
