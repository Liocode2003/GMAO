import { z } from 'zod';

const STATUSES = ['NOUVEAU', 'EN_COURS', 'ENTRETIEN', 'OFFRE', 'EMBAUCHE', 'REFUSE'] as const;

export const createCandidateSchema = z.object({
  first_name:       z.string().min(1, 'Prénom requis').max(100),
  last_name:        z.string().min(1, 'Nom requis').max(100),
  email:            z.string().email('Email invalide').optional().or(z.literal('')),
  phone:            z.string().max(25).optional(),
  position:         z.string().min(1, 'Poste requis').max(200),
  department:       z.string().max(100).optional(),
  status:           z.enum(STATUSES).optional(),
  source:           z.string().max(100).optional(),
  cover_letter:     z.string().max(5000).optional(),
  notes:            z.string().max(5000).optional(),
  interview_date:   z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  salary_expected:  z.number().nonnegative().optional(),
});

export const updateCandidateSchema = createCandidateSchema.partial();
