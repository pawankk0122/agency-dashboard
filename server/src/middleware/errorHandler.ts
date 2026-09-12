import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
