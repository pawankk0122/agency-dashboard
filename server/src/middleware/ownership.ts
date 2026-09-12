import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.projectId || req.params.id;
    const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!projectId) return next();

    const user = (req as any).user;
    if (user.role === 'ADMIN') return next();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        tasks: true,
      },
    });

    if (!project) throw new NotFoundError('Project not found');

    const isMember = project.members.some((m) => m.userId === user.userId);
    const isManager = project.managerId === user.userId;

    if (!isMember && !isManager) {
      throw new ForbiddenError('You do not have access to this project');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkTaskAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.taskId || req.params.id;
    const taskId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!taskId) return next();

    const user = (req as any).user;
    if (user.role === 'ADMIN') return next();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) throw new NotFoundError('Task not found');

    const isAssigned = task.assignedDeveloperId === user.userId;
    const isManager = task.project.managerId === user.userId;

    if (!isAssigned && !isManager) {
      throw new ForbiddenError('You do not have permission to modify this task');
    }

    next();
  } catch (error) {
    next(error);
  }
};
export const requireTaskAccess = checkTaskAccess;
export const requireProjectAccess = checkProjectAccess;
