import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Priorité 1 : cookie httpOnly (production sécurisée)
  // Priorité 2 : header Bearer (clients API, mobile, tests)
  const cookieToken = req.cookies?.accessToken;
  const authHeader = req.headers.authorization;

  let token: string | undefined;

  if (cookieToken) {
    token = cookieToken;
  } else if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (!roles.includes(req.user.role)) {
      logger.warn(`Accès refusé: ${req.user.email} tentant d'accéder à une ressource réservée aux rôles ${roles.join(', ')}`);
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
  };
};

export const canViewSalary = (req: Request, res: Response, next: NextFunction) => {
  const allowedRoles: UserRole[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];
  req.user = req.user || undefined;
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    req.body._hideSalary = true;
  }
  next();
};

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();
    try {
      await query(
        `INSERT INTO audit_logs(user_id, user_email, action, resource_type, resource_id, ip_address, user_agent)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          req.user.userId,
          req.user.email,
          action,
          resource,
          req.params.id || null,
          req.ip,
          req.headers['user-agent'],
        ]
      );
    } catch (err) {
      logger.error('Erreur audit log', err);
    }
    next();
  };
};
