import { describe, it, expect } from 'vitest';
import {
  ROLE_LABELS,
  SERVICE_LINE_LABELS,
  GRADE_LABELS,
  CONTRACT_LABELS,
  FUNCTION_LABELS,
  DIPLOMA_LABELS,
  MARITAL_STATUS_LABELS,
  LEAVE_STATUS_LABELS,
  ABSENCE_SUBTYPE_LABELS,
  SUBMISSION_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  DOMAINE_LABELS,
} from '../types';

describe('Labels de types', () => {
  it('ROLE_LABELS couvre tous les rôles', () => {
    expect(ROLE_LABELS['DRH']).toBe('DRH');
    expect(ROLE_LABELS['DIRECTION_GENERALE']).toBe('Direction Générale');
    expect(ROLE_LABELS['ASSOCIE']).toBe('Associé');
    expect(ROLE_LABELS['MANAGER']).toBe('Manager');
    expect(ROLE_LABELS['UTILISATEUR']).toBe('Utilisateur');
    expect(Object.keys(ROLE_LABELS)).toHaveLength(5);
  });

  it('SERVICE_LINE_LABELS couvre toutes les lignes de service', () => {
    expect(SERVICE_LINE_LABELS['AUDIT_ASSURANCE']).toBe('Audit & Assurance');
    expect(SERVICE_LINE_LABELS['CONSULTING_FA']).toBe('Consulting & FA');
    expect(SERVICE_LINE_LABELS['OUTSOURCING']).toBe('Outsourcing');
    expect(SERVICE_LINE_LABELS['ADMINISTRATION']).toBe('Administration');
    expect(SERVICE_LINE_LABELS['JURIDIQUE_FISCALITE']).toBe('Juridique & Fiscalité');
  });

  it('GRADE_LABELS couvre tous les grades (15 grades)', () => {
    expect(Object.keys(GRADE_LABELS)).toHaveLength(15);
    expect(GRADE_LABELS['ASSISTANT_DEBUTANT']).toBe('Assistant Débutant');
    expect(GRADE_LABELS['SENIOR_3']).toBe('Senior 3');
    expect(GRADE_LABELS['DIRECTEUR']).toBe('Directeur');
  });

  it('CONTRACT_LABELS couvre tous les types de contrat', () => {
    expect(CONTRACT_LABELS['CDI']).toBe('CDI');
    expect(CONTRACT_LABELS['CDD']).toBe('CDD');
    expect(CONTRACT_LABELS['STAGE']).toBe('Stage');
    expect(CONTRACT_LABELS['CONSULTANT']).toBe('Consultant (Prestation)');
    expect(CONTRACT_LABELS['FREELANCE']).toBe('Freelance (Mission)');
  });

  it('FUNCTION_LABELS couvre toutes les fonctions', () => {
    expect(FUNCTION_LABELS['AUDITEUR']).toBe('Auditeur');
    expect(FUNCTION_LABELS['CHAUFFEUR']).toBe('Chauffeur');
    expect(Object.keys(FUNCTION_LABELS)).toHaveLength(9);
  });

  it('LEAVE_STATUS_LABELS couvre tous les statuts de congé', () => {
    expect(LEAVE_STATUS_LABELS['EN_ATTENTE']).toBe('En attente');
    expect(LEAVE_STATUS_LABELS['APPROUVE']).toBe('Approuvé');
    expect(LEAVE_STATUS_LABELS['REFUSE']).toBe('Refusé');
  });

  it('ABSENCE_SUBTYPE_LABELS couvre tous les sous-types d\'absence', () => {
    expect(ABSENCE_SUBTYPE_LABELS['MALADIE']).toBe('Maladie');
    expect(ABSENCE_SUBTYPE_LABELS['DECES_FAMILLE']).toBe('Décès famille');
    expect(ABSENCE_SUBTYPE_LABELS['URGENCE']).toBe('Urgence');
    expect(ABSENCE_SUBTYPE_LABELS['AUTRE']).toBe('Autre');
  });

  it('DIPLOMA_LABELS couvre les principaux diplômes', () => {
    expect(DIPLOMA_LABELS['DEC']).toContain('Diplôme');
    expect(DIPLOMA_LABELS['CFA']).toBe('CFA');
    expect(DIPLOMA_LABELS['MASTER_2']).toBe('Master 2');
  });

  it('MARITAL_STATUS_LABELS couvre tous les statuts matrimoniaux', () => {
    expect(MARITAL_STATUS_LABELS['CELIBATAIRE']).toBe('Célibataire');
    expect(MARITAL_STATUS_LABELS['MARIE']).toBe('Marié(e)');
    expect(MARITAL_STATUS_LABELS['DIVORCE']).toBe('Divorcé(e)');
    expect(MARITAL_STATUS_LABELS['VEUF']).toBe('Veuf / Veuve');
  });

  it('SUBMISSION_TYPE_LABELS couvre les types de soumission commerciale', () => {
    expect(SUBMISSION_TYPE_LABELS['AMI']).toContain('Manifestation');
    expect(SUBMISSION_TYPE_LABELS['APPEL_OFFRE']).toBe("Appel d'offre");
  });

  it('SUBMISSION_STATUS_LABELS couvre les statuts commerciaux', () => {
    expect(SUBMISSION_STATUS_LABELS['EN_COURS']).toBe('En cours');
    expect(SUBMISSION_STATUS_LABELS['GAGNE']).toBe('Gagné');
    expect(SUBMISSION_STATUS_LABELS['PERDU']).toBe('Perdu');
  });

  it('DOMAINE_LABELS couvre les domaines de diplôme', () => {
    expect(DOMAINE_LABELS['INFORMATIQUE']).toBe('Informatique');
    expect(DOMAINE_LABELS['EXPERTISE_COMPTABLE']).toBe('Expertise Comptable');
  });
});
