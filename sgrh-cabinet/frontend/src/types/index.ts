export type UserRole = 'DRH' | 'DIRECTION_GENERALE' | 'ASSOCIE' | 'MANAGER' | 'UTILISATEUR';
export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT' | 'FREELANCE';
export type EmployeeStatus = 'ACTIF' | 'INACTIF';
export type Gender = 'M' | 'F';
export type ServiceLine = 'AUDIT_ASSURANCE' | 'CONSULTING_FA' | 'OUTSOURCING' | 'ADMINISTRATION' | 'JURIDIQUE_FISCALITE';
export type EmployeeFunction = 'AUDITEUR' | 'JURISTE_FISCALISTE' | 'INFORMATICIEN' | 'MANAGER_PRINCIPAL' | 'ASSOCIE' | 'DIRECTEUR' | 'ASSISTANT_DIRECTION' | 'SECRETAIRE' | 'CHAUFFEUR';
export type Grade = 'ASSISTANT_DEBUTANT' | 'ASSISTANT_CONFIRME' | 'JUNIOR' | 'SENIOR_1' | 'SENIOR_2' | 'SENIOR_3' | 'CONSULTANT' | 'ASSISTANT_MANAGER_1' | 'ASSISTANT_MANAGER_2' | 'ASSISTANT_MANAGER_3' | 'SENIOR_MANAGER_1' | 'SENIOR_MANAGER_2' | 'SENIOR_MANAGER_3' | 'DIRECTEUR' | 'ASSOCIE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
  lastLogin?: string;
}

export interface Employee {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  email?: string;
  phone?: string;
  birth_date?: string;
  function: EmployeeFunction;
  service_line: ServiceLine;
  grade: Grade;
  contract_type: ContractType;
  entry_date: string;
  exit_date?: string;
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
  age?: number;
  season?: number;
  seniority?: { years: number; months: number; label: string };
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardData {
  totalActive: number;
  byServiceLine: Array<{ service_line: string; count: string }>;
  byGender: Array<{ gender: string; count: string; percentage: string }>;
  byContractType: Array<{ contract_type: string; count: string }>;
  byAgeGroup: Array<{ age_group: string; count: string }>;
  bySeason: Array<{ season: string; count: string }>;
  withEmail: number;
  birthdaysThisMonth: Array<{
    id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    upcoming_age: number;
    birth_day_month: string;
  }>;
  contractsToRenew: Array<{
    id: string;
    matricule: string;
    first_name: string;
    last_name: string;
    contract_type: string;
    exit_date: string;
    days_remaining: number;
  }>;
}

export interface KPIData {
  year: number;
  month?: number;
  headcount: {
    permanent: string;
    cdi: string;
    cdd: string;
    stagiaires: string;
    prestataires: string;
    associes_carl: string;
    associes_local: string;
    hommes: string;
    femmes: string;
    total: string;
  };
  movements: { entries: string; exits: string };
  trainings: Array<{ type: string; count: string; total_hours: string; total_budget: string }>;
  totalTrainingHours: number;
  byServiceAndGrade: Array<{ service_line: string; grade: string; count: string }>;
  diplomas: { dec_french: string; decofi: string; other_dec: string; cisa: string; cfa: string };
  byGrade: Array<{ grade: string; count: string }>;
  turnover: { entries: string; exits: string };
  mobilitiesCount: number;
  targets: Record<string, number>;
}

// Labels pour l'affichage
export const SERVICE_LINE_LABELS: Record<ServiceLine, string> = {
  AUDIT_ASSURANCE: 'Audit & Assurance',
  CONSULTING_FA: 'Consulting & FA',
  OUTSOURCING: 'Outsourcing',
  ADMINISTRATION: 'Administration',
  JURIDIQUE_FISCALITE: 'Juridique & Fiscalité',
};

export const FUNCTION_LABELS: Record<EmployeeFunction, string> = {
  AUDITEUR: 'Auditeur',
  JURISTE_FISCALISTE: 'Juriste Fiscaliste',
  INFORMATICIEN: 'Informaticien',
  MANAGER_PRINCIPAL: 'Manager Principal',
  ASSOCIE: 'Associé',
  DIRECTEUR: 'Directeur',
  ASSISTANT_DIRECTION: 'Assistant de Direction',
  SECRETAIRE: 'Secrétaire',
  CHAUFFEUR: 'Chauffeur',
};

export const GRADE_LABELS: Record<Grade, string> = {
  ASSISTANT_DEBUTANT: 'Assistant Débutant',
  ASSISTANT_CONFIRME: 'Assistant Confirmé',
  JUNIOR: 'Junior',
  SENIOR_1: 'Senior 1',
  SENIOR_2: 'Senior 2',
  SENIOR_3: 'Senior 3',
  CONSULTANT: 'Consultant',
  ASSISTANT_MANAGER_1: 'Assistant Manager 1',
  ASSISTANT_MANAGER_2: 'Assistant Manager 2',
  ASSISTANT_MANAGER_3: 'Assistant Manager 3',
  SENIOR_MANAGER_1: 'Senior Manager 1',
  SENIOR_MANAGER_2: 'Senior Manager 2',
  SENIOR_MANAGER_3: 'Senior Manager 3',
  DIRECTEUR: 'Directeur',
  ASSOCIE: 'Associé',
};

export const CONTRACT_LABELS: Record<ContractType, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'Stage',
  CONSULTANT: 'Consultant (Prestation)',
  FREELANCE: 'Freelance (Mission)',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  DRH: 'DRH',
  DIRECTION_GENERALE: 'Direction Générale',
  ASSOCIE: 'Associé',
  MANAGER: 'Manager',
  UTILISATEUR: 'Utilisateur',
};
