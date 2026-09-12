import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { loginSchema } from '../validators/index.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/token.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      const tokens = await AuthService.refreshTokens(token);
      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: { accessToken: tokens.accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.cookies.refreshToken);
      clearRefreshTokenCookie(res);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}
