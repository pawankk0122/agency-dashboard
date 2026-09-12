import { prisma } from '../config/db.js';
import { TaskStatus, Priority, NotificationType } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';
import { io } from '../server.js';

export class TaskService {
  static async updateStatus(
    taskId: string,
    newStatus: TaskStatus,
    actor: { userId: string; name: string }
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!existing) throw new NotFoundError('Task not found');

    const oldStatus = existing.status;
    const logDetails = `${actor.name} moved Task #${existing.taskNumber} from ${oldStatus.replace('_', ' ')} → ${newStatus.replace('_', ' ')}`;

    // Atomic operation: update task, write log, check notifications
    const [updatedTask, activity] = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId },
        data: { status: newStatus },
        include: { assignedDeveloper: { select: { id: true, name: true } } },
      });

      const log = await tx.activityLog.create({
        data: {
          userId: actor.userId,
          projectId: existing.projectId,
          taskId: existing.id,
          action: 'STATUS_CHANGE',
          oldStatus,
          newStatus,
          details: logDetails,
        },
        include: { user: { select: { id: true, name: true, role: true } } },
      });

      // Notify PM if task moved to IN_REVIEW
      if (newStatus === TaskStatus.IN_REVIEW && existing.project.managerId !== actor.userId) {
        const notif = await tx.notification.create({
          data: {
            userId: existing.project.managerId,
            taskId: existing.id,
            type: NotificationType.TASK_IN_REVIEW,
            title: 'Task In Review',
            message: `${actor.name} submitted Task #${existing.taskNumber} for review`,
          },
        });
        io.to(`user:${existing.project.managerId}`).emit('notification:new', notif);
      }

      return [t, log];
    });

    // Real-time broadcast to project room and global feed room
    io.to(`project:${existing.projectId}`).emit('task:updated', updatedTask);
    io.to(`project:${existing.projectId}`).emit('activity:new', activity);
    io.to('global:admin').emit('activity:new', activity);

    return updatedTask;
  }

  static async getTasksByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: {
        assignedDeveloper: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignedDeveloper: { select: { id: true, name: true, email: true } },
      },
    });
    if (!task) throw new NotFoundError('Task not found');
    return task;
  }

  static async createTask(data: {
    title: string;
    description?: string;
    priority?: Priority;
    projectId: string;
    assignedDeveloperId?: string;
  }) {
    const task = await prisma.task.create({
      data,
      include: {
        assignedDeveloper: { select: { id: true, name: true } },
      },
    });

    io.to(`project:${data.projectId}`).emit('task:created', task);
    return task;
  }

  static async deleteTask(taskId: string) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new NotFoundError('Task not found');

    await prisma.task.delete({ where: { id: taskId } });
    io.to(`project:${existing.projectId}`).emit('task:deleted', { id: taskId });
    return { success: true };
  }
}
