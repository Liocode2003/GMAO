import { z } from 'zod';

const PERIODS  = ['ANNUEL', 'MI_ANNUEL', 'PROBATOIRE'] as const;
const STATUSES = ['BROUILLON', 'EN_COURS', 'TERMINE'] as const;
const score    = z.number().min(0, 'Note minimale : 0').max(20, 'Note maximale : 20');

export const createEvaluationSchema = z.object({
  employee_id:       z.string().uuid('employee_id invalide'),
  year:              z.number().int().min(2000).max(2100),
  period:            z.enum(PERIODS).optional(),
  status:            z.enum(STATUSES).optional(),
  objectives_score:  score.optional(),
  skills_score:      score.optional(),
  behavior_score:    score.optional(),
  comments:          z.string().max(5000).optional(),
  objectives:        z.string().max(5000).optional(),
  strengths:         z.string().max(5000).optional(),
  improvements:      z.string().max(5000).optional(),
});

export const updateEvaluationSchema = createEvaluationSchema.omit({ employee_id: true, year: true }).partial();
