import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { JwtPayload } from '../types';
import { authService } from '../services/authService';
import { sendPasswordResetEmail } from '../services/emailService';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const user = await authService.validateCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = authService.generateAccessToken(payload);
    const refreshToken = await authService.createRefreshToken(user.id);
    await authService.updateLastLogin(user.id);

    logger.info(`Connexion réussie: ${email}`);

    const isProduction = process.env.NODE_ENV === 'production';

    // Stocker les tokens dans des cookies httpOnly (sécurité renforcée)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000, // 1 heure
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/api/auth',
    });

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
    const accessToken = await authService.refreshAccessToken(refreshToken);
    if (!accessToken) {
      return res.status(401).json({ error: 'Token de rafraîchissement invalide' });
    }
    return res.json({ accessToken });
  } catch (err) {
    logger.error('Erreur refresh', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }
  // Nettoyer les cookies
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
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
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const result = await authService.createPasswordResetToken(email);
    if (result) {
      const sent = await sendPasswordResetEmail(result.user.email, result.user.first_name, result.token);
      if (!sent) {
        logger.warn(`Email de réinitialisation non envoyé pour ${email} (SMTP non configuré)`);
      }
      logger.info(`Demande de réinitialisation de mot de passe: ${email}`);
    }
    // Toujours renvoyer 200 pour éviter l'énumération d'emails
    return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    logger.error('Erreur forgotPassword', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    const success = await authService.resetPassword(token, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }
    logger.info(`Mot de passe réinitialisé via token`);
    return res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    logger.error('Erreur resetPassword', err);
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
    const valid = await authService.verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hash = await authService.hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.userId]);

    return res.json({ message: 'Mot de passe mis à jour' });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
