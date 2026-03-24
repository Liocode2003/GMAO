import { z } from 'zod';

const TRAINING_TYPES = ['INTERNE', 'EXTERNE', 'E_LEARNING', 'CERTIFICATION'] as const;

export const createTrainingSchema = z.object({
  type: z.enum(TRAINING_TYPES, { error: `Type de formation invalide. Valeurs : ${TRAINING_TYPES.join(', ')}` }),
  title: z.string().min(1, 'Titre requis').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  location: z.string().max(200).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format heure invalide (HH:MM)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format heure invalide (HH:MM)').optional(),
  duration_hours: z.number().positive('La durée doit être positive').optional(),
  trainer: z.string().max(200).optional(),
  observations: z.string().max(2000).optional(),
  budget: z.number().nonnegative('Le budget ne peut pas être négatif').optional(),
  participant_ids: z.array(z.string().uuid('ID participant invalide')).optional(),
});

export const updateTrainingSchema = createTrainingSchema.partial();
