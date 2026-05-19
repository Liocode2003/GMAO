export const ROLES = {
  DRH:                'DRH',
  DIRECTION_GENERALE: 'DIRECTION_GENERALE',
  ADG:                'ADG',
  MANAGER:            'MANAGER',
  ASSOCIE:            'ASSOCIE',
  UTILISATEUR:        'UTILISATEUR',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLES_ADMIN: Role[]     = [ROLES.DRH, ROLES.DIRECTION_GENERALE];
export const ROLES_SALARY: Role[]    = [ROLES.DRH, ROLES.DIRECTION_GENERALE, ROLES.ASSOCIE];

export const EVAL_PERIOD_LABELS: Record<string, string> = {
  ANNUEL:     'Annuel',
  MI_ANNUEL:  'Mi-annuel',
  PROBATOIRE: 'Probatoire',
};

export const EVAL_STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_COURS:  'En cours',
  TERMINE:   'Terminé',
};

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  NOUVEAU:   'Nouveau',
  EN_COURS:  'En cours',
  ENTRETIEN: 'Entretien',
  OFFRE:     'Offre',
  EMBAUCHE:  'Embauché',
  REFUSE:    'Refusé',
};

export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  EN_COURS:   'En cours',
  GAGNE:      'Gagné',
  PERDU:      'Perdu',
  SANS_SUITE: 'Sans suite',
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE:   'Approuvé',
  REFUSE:     'Refusé',
};

export const PAYSLIP_STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE:    'Publié',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CDI:        'CDI',
  CDD:        'CDD',
  STAGE:      'Stage',
  CONSULTANT: 'Consultant',
  FREELANCE:  'Freelance',
};

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  INTRA:   'Intra',
  INTERNE: 'Interne',
  AOC:     'AOC',
  GROUPE:  'Groupe',
};

export const SERVICE_LINE_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE:     'Audit & Assurance',
  CONSULTING_FA:       'Consulting FA',
  OUTSOURCING:         'Outsourcing',
  ADMINISTRATION:      'Administration',
  JURIDIQUE_FISCALITE: 'Juridique & Fiscalité',
};

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
