import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';
import { prisma } from '../config/db.js';
import { Role } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: Role;
    email: string;
  };
}

export const onlineUsers = new Map<string, number>();

export const initSocketServer = (httpServer: HttpServer, clientUrl: string) => {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  // JWT Middleware for WebSockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required'));

    try {
      const decoded = verifyAccessToken(token);
      socket.data = { userId: decoded.userId, role: decoded.role, email: decoded.email };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, role } = socket.data;

    // Manage online presence count
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    io.emit('presence:count', onlineUsers.size);

    // Join personal user room for targeted notifications
    socket.join(`user:${userId}`);

    // Join admin global activity feed
    if (role === Role.ADMIN) {
      socket.join('global:admin');
    }

    // Join project room with access validation
    socket.on('project:join', async (projectId: string) => {
      if (role === Role.ADMIN) {
        socket.join(`project:${projectId}`);
        return;
      }
      if (role === Role.PROJECT_MANAGER) {
        const owns = await prisma.project.findFirst({
          where: { id: projectId, managerId: userId },
        });
        if (owns) socket.join(`project:${projectId}`);
        return;
      }
      if (role === Role.DEVELOPER) {
        const assigned = await prisma.task.findFirst({
          where: { projectId, assignedDeveloperId: userId },
        });
        if (assigned) socket.join(`project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      const current = onlineUsers.get(userId) || 1;
      if (current <= 1) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, current - 1);
      }
      io.emit('presence:count', onlineUsers.size);
    });
  });

  return io;
};
