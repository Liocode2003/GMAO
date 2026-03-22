import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
       FROM users ORDER BY last_name, first_name`
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { email, password, first_name, last_name, role } = req.body;

  if (!email || !password || !first_name || !last_name || !role) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows[0]) return res.status(409).json({ error: 'Email déjà utilisé' });

  const hash = await bcrypt.hash(password, 12);

  try {
    const result = await query(
      `INSERT INTO users(email, password_hash, first_name, last_name, role)
       VALUES($1,$2,$3,$4,$5) RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email.toLowerCase(), hash, first_name, last_name, role]
    );
    logger.info(`Utilisateur créé: ${email} par ${req.user?.email}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, is_active, first_name, last_name } = req.body;

  try {
    const result = await query(
      `UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active),
         first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name), updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, is_active`,
      [role, is_active, first_name, last_name, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Mot de passe invalide' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, id]);
  logger.info(`Mot de passe réinitialisé pour utilisateur ${id} par ${req.user?.email}`);
  return res.json({ message: 'Mot de passe réinitialisé' });
};

export const getAuditLogs = async (req: Request, res: Response) => {
  const { page = '1', limit = '50', resource_type, user_id } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (resource_type) { conditions.push(`al.resource_type = $${pi++}`); params.push(resource_type); }
  if (user_id) { conditions.push(`al.user_id = $${pi++}`); params.push(user_id); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT al.*, u.first_name || ' ' || u.last_name as user_name
       FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${pi++} OFFSET $${pi}`,
      params
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
