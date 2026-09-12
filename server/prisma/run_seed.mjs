import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('--- Cleaning database ---');
  try { await prisma.notification?.deleteMany(); } catch (e) {}
  try { await prisma.activityLog?.deleteMany(); } catch (e) {}
  try { await prisma.task?.deleteMany(); } catch (e) {}
  try { await prisma.projectMember?.deleteMany(); } catch (e) {}
  try { await prisma.project?.deleteMany(); } catch (e) {}
  try { await prisma.user?.deleteMany(); } catch (e) {}

  console.log('--- Creating Users ---');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN, passwordHash },
  });

  // 2 Project Managers
  const pm1 = await prisma.user.create({
    data: { name: 'Sarah PM', email: 'pm1@example.com', role: Role.PROJECT_MANAGER, passwordHash },
  });
  const pm2 = await prisma.user.create({
    data: { name: 'David PM', email: 'pm2@example.com', role: Role.PROJECT_MANAGER, passwordHash },
  });

  // 4 Developers
  const devs = await Promise.all([
    prisma.user.create({ data: { name: 'Ravi Dev', email: 'dev1@example.com', role: Role.DEVELOPER, passwordHash } }),
    prisma.user.create({ data: { name: 'Amina Dev', email: 'dev2@example.com', role: Role.DEVELOPER, passwordHash } }),
    prisma.user.create({ data: { name: 'Chen Dev', email: 'dev3@example.com', role: Role.DEVELOPER, passwordHash } }),
    prisma.user.create({ data: { name: 'Elena Dev', email: 'dev4@example.com', role: Role.DEVELOPER, passwordHash } }),
  ]);

  console.log('--- Creating 3 Projects ---');
  const project1 = await prisma.project.create({
    data: {
      name: 'Alpha FinTech Portal',
      description: 'Real-time banking analytics platform',
      manager: { connect: { id: pm1.id } },
    },
  });
  const project2 = await prisma.project.create({
    data: {
      name: 'HealthCare Mobile Sync',
      description: 'Patient monitoring dashboard',
      manager: { connect: { id: pm1.id } },
    },
  });
  const project3 = await prisma.project.create({
    data: {
      name: 'E-Commerce Core API',
      description: 'Scalable multi-tenant catalog service',
      manager: { connect: { id: pm2.id } },
    },
  });

  // Project Members
  for (const p of [project1, project2]) {
    await prisma.projectMember.createMany({
      data: [
        { userId: pm1.id, projectId: p.id },
        { userId: devs[0].id, projectId: p.id },
        { userId: devs[1].id, projectId: p.id },
      ],
    });
  }
  await prisma.projectMember.createMany({
    data: [
      { userId: pm2.id, projectId: project3.id },
      { userId: devs[2].id, projectId: project3.id },
      { userId: devs[3].id, projectId: project3.id },
    ],
  });

  console.log('--- Seeding Tasks with assignedDeveloperId ---');
  const pastDate1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pastDate2 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const futureDate1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const futureDate2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

  // Project 1 Tasks (2 Overdue)
  const t1 = await prisma.task.create({
    data: {
      title: 'Implement OAuth2 SSO',
      projectId: project1.id,
      assignedDeveloperId: devs[0].id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      dueDate: pastDate1,
      isOverdue: true,
    },
  });
  const t2 = await prisma.task.create({
    data: {
      title: 'Postgres Connection Pooling',
      projectId: project1.id,
      assignedDeveloperId: devs[1].id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: pastDate2,
      isOverdue: true,
    },
  });
  const t3 = await prisma.task.create({
    data: {
      title: 'Audit Trail Logging',
      projectId: project1.id,
      assignedDeveloperId: devs[0].id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });
  await prisma.task.create({
    data: {
      title: 'Latency Benchmarking',
      projectId: project1.id,
      assignedDeveloperId: devs[1].id,
      status: TaskStatus.DONE,
      priority: Priority.LOW,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });
  await prisma.task.create({
    data: {
      title: 'Docker Compose Healthchecks',
      projectId: project1.id,
      assignedDeveloperId: devs[0].id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  // Project 2 Tasks (5 tasks)
  await prisma.task.createMany({
    data: [
      { title: 'HIPAA Compliance Check', projectId: project2.id, assignedDeveloperId: devs[1].id, status: TaskStatus.TODO, priority: Priority.URGENT, dueDate: futureDate1, isOverdue: false },
      { title: 'WebRTC Video Consult', projectId: project2.id, assignedDeveloperId: devs[0].id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: futureDate2, isOverdue: false },
      { title: 'Push Notifications Integration', projectId: project2.id, assignedDeveloperId: devs[1].id, status: TaskStatus.IN_REVIEW, priority: Priority.MEDIUM, dueDate: futureDate1, isOverdue: false },
      { title: 'Device Battery Optimization', projectId: project2.id, assignedDeveloperId: devs[0].id, status: TaskStatus.DONE, priority: Priority.LOW, dueDate: futureDate2, isOverdue: false },
      { title: 'EHR Export Endpoint', projectId: project2.id, assignedDeveloperId: devs[1].id, status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: futureDate1, isOverdue: false },
    ],
  });

  // Project 3 Tasks (5 tasks)
  await prisma.task.createMany({
    data: [
      { title: 'Stripe Webhooks Handling', projectId: project3.id, assignedDeveloperId: devs[2].id, status: TaskStatus.IN_PROGRESS, priority: Priority.URGENT, dueDate: futureDate1, isOverdue: false },
      { title: 'Product Search Indexing', projectId: project3.id, assignedDeveloperId: devs[3].id, status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: futureDate1, isOverdue: false },
      { title: 'Cart Redis Session Storage', projectId: project3.id, assignedDeveloperId: devs[2].id, status: TaskStatus.DONE, priority: Priority.MEDIUM, dueDate: futureDate2, isOverdue: false },
      { title: 'Automated Invoice PDFs', projectId: project3.id, assignedDeveloperId: devs[3].id, status: TaskStatus.IN_REVIEW, priority: Priority.MEDIUM, dueDate: futureDate1, isOverdue: false },
      { title: 'Rate Limiting Middleware', projectId: project3.id, assignedDeveloperId: devs[2].id, status: TaskStatus.TODO, priority: Priority.LOW, dueDate: futureDate2, isOverdue: false },
    ],
  });

  console.log('--- Seeding Pre-existing Activity Logs ---');
  try {
    if (prisma.activityLog) {
      await prisma.activityLog.createMany({
        data: [
          { action: 'Ravi Dev moved Task (Implement OAuth2 SSO) to In Progress', userId: devs[0].id, taskId: t1.id, projectId: project1.id, createdAt: new Date(Date.now() - 3600000) },
          { action: 'Sarah PM created Project Alpha FinTech Portal', userId: pm1.id, projectId: project1.id, createdAt: new Date(Date.now() - 7200000) },
        ],
      });
    }
  } catch (logErr) {
    console.log('Activity log note:', logErr.message);
  }

  console.log('--- Seed Completed Successfully! ---');
  console.log('Admin: admin@example.com (Password123!)');
  console.log('PMs:   pm1@example.com, pm2@example.com');
  console.log('Devs:  dev1@example.com, dev2@example.com, dev3@example.com, dev4@example.com');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
