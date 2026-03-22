import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'sgrh_secret_key_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_DAYS = 7;

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    await query(
      'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES($1,$2,$3)',
      [user.id, refreshToken, expiresAt]
    );

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info(`Connexion réussie: ${email}`);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error('Erreur login', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Token de rafraîchissement manquant' });

  try {
    const result = await query(
      `SELECT rt.user_id, u.email, u.role, u.first_name, u.last_name
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND u.is_active = true`,
      [refreshToken]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Token de rafraîchissement invalide' });
    }

    const { user_id, email, role } = result.rows[0];
    const payload: JwtPayload = { userId: user_id, email, role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return res.json({ accessToken });
  } catch (err) {
    logger.error('Erreur refresh', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  return res.json({ message: 'Déconnexion réussie' });
};

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, last_login, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Mot de passe invalide (minimum 8 caractères)' });
  }

  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.userId]);

    return res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
