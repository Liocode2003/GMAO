-- ================================================================
-- Migration 021 : Mise à jour employés – Reporting RH Mai 2026
-- Source : Reporting_RH_ForvisMazars_BF_Mai2026_FINAL.xlsx
-- Date   : 2026-05-24
-- ================================================================
-- Changements :
--   1. Dates de naissance réelles (toutes étaient '1990-01-01')
--   2. Dates d'entrée corrigées
--   3. FM-034 OUEDRAOGO Soumaila → INACTIF (absent du reporting officiel)
--   4. 7 employés sortants insérés avec status INACTIF + exit_date + departure_reason
-- ================================================================

BEGIN;

-- ============================================================
-- 1. PERMANENTS – Mise à jour birth_date + entry_date réelles
-- ============================================================

UPDATE employees SET birth_date = '1985-01-17', entry_date = '2022-05-01'  WHERE matricule = 'FM-001'; -- BAMBARA
UPDATE employees SET birth_date = '1998-09-01', entry_date = '2020-01-10'  WHERE matricule = 'FM-002'; -- BANCE
UPDATE employees SET birth_date = '2000-03-13', entry_date = '2025-03-17'  WHERE matricule = 'FM-003'; -- BANSSE
UPDATE employees SET birth_date = '1988-12-31', entry_date = '2025-01-10'  WHERE matricule = 'FM-004'; -- BAYALA
UPDATE employees SET birth_date = '1985-04-18', entry_date = '2022-03-01'  WHERE matricule = 'FM-005'; -- BELEM Kalifa
UPDATE employees SET birth_date = '1967-12-12', entry_date = '2009-03-13'  WHERE matricule = 'FM-006'; -- BOURGOU
UPDATE employees SET birth_date = '1989-05-14', entry_date = '2021-03-22'  WHERE matricule = 'FM-007'; -- COMPAORE
UPDATE employees SET birth_date = '1984-08-24', entry_date = '2011-10-01'  WHERE matricule = 'FM-008'; -- DARGA
UPDATE employees SET birth_date = '1992-01-13', entry_date = '2025-01-12'  WHERE matricule = 'FM-009'; -- DIARRA BREHIMA
UPDATE employees SET birth_date = '1998-09-16', entry_date = '2025-03-11'  WHERE matricule = 'FM-010'; -- DIBGOLONGO
UPDATE employees SET birth_date = '1997-12-31', entry_date = '2026-04-01'  WHERE matricule = 'FM-011'; -- DIPAMA
UPDATE employees SET birth_date = '1992-02-26', entry_date = '2025-08-11'  WHERE matricule = 'FM-012'; -- GUINDO
UPDATE employees SET birth_date = '1996-05-07', entry_date = '2023-05-02'  WHERE matricule = 'FM-013'; -- KABORE
UPDATE employees SET birth_date = '1981-07-13', entry_date = '2019-06-01'  WHERE matricule = 'FM-014'; -- KABRE
UPDATE employees SET birth_date = '1998-06-23', entry_date = '2020-06-15'  WHERE matricule = 'FM-015'; -- KADIO
UPDATE employees SET birth_date = '1996-02-14', entry_date = '2021-01-02'  WHERE matricule = 'FM-016'; -- KAM
UPDATE employees SET birth_date = '1989-10-22', entry_date = '2021-02-15'  WHERE matricule = 'FM-017'; -- KARA/KOURAOGO
UPDATE employees SET birth_date = '1988-02-07', entry_date = '2016-11-01'  WHERE matricule = 'FM-018'; -- KINDA
UPDATE employees SET birth_date = '1998-01-01', entry_date = '2022-10-10'  WHERE matricule = 'FM-019'; -- KONATE
UPDATE employees SET birth_date = '1993-12-19', entry_date = '2018-02-05'  WHERE matricule = 'FM-020'; -- KONDOMBO
UPDATE employees SET birth_date = '2001-07-30', entry_date = '2025-05-03'  WHERE matricule = 'FM-021'; -- KONE
UPDATE employees SET birth_date = '1987-03-29', entry_date = '2024-09-01'  WHERE matricule = 'FM-022'; -- KOUDOUGOU
UPDATE employees SET birth_date = '1979-06-04', entry_date = '2009-12-15'  WHERE matricule = 'FM-023'; -- MAÏGA/ILBOUDO
UPDATE employees SET birth_date = '1996-01-10', entry_date = '2026-02-23'  WHERE matricule = 'FM-024'; -- NGOUEMBE NGALA
UPDATE employees SET birth_date = '1990-12-01', entry_date = '2017-07-11'  WHERE matricule = 'FM-025'; -- NIKIEMA Gaël
UPDATE employees SET birth_date = '1997-04-22', entry_date = '2022-02-14'  WHERE matricule = 'FM-026'; -- NIKIEMA Mouna
UPDATE employees SET birth_date = '1972-08-28', entry_date = '2016-11-02'  WHERE matricule = 'FM-027'; -- OUEDRAOGO Amidou
UPDATE employees SET birth_date = '1991-06-29', entry_date = '2014-02-06'  WHERE matricule = 'FM-028'; -- OUEDRAOGO Assami
UPDATE employees SET birth_date = '1999-10-01', entry_date = '2022-03-05'  WHERE matricule = 'FM-029'; -- OUEDRAOGO Azèra
UPDATE employees SET birth_date = '1995-09-26', entry_date = '2022-02-11'  WHERE matricule = 'FM-030'; -- ILBOUDO/OUEDRAOGO
UPDATE employees SET birth_date = '1972-04-25', entry_date = '2009-04-09'  WHERE matricule = 'FM-031'; -- OUEDRAOGO Hamadé
UPDATE employees SET birth_date = '1994-06-28', entry_date = '2023-04-17'  WHERE matricule = 'FM-032'; -- OUEDRAOGO Neimata
UPDATE employees SET birth_date = '1980-07-08', entry_date = '2017-05-04'  WHERE matricule = 'FM-033'; -- OUEDRAOGO O. Mamounata

-- FM-034 OUEDRAOGO Soumaila : absent du reporting officiel Mai 2026
UPDATE employees SET
  status        = 'INACTIF'::"employee_status",
  exit_date     = '2025-05-31'
WHERE matricule = 'FM-034';

UPDATE employees SET birth_date = '1995-12-08', entry_date = '2023-10-02'  WHERE matricule = 'FM-035'; -- OUEDRAOGO Stéphanie
UPDATE employees SET birth_date = '1998-12-31', entry_date = '2024-08-15'  WHERE matricule = 'FM-036'; -- PORGO
UPDATE employees SET birth_date = '1976-03-25', entry_date = '2022-10-17'  WHERE matricule = 'FM-037'; -- SAWADOGO SOME
UPDATE employees SET birth_date = '2000-06-20', entry_date = '2025-10-13'  WHERE matricule = 'FM-038'; -- SERME
UPDATE employees SET birth_date = '1991-08-08', entry_date = '2014-01-10'  WHERE matricule = 'FM-039'; -- SOUNTOURA/SOMA
UPDATE employees SET birth_date = '1995-04-18', entry_date = '2023-12-01'  WHERE matricule = 'FM-040'; -- TAPSOBA Issa
UPDATE employees SET
  birth_date  = '1999-04-07',
  entry_date  = '2022-07-11',
  grade       = 'ASSISTANT_CONFIRME'::"grade"   -- Assistant comptable
WHERE matricule = 'FM-041'; -- TAPSOBA/BELEM
UPDATE employees SET birth_date = '1990-01-01', entry_date = '2017-04-01'  WHERE matricule = 'FM-042'; -- TIEMTORE
UPDATE employees SET birth_date = '1996-12-31', entry_date = '2023-12-18'  WHERE matricule = 'FM-043'; -- TRAORE T. Salif
UPDATE employees SET birth_date = '1986-07-25', entry_date = '2014-01-01'  WHERE matricule = 'FM-044'; -- YONABA/NAMSENEI
UPDATE employees SET birth_date = '1979-12-12', entry_date = '2015-10-15'  WHERE matricule = 'FM-045'; -- ZOUNGRANA

-- ============================================================
-- 2. CONSULTANTS – Mise à jour birth_date + entry_date
-- ============================================================

UPDATE employees SET birth_date = '1996-09-16', entry_date = '2024-03-12'  WHERE matricule = 'CONS-001'; -- KORBEOGO
UPDATE employees SET birth_date = '2002-11-30', entry_date = '2025-04-14'  WHERE matricule = 'CONS-002'; -- SAWADOGO Andréa
UPDATE employees SET birth_date = '1992-12-23', entry_date = '2020-03-18'  WHERE matricule = 'CONS-003'; -- ILBOUDO/TRAORE
UPDATE employees SET birth_date = '2001-07-14', entry_date = '2026-01-01'  WHERE matricule = 'CONS-004'; -- SANOGO Aziz
UPDATE employees SET birth_date = '2001-11-11', entry_date = '2026-07-12'  WHERE matricule = 'CONS-005'; -- SAWADOGO Bénéwendé

-- ============================================================
-- 3. INSERTION DES EMPLOYÉS SORTANTS (INACTIFS)
--    Présents dans le reporting mais absents du seed initial
-- ============================================================

INSERT INTO employees (
  id, matricule, first_name, last_name, gender, email,
  grade, service_line, function, contract_type,
  entry_date, birth_date, status, exit_date, departure_reason,
  leave_balance, created_at, updated_at
) VALUES

  -- BELEM Djibril : Consulting FA, Sénior 1 – départ 17/03/2025 (autres)
  (
    'a1000001-0000-0000-0000-000000000001',
    'FM-EX-001', 'Djibril', 'BELEM', 'M'::"gender",
    'djibril.belem@forvismazars.com',
    'SENIOR_1'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2024-03-01', '1988-03-18',
    'INACTIF'::"employee_status", '2025-03-17', 'AUTRES',
    0, NOW(), NOW()
  ),

  -- DIALLO/BALDE Aïssetou : Audit, Sénior 1 – départ 30/06/2025 (raisons personnelles)
  (
    'a1000002-0000-0000-0000-000000000002',
    'FM-EX-002', 'Aïssetou', 'DIALLO/BALDE', 'F'::"gender",
    'aissetou.diallobile@forvismazars.com',
    'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2024-03-11', '1989-10-14',
    'INACTIF'::"employee_status", '2025-06-30', 'RAISONS_PERSONNELLES',
    0, NOW(), NOW()
  ),

  -- DOUAMBA/NANA Fatimata : Audit, Asst débutant – départ 01/11/2025 (fin de contrat)
  (
    'a1000003-0000-0000-0000-000000000003',
    'FM-EX-003', 'Fatimata', 'DOUAMBA/NANA', 'F'::"gender",
    'fatimata.douambanana@forvismazars.com',
    'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2023-11-01', '1995-06-04',
    'INACTIF'::"employee_status", '2025-11-01', 'AUTRES',
    0, NOW(), NOW()
  ),

  -- SOME Romaric : Tax & Legal, Asst Manager – départ 30/01/2026 (nouvelles opportunités)
  (
    'a1000004-0000-0000-0000-000000000004',
    'FM-EX-004', 'Romaric', 'SOME', 'M'::"gender",
    'romaric.some@forvismazars.com',
    'ASSISTANT_MANAGER_1'::"grade", 'JURIDIQUE_FISCALITE'::"service_line", 'JURISTE_FISCALISTE'::"employee_function",
    'CDI'::"contract_type", '2022-12-05', '1985-12-31',
    'INACTIF'::"employee_status", '2026-01-30', 'NOUVELLES_OPPORTUNITES',
    0, NOW(), NOW()
  ),

  -- OUEDRAOGO Soufiane : Audit, Sénior 1 – départ 31/01/2026 (nouvelles opportunités)
  (
    'a1000005-0000-0000-0000-000000000005',
    'FM-EX-005', 'Soufiane', 'OUEDRAOGO', 'M'::"gender",
    'soufiane.ouedraogo@forvismazars.com',
    'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2024-08-31', '1997-06-13',
    'INACTIF'::"employee_status", '2026-01-31', 'NOUVELLES_OPPORTUNITES',
    0, NOW(), NOW()
  ),

  -- ZONGO Rasmané : Audit, Sénior 2 – départ 31/07/2025 (nouvelles opportunités)
  (
    'a1000006-0000-0000-0000-000000000006',
    'FM-EX-006', 'Rasmané', 'ZONGO', 'M'::"gender",
    'rasmane.zongo@forvismazars.com',
    'SENIOR_2'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2018-02-01', '1991-01-01',
    'INACTIF'::"employee_status", '2025-07-31', 'NOUVELLES_OPPORTUNITES',
    0, NOW(), NOW()
  ),

  -- TRAORE Nafissatou Lore Liliane : Outsourcing, Asst confirmé – départ 02/01/2025
  -- (Revenue comme consultante sous CONS-003 ILBOUDO/TRAORE)
  (
    'a1000007-0000-0000-0000-000000000007',
    'FM-EX-007', 'Nafissatou Lore Liliane', 'TRAORE', 'F'::"gender",
    'nafissatoulore.traore@forvismazars.com',
    'ASSISTANT_CONFIRME'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function",
    'CDI'::"contract_type", '2020-03-18', '1992-12-23',
    'INACTIF'::"employee_status", '2025-01-02', 'NOUVELLES_OPPORTUNITES',
    0, NOW(), NOW()
  );

-- ============================================================
-- 4. VÉRIFICATION
-- ============================================================

SELECT status, COUNT(*) AS nb FROM employees GROUP BY status ORDER BY status;
SELECT COUNT(*) AS total FROM employees;
SELECT COUNT(*) AS sortants FROM employees WHERE exit_date IS NOT NULL;

COMMIT;
