import { z } from 'zod';
import { TaskStatus, Priority } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Valid work email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must have at least 3 characters'),
  description: z.string().optional(),
  clientId: z.string().uuid('Valid Client UUID required'),
  dueDate: z.string().datetime().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid('Valid Project UUID required'),
  assignedDeveloperId: z.string().uuid().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().datetime(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});
