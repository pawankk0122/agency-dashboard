import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { TaskController } from '../controllers/task.controller.js';
import { FeedController } from '../controllers/feed.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { requireTaskAccess } from '../middleware/ownership.js';
import { Role } from '@prisma/client';

const router = Router();

// Auth Endpoints
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/logout', AuthController.logout);

// Tasks
router.get('/tasks', authenticateJWT, TaskController.getTasks);
router.patch(
  '/tasks/:id/status',
  authenticateJWT,
  requireTaskAccess,
  TaskController.updateStatus
);

// Real-Time Feed Reconnection Catchup
router.get('/activities/feed', authenticateJWT, FeedController.getMissedActivities);

// In-App Notifications
router.get('/notifications', authenticateJWT, FeedController.getNotifications);
router.patch('/notifications/read', authenticateJWT, FeedController.markNotificationsRead);

export default router;

