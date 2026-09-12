import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { TaskService } from '../services/task.service.js';
import { createTaskSchema, updateTaskStatusSchema, taskQuerySchema } from '../validators/index.js';
import { Role, Prisma } from '@prisma/client';

export class TaskController {
  static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const query = taskQuerySchema.parse(req.query);

      const where: Prisma.TaskWhereInput = {};

      // Role scoping
      if (user.role === Role.DEVELOPER) {
        where.assignedDeveloperId = user.userId;
      } else if (user.role === Role.PROJECT_MANAGER) {
        where.project = { managerId: user.userId };
      }

      // Query Filters
      if (query.status) where.status = query.status;
      if (query.priority) where.priority = query.priority;
      if (query.dueDateFrom || query.dueDateTo) {
        where.dueDate = {
          ...(query.dueDateFrom && { gte: new Date(query.dueDateFrom) }),
          ...(query.dueDateTo && { lte: new Date(query.dueDateTo) }),
        };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedDeveloper: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, managerId: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      });

      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = updateTaskStatusSchema.parse(req.body);
      const user = req.user!;

      const currentUser = await prisma.user.findUniqueOrThrow({
        where: { id: user.userId },
        select: { name: true },
      });

const updated = await TaskService.updateStatus(String(id), status, {
  userId: user.userId,
  name: currentUser.name,
});
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
