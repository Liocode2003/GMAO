import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const date    = z.string().regex(DATE_RE, 'Format date invalide (YYYY-MM-DD)');
const TYPES   = ['AMI', 'APPEL_OFFRE'] as const;
const STATUSES = ['EN_COURS', 'GAGNE', 'PERDU', 'SANS_SUITE'] as const;

export const createSubmissionSchema = z.object({
  type:                     z.enum(TYPES, { error: 'Type invalide (AMI ou APPEL_OFFRE)' }),
  reference:                z.string().max(50).optional(),
  title:                    z.string().min(1, 'Titre requis').max(300),
  client:                   z.string().min(1, 'Client requis').max(200),
  submission_date:          date,
  service_line:             z.string().max(100).optional(),
  responsible_employee_id:  z.string().uuid('ID responsable invalide').optional().or(z.literal('')),
  status:                   z.enum(STATUSES).optional(),
  contract_amount:          z.number().nonnegative().optional(),
  contract_start_date:      date.optional().or(z.literal('')),
  contract_end_date:        date.optional().or(z.literal('')),
}).refine(
  data => data.status !== 'GAGNE' || (!!data.contract_amount && !!data.contract_start_date && !!data.contract_end_date),
  { message: 'Montant, date début et date fin sont requis pour le statut GAGNE', path: ['contract_amount'] }
);

export const updateSubmissionSchema = createSubmissionSchema.partial();
