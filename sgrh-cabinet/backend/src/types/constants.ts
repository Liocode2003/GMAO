export const ROLES = {
  DRH:               'DRH',
  DIRECTION_GENERALE: 'DIRECTION_GENERALE',
  MANAGER:           'MANAGER',
  ASSOCIE:           'ASSOCIE',
  UTILISATEUR:       'UTILISATEUR',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const CAN_VIEW_SALARY: Role[] = [ROLES.DRH, ROLES.DIRECTION_GENERALE, ROLES.ASSOCIE];
export const CAN_WRITE_COMMERCIAL: Role[] = [ROLES.DRH, ROLES.ASSOCIE, ROLES.MANAGER];

export const LEAVE_STATUSES   = ['EN_ATTENTE', 'APPROUVE', 'REFUSE'] as const;
export const EVAL_PERIODS     = ['ANNUEL', 'MI_PERIODE', 'PROBATOIRE'] as const;
export const EVAL_STATUSES    = ['BROUILLON', 'EN_COURS', 'TERMINE'] as const;
export const CANDIDATE_STATUSES = ['NOUVEAU', 'EN_COURS', 'ENTRETIEN', 'OFFRE', 'EMBAUCHE', 'REFUSE'] as const;
export const COMMERCIAL_TYPES  = ['AMI', 'APPEL_OFFRE'] as const;
export const COMMERCIAL_STATUSES = ['EN_COURS', 'GAGNE', 'PERDU', 'SANS_SUITE'] as const;
export const PAYSLIP_STATUSES  = ['BROUILLON', 'PUBLIE'] as const;
export const CONTRACT_TYPES    = ['CDI', 'CDD', 'STAGE', 'CONSULTANT', 'FREELANCE'] as const;
export const TRAINING_TYPES    = ['INTRA', 'INTERNE', 'AOC', 'GROUPE'] as const;
