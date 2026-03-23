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

export type MaritalStatus = 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';

export interface EmployeeDiploma {
  id?: string;
  diploma_type: string;
  diploma_other?: string;
  domaine?: string;
  domaine_other?: string;
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
  diplomas?: EmployeeDiploma[];
  department?: string;
  is_expatriate: boolean;
  // Nouveaux champs v2
  photo_url?: string;
  manager_id?: string;
  manager_name?: string;
  marital_status?: MaritalStatus;
  spouse_name?: string;
  spouse_phone?: string;
  children_count?: number;
  leave_balance?: number;
  age?: number;
  season?: number;
  seniority?: { years: number; months: number; label: string };
  created_at: string;
  updated_at: string;
}

export interface SalaryHistory {
  id: string;
  employee_id: string;
  old_salary: number | null;
  new_salary: number;
  effective_date: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export type LeaveType = 'PLANIFIE' | 'IMPRÉVU';
export type LeaveStatus = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE';
export type AbsenceSubtype = 'MALADIE' | 'DECES_FAMILLE' | 'URGENCE' | 'AUTRE';

export interface Leave {
  id: string;
  employee_id: string;
  type: LeaveType;
  absence_subtype?: AbsenceSubtype;
  start_date: string;
  end_date: string;
  days: number;
  year: number;
  status: LeaveStatus;
  notes?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface LeaveBalance {
  employee_id: string;
  year: number;
  annual_allowance: number;
  carry_over: number;
  days_taken: number;
  days_unpaid: number;
  balance: number;
  days_unplanned: number;
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REFUSE: 'Refusé',
};

export const ABSENCE_SUBTYPE_LABELS: Record<AbsenceSubtype, string> = {
  MALADIE: 'Maladie',
  DECES_FAMILLE: 'Décès famille',
  URGENCE: 'Urgence',
  AUTRE: 'Autre',
};

export interface ImportRow {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: string[];
  isDuplicate: boolean;
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
  diplomas: Array<{ diploma_type: string; count: string }>;
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

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  CELIBATAIRE: 'Célibataire',
  MARIE: 'Marié(e)',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf / Veuve',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  DRH: 'DRH',
  DIRECTION_GENERALE: 'Direction Générale',
  ASSOCIE: 'Associé',
  MANAGER: 'Manager',
  UTILISATEUR: 'Utilisateur',
};

export const DIPLOMA_LABELS: Record<string, string> = {
  DEC: "Diplôme d'Expertise Comptable Français (DEC)",
  DECOFI: 'Diplôme d\'Expertise Comptable Régional (DECOFI)',
  DSCOGEF: 'DSCOGEF',
  MASTER_2: 'Master 2',
  MASTER_1: 'Master 1',
  LICENCE: 'Licence',
  DUT: 'DUT',
  DTS: 'DTS',
  BAC: 'BAC',
  BEPC: 'BEPC',
  CISA: 'CISA',
  CFA: 'CFA',
  AUTRES: 'Autres',
};

export const DOMAINE_LABELS: Record<string, string> = {
  INFORMATIQUE: 'Informatique',
  MARKETING: 'Marketing',
  COMMUNICATION: 'Communication',
  RH: 'Ressources Humaines',
  EGEO: 'EGEO',
  ANALYSE_FINANCIERE: 'Analyse Financière',
  FINANCE_COMPTABILITE: 'Finance Comptabilité',
  EXPERTISE_COMPTABLE: 'Expertise Comptable',
  AUDIT_CONTROLE: 'Audit et Contrôle de Gestion',
  CCA: 'Comptabilité Contrôle Audit',
  AUTRES: 'Autres',
};
