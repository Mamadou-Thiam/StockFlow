import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
    email: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token non fourni', code: 'NO_TOKEN' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      companyId: string;
      role: string;
      email: string;
    };
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide', code: 'INVALID_TOKEN' });
  }
}
