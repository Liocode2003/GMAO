import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const date = z.string().regex(DATE_RE, 'Format date invalide (YYYY-MM-DD)');

const GENDERS         = ['M', 'F'] as const;
const SERVICE_LINES   = ['AUDIT_ASSURANCE', 'CONSULTING_FA', 'OUTSOURCING', 'ADMINISTRATION', 'JURIDIQUE_FISCALITE'] as const;
const FUNCTIONS       = ['AUDITEUR', 'JURISTE_FISCALISTE', 'INFORMATICIEN', 'MANAGER_PRINCIPAL', 'ASSOCIE', 'DIRECTEUR', 'ASSISTANT_DIRECTION', 'SECRETAIRE', 'CHAUFFEUR'] as const;
const GRADES          = [
  'ASSISTANT_DEBUTANT', 'ASSISTANT_CONFIRME',
  'JUNIOR', 'SENIOR_1', 'SENIOR_2', 'SENIOR_3',
  'CONSULTANT',
  'ASSISTANT_MANAGER_1', 'ASSISTANT_MANAGER_2', 'ASSISTANT_MANAGER_3',
  'SENIOR_MANAGER_1', 'SENIOR_MANAGER_2', 'SENIOR_MANAGER_3',
  'DIRECTEUR', 'ASSOCIE',
] as const;
const CONTRACT_TYPES  = ['CDI', 'CDD', 'STAGE', 'CONSULTANT', 'FREELANCE'] as const;
const MARITAL_STATUSES = ['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF'] as const;

const diplomaSchema = z.object({
  diploma_type:   z.string().min(1).max(100),
  diploma_other:  z.string().max(200).optional(),
  domaine:        z.string().max(100).optional(),
  domaine_other:  z.string().max(200).optional(),
});

// Schéma de base sans refine — nécessaire pour que .partial() fonctionne en Zod v4
const employeeBaseSchema = z.object({
  matricule:       z.string().min(1, 'Matricule requis').max(20),
  first_name:      z.string().min(1, 'Prénom requis').max(100),
  last_name:       z.string().min(1, 'Nom requis').max(100),
  gender:          z.enum(GENDERS, { error: 'Genre invalide (M ou F)' }),
  email:           z.string().email('Email invalide').optional().or(z.literal('')),
  phone:           z.string().max(25).optional(),
  birth_date:      date,
  function:        z.enum(FUNCTIONS, { error: 'Fonction invalide' }),
  service_line:    z.enum(SERVICE_LINES, { error: 'Service invalide' }),
  grade:           z.enum(GRADES, { error: 'Grade invalide' }),
  contract_type:   z.enum(CONTRACT_TYPES, { error: 'Type de contrat invalide' }),
  entry_date:      date,
  exit_date:       date.optional().or(z.literal('')),
  salary:          z.number().nonnegative('Le salaire ne peut pas être négatif').optional(),
  notes:           z.string().max(2000).optional(),
  has_dec_french:  z.boolean().optional(),
  has_decofi:      z.boolean().optional(),
  has_other_dec:   z.boolean().optional(),
  has_cisa:        z.boolean().optional(),
  has_cfa:         z.boolean().optional(),
  is_expatriate:   z.boolean().optional(),
  manager_id:      z.string().uuid('ID manager invalide').optional().or(z.literal('')),
  marital_status:  z.enum(MARITAL_STATUSES).optional(),
  spouse_name:     z.string().max(200).optional(),
  spouse_phone:    z.string().max(25).optional(),
  children_count:  z.number().int().nonnegative().max(20).optional(),
  diplomas:        z.array(diplomaSchema).optional(),
});

// Applique le refine APRÈS la définition du schéma complet (Zod v4 compatible)
export const createEmployeeSchema = employeeBaseSchema.refine(
  data => !data.exit_date || !data.entry_date || new Date(data.exit_date) >= new Date(data.entry_date),
  { message: "La date de sortie doit être postérieure à la date d'entrée", path: ['exit_date'] }
);

// .partial() sur le schéma de base (sans refine), puis refine appliqué dessus
export const updateEmployeeSchema = employeeBaseSchema.partial().refine(
  data => !data.exit_date || !data.entry_date || new Date(data.exit_date) >= new Date(data.entry_date),
  { message: "La date de sortie doit être postérieure à la date d'entrée", path: ['exit_date'] }
);
