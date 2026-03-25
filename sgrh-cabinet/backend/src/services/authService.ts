import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../config/database';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const authService = {
  async validateCredentials(email: string, password: string) {
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) return null;
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;
    return user;
  },

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  },

  async createRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
    await query(
      'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES($1,$2,$3)',
      [userId, token, expiresAt]
    );
    return token;
  },

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const result = await query(
      `SELECT rt.user_id, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND u.is_active = true`,
      [refreshToken]
    );
    if (!result.rows[0]) return null;
    const { user_id, email, role } = result.rows[0];
    const payload: JwtPayload = { userId: user_id, email, role };
    return this.generateAccessToken(payload);
  },

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  },

  async updateLastLogin(userId: string): Promise<void> {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  async createPasswordResetToken(email: string): Promise<{ token: string; user: { id: string; email: string; first_name: string } } | null> {
    const result = await query(
      'SELECT id, email, first_name FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) return null;

    // Invalider les anciens tokens
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await query(
      'INSERT INTO password_reset_tokens(user_id, token, expires_at) VALUES($1,$2,$3)',
      [user.id, token, expiresAt]
    );
    return { token, user };
  },

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const result = await query(
      `SELECT prt.user_id FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = false`,
      [token]
    );
    if (!result.rows[0]) return false;

    const { user_id } = result.rows[0];
    const hash = await bcrypt.hash(newPassword, 12);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, user_id]);
    await query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);

    return true;
  },
};
