import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateJWT = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Forbidden: Insufficient role permissions'));
    }
    next();
  };
};
