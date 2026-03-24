import { z } from 'zod';

const VALID_ROLES = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER', 'RH', 'CONSULTANT'] as const;

export const createUserSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  first_name: z.string().min(1, 'Prénom requis').max(100),
  last_name: z.string().min(1, 'Nom requis').max(100),
  role: z.enum(VALID_ROLES, { error: `Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(', ')}` }),
});

export const updateUserSchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  is_active: z.boolean().optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
