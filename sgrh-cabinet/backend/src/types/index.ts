export type UserRole = 'DRH' | 'DIRECTION_GENERALE' | 'ASSOCIE' | 'MANAGER' | 'UTILISATEUR';
export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT' | 'FREELANCE';
export type EmployeeStatus = 'ACTIF' | 'INACTIF';
export type Gender = 'M' | 'F';
export type ServiceLine =
  | 'AUDIT_ASSURANCE'
  | 'CONSULTING_FA'
  | 'OUTSOURCING'
  | 'ADMINISTRATION'
  | 'JURIDIQUE_FISCALITE';
export type EmployeeFunction =
  | 'AUDITEUR'
  | 'JURISTE_FISCALISTE'
  | 'INFORMATICIEN'
  | 'MANAGER_PRINCIPAL'
  | 'ASSOCIE'
  | 'DIRECTEUR'
  | 'ASSISTANT_DIRECTION'
  | 'SECRETAIRE'
  | 'CHAUFFEUR';
export type Grade =
  | 'ASSISTANT_DEBUTANT'
  | 'ASSISTANT_CONFIRME'
  | 'JUNIOR'
  | 'SENIOR_1'
  | 'SENIOR_2'
  | 'SENIOR_3'
  | 'CONSULTANT'
  | 'ASSISTANT_MANAGER_1'
  | 'ASSISTANT_MANAGER_2'
  | 'ASSISTANT_MANAGER_3'
  | 'SENIOR_MANAGER_1'
  | 'SENIOR_MANAGER_2'
  | 'SENIOR_MANAGER_3'
  | 'DIRECTEUR'
  | 'ASSOCIE';
export type FormationType = 'INTRA' | 'INTERNE' | 'AOC' | 'GROUPE';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
}

export interface Employee {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  email?: string;
  phone?: string;
  birth_date: Date;
  function: EmployeeFunction;
  service_line: ServiceLine;
  grade: Grade;
  contract_type: ContractType;
  entry_date: Date;
  exit_date?: Date;
  salary?: number;
  status: EmployeeStatus;
  notes?: string;
  has_dec_french: boolean;
  has_decofi: boolean;
  has_other_dec: boolean;
  has_cisa: boolean;
  has_cfa: boolean;
  department?: string;
  is_expatriate: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
