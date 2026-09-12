import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { Role, Prisma } from '@prisma/client';

export class FeedController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.status(200).json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.body;

      if (id) {
        await prisma.notification.updateMany({
          where: { id, userId },
          data: { isRead: true },
        });
      } else {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      }

      res.status(200).json({ success: true, message: 'Notifications updated' });
    } catch (error) {
      next(error);
    }
  }

  static async getMissedActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const where: Prisma.ActivityLogWhereInput = {};

      if (user.role === Role.PROJECT_MANAGER) {
        where.project = { managerId: user.userId };
      } else if (user.role === Role.DEVELOPER) {
        where.task = { assignedDeveloperId: user.userId };
      }

      const activities = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { id: true, name: true, role: true } } },
      });

      res.status(200).json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }
}

