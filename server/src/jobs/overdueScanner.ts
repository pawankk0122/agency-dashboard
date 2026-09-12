import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { TaskStatus, NotificationType } from '@prisma/client';
import { io } from '../server.js';

export const startOverdueScanner = () => {
  // Runs every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE },
        isOverdue: false,
      },
      include: { project: true },
    });

    if (overdueTasks.length === 0) return;

    for (const task of overdueTasks) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        // Notify assigned developer if one exists
        if (task.assignedDeveloperId) {
          const notif = await tx.notification.create({
            data: {
              userId: task.assignedDeveloperId,
              taskId: task.id,
              type: NotificationType.TASK_OVERDUE,
              message: `Task #${task.taskNumber} (${task.title}) has passed its deadline.`,
            },
          });
          io.to(`user:${task.assignedDeveloperId}`).emit('notification:new', notif);
        }
      });

      io.to(`project:${task.projectId}`).emit('task:overdue', { taskId: task.id });
    }
  });
};
