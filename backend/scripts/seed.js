/**
 * @file seed.js
 * @description Seeding script using Prisma Client with PG Driver Adapter to clear and populate PostgreSQL database.
 * Run this script using: node scripts/seed.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedUsersData = [
  {
    name: 'System Admin',
    email: 'admin@quirk.app',
    passwordRaw: 'AdminPass123!',
    role: 'Admin',
    mustResetPassword: false,
    isActive: true,
  },
  {
    name: 'Sarah Manager',
    email: 'pm@quirk.app',
    passwordRaw: 'ManagerPass123!',
    role: 'Project Manager',
    mustResetPassword: false,
    isActive: true,
  },
  {
    name: 'Alex Developer',
    email: 'dev@quirk.app',
    passwordRaw: 'CollabPass123!',
    role: 'Collaborator',
    mustResetPassword: false,
    isActive: true,
  },
  {
    name: 'Emma Designer',
    email: 'emma@quirk.app',
    passwordRaw: 'CollabPass123!',
    role: 'Collaborator',
    mustResetPassword: true,
    isActive: true,
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('Database connected.');

    // ─── 1. Clean Database (Dependent tables first) ──────────────────────────
    console.log('Clearing existing database records...');
    await prisma.notification.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.taskAssignment.deleteMany({});
    await prisma.taskDependency.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.epic.deleteMany({});
    await prisma.kanbanColumn.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Database tables cleared.');

    // ─── 2. Encrypt passwords & Create Users ─────────────────────────────────
    console.log('Seeding user accounts...');
    const createdUsers = [];
    for (const u of seedUsersData) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(u.passwordRaw, salt);

      const user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          mustResetPassword: u.mustResetPassword,
          isActive: u.isActive,
        }
      });
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users successfully.`);

    const pmUser = createdUsers.find(u => u.role === 'Project Manager');
    const devUser = createdUsers.find(u => u.role === 'Collaborator' && u.email === 'dev@quirk.app');
    const designerUser = createdUsers.find(u => u.role === 'Collaborator' && u.email === 'emma@quirk.app');
    const adminUser = createdUsers.find(u => u.role === 'Admin');

    // ─── 3. Create Workspace & Project ───────────────────────────────────────
    console.log('Seeding workspace and project...');
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Quirk Default Workspace',
        ownerId: adminUser.id,
        members: {
          create: createdUsers.map(u => ({
            userId: u.id,
            role: u.role === 'Admin' ? 'Owner' : u.role === 'Project Manager' ? 'Admin' : 'Member',
          }))
        }
      }
    });

    const project = await prisma.project.create({
      data: {
        name: 'Main Board',
        description: 'Primary project for tracking software development tasks.',
        workspaceId: workspace.id,
        createdBy: pmUser.id,
        templateType: 'Software Development',
        members: {
          create: createdUsers.map(u => ({
            userId: u.id,
            role: u.role === 'Collaborator' ? 'Collaborator' : 'Project Manager',
          }))
        }
      }
    });

    const columnsData = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Completed'];
    const columns = {};
    for (let i = 0; i < columnsData.length; i++) {
      const col = await prisma.kanbanColumn.create({
        data: { name: columnsData[i], order: i, projectId: project.id }
      });
      columns[columnsData[i]] = col.id;
    }

    // ─── 4. Create Tasks ─────────────────────────────────────────────────────
    console.log('Seeding initial tasks...');
    const tasksData = [
      {
        title: 'Design Dashboard Mockups',
        description: 'Create high fidelity visual designs for the main task tracking dashboard.',
        createdBy: pmUser.id,
        projectId: project.id,
        columnId: columns['In Progress'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'High',
        status: 'In Progress'
      },
      {
        title: 'Setup Backend Server Scaffolding',
        description: 'Initialize express framework, setup folder structure, config routers, and middleware.',
        createdBy: pmUser.id,
        projectId: project.id,
        columnId: columns['To Do'],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        priority: 'High',
        status: 'To Do'
      },
      {
        title: 'Write User Documentation',
        description: 'Write complete user guide for the Quirk application usage.',
        createdBy: pmUser.id,
        projectId: project.id,
        columnId: columns['Completed'],
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        priority: 'Low',
        status: 'Completed'
      }
    ];

    const createdTasks = [];
    for (const t of tasksData) {
      const task = await prisma.task.create({ data: t });
      createdTasks.push(task);
    }
    console.log(`Seeded ${createdTasks.length} tasks.`);

    // ─── 4. Create Task Assignments ──────────────────────────────────────────
    console.log('Seeding task assignments...');
    await prisma.taskAssignment.createMany({
      data: [
        { taskId: createdTasks[0].id, userId: designerUser.id },
        { taskId: createdTasks[0].id, userId: devUser.id },
        { taskId: createdTasks[1].id, userId: devUser.id }
      ]
    });
    console.log('Seeded assignments.');

    // ─── 5. Create Comments ──────────────────────────────────────────────────
    console.log('Seeding comments...');
    await prisma.comment.createMany({
      data: [
        {
          taskId: createdTasks[0].id,
          userId: designerUser.id,
          content: 'I have started draft 1 of the visual design. Will upload shortly.'
        },
        {
          taskId: createdTasks[0].id,
          userId: pmUser.id,
          content: 'Thanks Emma! Please ensure you match the color palette we discussed.'
        }
      ]
    });
    console.log('Seeded comments.');

    // ─── 6. Create Notifications ─────────────────────────────────────────────
    console.log('Seeding notifications...');
    await prisma.notification.createMany({
      data: [
        {
          recipientId: designerUser.id,
          type: 'Assignment',
          message: 'You have been assigned to task "Design Dashboard Mockups"',
          relatedTaskId: createdTasks[0].id,
          isRead: false
        },
        {
          recipientId: devUser.id,
          type: 'Assignment',
          message: 'You have been assigned to task "Setup Backend Server Scaffolding"',
          relatedTaskId: createdTasks[1].id,
          isRead: true
        }
      ]
    });
    console.log('Seeded notifications.');

    console.log('\n=========================================');
    console.log('PostgreSQL Database successfully seeded!');
    console.log('Seeded accounts for testing:');
    console.log(`  Admin:         email: admin@quirk.app  password: AdminPass123!`);
    console.log(`  Proj. Manager: email: pm@quirk.app     password: ManagerPass123!`);
    console.log(`  Collaborator:  email: dev@quirk.app    password: CollabPass123!`);
    console.log(`  Collaborator:  email: emma@quirk.app   password: CollabPass123! (needs password reset)`);
    console.log('=========================================\n');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await prisma.$disconnect();
    // Close the PG pool explicitly to allow the script to exit
    await pool.end();
    console.log('Disconnected from database.');
    process.exit(0);
  }
};

seedDatabase();
