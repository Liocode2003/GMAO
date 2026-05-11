import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Token de rafraîchissement requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});
