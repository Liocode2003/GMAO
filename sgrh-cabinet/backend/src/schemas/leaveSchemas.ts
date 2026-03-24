import { z } from 'zod';

const LEAVE_TYPES = ['PLANIFIE', 'IMPRÉVU'] as const;
const LEAVE_STATUS = ['APPROUVE', 'REFUSE'] as const;

export const createLeaveSchema = z.object({
  type: z.enum(LEAVE_TYPES, { error: 'Type de congé invalide (PLANIFIE ou IMPRÉVU)' }),
  absence_subtype: z.string().max(100).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'La date de fin doit être supérieure ou égale à la date de début', path: ['end_date'] }
);

export const approveLeaveSchema = z.object({
  status: z.enum(LEAVE_STATUS, { error: 'Statut invalide (APPROUVE ou REFUSE)' }),
  notes: z.string().max(1000).optional(),
});
