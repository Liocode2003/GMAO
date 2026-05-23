-- ============================================================
-- SEED COMPLET — FORVIS MAZARS BURKINA FASO
-- Données réalistes pour toutes les tables
-- Prérequis : real_employees.sql déjà appliqué (50 employés présents)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. MISE À JOUR EMPLOYÉS — birth_date, téléphone, salaire
-- ============================================================
UPDATE employees SET birth_date='1988-04-12', phone='+226 70 12 34 01', salary=1250000 WHERE matricule='FM-001';
UPDATE employees SET birth_date='1992-07-18', phone='+226 65 23 45 02', salary=920000  WHERE matricule='FM-002';
UPDATE employees SET birth_date='1992-11-05', phone='+226 07 34 56 03', salary=600000  WHERE matricule='FM-003';
UPDATE employees SET birth_date='1982-03-25', phone='+226 70 45 67 04', salary=2200000 WHERE matricule='FM-004';
UPDATE employees SET birth_date='1985-09-14', phone='+226 76 56 78 05', salary=1500000 WHERE matricule='FM-005';
UPDATE employees SET birth_date='1998-02-20', phone='+226 65 67 89 06', salary=280000  WHERE matricule='FM-006';
UPDATE employees SET birth_date='1994-06-08', phone='+226 07 78 90 07', salary=730000  WHERE matricule='FM-007';
UPDATE employees SET birth_date='1983-12-03', phone='+226 70 89 01 08', salary=1850000 WHERE matricule='FM-008';
UPDATE employees SET birth_date='1990-05-17', phone='+226 65 90 12 09', salary=1200000 WHERE matricule='FM-009';
UPDATE employees SET birth_date='1995-08-22', phone='+226 07 01 23 10', salary=710000  WHERE matricule='FM-010';
UPDATE employees SET birth_date='1994-01-30', phone='+226 70 12 34 11', salary=580000  WHERE matricule='FM-011';
UPDATE employees SET birth_date='1993-04-11', phone='+226 76 23 45 12', salary=560000  WHERE matricule='FM-012';
UPDATE employees SET birth_date='1993-11-19', phone='+226 65 34 56 13', salary=700000  WHERE matricule='FM-013';
UPDATE employees SET birth_date='1999-07-05', phone='+226 07 45 67 14', salary=260000  WHERE matricule='FM-014';
UPDATE employees SET birth_date='1991-03-28', phone='+226 70 56 78 15', salary=940000  WHERE matricule='FM-015';
UPDATE employees SET birth_date='1989-10-14', phone='+226 65 67 89 16', salary=1180000 WHERE matricule='FM-016';
UPDATE employees SET birth_date='1989-02-07', phone='+226 07 78 90 17', salary=1210000 WHERE matricule='FM-017';
UPDATE employees SET birth_date='1978-08-30', phone='+226 70 89 01 18', salary=4500000 WHERE matricule='FM-018';
UPDATE employees SET birth_date='2000-05-23', phone='+226 76 90 12 19', salary=320000  WHERE matricule='FM-019';
UPDATE employees SET birth_date='1986-11-15', phone='+226 65 01 23 20', salary=1230000 WHERE matricule='FM-020';
UPDATE employees SET birth_date='2001-09-04', phone='+226 07 12 34 21', salary=300000  WHERE matricule='FM-021';
UPDATE employees SET birth_date='1994-04-26', phone='+226 70 23 45 22', salary=690000  WHERE matricule='FM-022';
UPDATE employees SET birth_date='1982-07-09', phone='+226 65 34 56 23', salary=1780000 WHERE matricule='FM-023';
UPDATE employees SET birth_date='1993-06-18', phone='+226 07 45 67 24', salary=550000  WHERE matricule='FM-024';
UPDATE employees SET birth_date='1994-12-31', phone='+226 70 56 78 25', salary=270000  WHERE matricule='FM-025';
UPDATE employees SET birth_date='1994-09-03', phone='+226 76 67 89 26', salary=720000  WHERE matricule='FM-026';
UPDATE employees SET birth_date='1975-05-11', phone='+226 65 78 90 27', salary=5200000 WHERE matricule='FM-027';
UPDATE employees SET birth_date='1985-01-19', phone='+226 07 89 01 28', salary=1250000 WHERE matricule='FM-028';
UPDATE employees SET birth_date='1997-08-14', phone='+226 70 90 12 29', salary=460000  WHERE matricule='FM-029';
UPDATE employees SET birth_date='1994-12-05', phone='+226 65 01 23 30', salary=700000  WHERE matricule='FM-030';
UPDATE employees SET birth_date='1977-03-22', phone='+226 07 12 34 31', salary=4800000 WHERE matricule='FM-031';
UPDATE employees SET birth_date='1992-10-17', phone='+226 70 23 45 32', salary=910000  WHERE matricule='FM-032';
UPDATE employees SET birth_date='1988-06-28', phone='+226 76 34 56 33', salary=1270000 WHERE matricule='FM-033';
UPDATE employees SET birth_date='1979-09-07', phone='+226 65 45 67 34', salary=4200000 WHERE matricule='FM-034';
UPDATE employees SET birth_date='2001-03-16', phone='+226 07 56 78 35', salary=285000  WHERE matricule='FM-035';
UPDATE employees SET birth_date='1993-07-31', phone='+226 70 67 89 36', salary=695000  WHERE matricule='FM-036';
UPDATE employees SET birth_date='1980-04-02', phone='+226 65 78 90 37', salary=3200000 WHERE matricule='FM-037';
UPDATE employees SET birth_date='2002-01-08', phone='+226 07 89 01 38', salary=275000  WHERE matricule='FM-038';
UPDATE employees SET birth_date='1985-11-25', phone='+226 70 90 12 39', salary=1220000 WHERE matricule='FM-039';
UPDATE employees SET birth_date='2000-08-19', phone='+226 76 01 23 40', salary=265000  WHERE matricule='FM-040';
UPDATE employees SET birth_date='1999-04-13', phone='+226 65 12 34 41', salary=280000  WHERE matricule='FM-041';
UPDATE employees SET birth_date='1993-10-06', phone='+226 07 23 45 42', salary=470000  WHERE matricule='FM-042';
UPDATE employees SET birth_date='1994-02-14', phone='+226 70 34 56 43', salary=715000  WHERE matricule='FM-043';
UPDATE employees SET birth_date='1984-05-27', phone='+226 65 45 67 44', salary=1820000 WHERE matricule='FM-044';
UPDATE employees SET birth_date='1986-08-10', phone='+226 07 56 78 45', salary=1490000 WHERE matricule='FM-045';
UPDATE employees SET birth_date='1990-07-22', phone='+226 70 67 89 46', salary=590000  WHERE matricule='CONS-001';
UPDATE employees SET birth_date='1994-03-15', phone='+226 76 78 90 47', salary=560000  WHERE matricule='CONS-002';
UPDATE employees SET birth_date='1988-11-28', phone='+226 65 89 01 48', salary=620000  WHERE matricule='CONS-003';
UPDATE employees SET birth_date='1991-05-03', phone='+226 07 90 12 49', salary=575000  WHERE matricule='CONS-004';
UPDATE employees SET birth_date='1993-09-18', phone='+226 70 01 23 50', salary=555000  WHERE matricule='CONS-005';

-- ============================================================
-- 2. HIÉRARCHIE — manager_id pour l'organigramme
-- ============================================================
-- Associés FM-018 (Audit), FM-027 (Consulting), FM-031 (Audit), FM-034 (Admin) → racine

-- FM-037 (Directeur Admin) rapporte à FM-034
UPDATE employees SET manager_id='0232c465-e837-40d1-9261-fb17e803d031' WHERE matricule='FM-037';
-- FM-004 BAYALA (SM Consulting) rapporte à FM-027
UPDATE employees SET manager_id='50b657a8-e27f-482e-84b2-1b4abbd57c84' WHERE matricule='FM-004';
-- FM-008 DARGA (AM3 Audit) rapporte à FM-031
UPDATE employees SET manager_id='0ce23c14-8a91-4f02-8a69-ea409b66d204' WHERE matricule='FM-008';
-- FM-023 MAÏGA (AM3 Audit) rapporte à FM-018
UPDATE employees SET manager_id='b1ebd671-cefe-409c-b60f-58ff69a4c541' WHERE matricule='FM-023';
-- FM-044 YONABA (AM3 Audit) rapporte à FM-018
UPDATE employees SET manager_id='b1ebd671-cefe-409c-b60f-58ff69a4c541' WHERE matricule='FM-044';
-- FM-039 SOUNTOURA AM1 Audit rapporte à FM-044
UPDATE employees SET manager_id='da82c866-5f8f-45e4-8844-9367fee20e17' WHERE matricule='FM-039';
-- FM-028 OUEDRAOGO Assami AM1 Audit rapporte à FM-023
UPDATE employees SET manager_id='db254baf-ffb8-43e5-938b-fa9059788856' WHERE matricule='FM-028';
-- FM-033 OUEDRAOGO Mamounata AM1 Outsourcing rapporte à FM-027
UPDATE employees SET manager_id='50b657a8-e27f-482e-84b2-1b4abbd57c84' WHERE matricule='FM-033';

-- Équipe Audit sous FM-008 DARGA
UPDATE employees SET manager_id='fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'
WHERE matricule IN ('FM-001','FM-002','FM-015','FM-016','FM-017','FM-026');
-- Équipe Audit sous FM-023 MAÏGA
UPDATE employees SET manager_id='db254baf-ffb8-43e5-938b-fa9059788856'
WHERE matricule IN ('FM-009','FM-010','FM-030','FM-032','FM-036','FM-043');
-- Équipe Audit sous FM-044 YONABA
UPDATE employees SET manager_id='da82c866-5f8f-45e4-8844-9367fee20e17'
WHERE matricule IN ('FM-019','FM-021','FM-035','FM-038','CONS-001','CONS-004','CONS-005');
-- Équipe Consulting sous FM-004 BAYALA
UPDATE employees SET manager_id='b981af9a-63ce-4814-990a-f6079a30f2aa'
WHERE matricule IN ('FM-003','FM-005','FM-011','FM-012','FM-013','FM-022','FM-024');
-- Équipe Outsourcing sous FM-033
UPDATE employees SET manager_id='1450c3e0-5682-4c3d-83c4-4b4a13f29366'
WHERE matricule IN ('FM-029','FM-040','FM-042','CONS-002','CONS-003');
-- Équipe Admin sous FM-037 SAWADOGO SOME
UPDATE employees SET manager_id='3c49813b-a779-44a2-ae33-dc587ac2a01f'
WHERE matricule IN ('FM-006','FM-014','FM-020','FM-025','FM-041','FM-045');
-- FM-007 Juridique/Fiscalité sous FM-034
UPDATE employees SET manager_id='0232c465-e837-40d1-9261-fb17e803d031' WHERE matricule='FM-007';

-- ============================================================
-- 3. CONTRATS À RENOUVELER — quelques CDD/STAGE proches de l'échéance
-- ============================================================
UPDATE employees SET contract_type='CDD', exit_date=CURRENT_DATE + INTERVAL '8 days'  WHERE matricule='FM-019';
UPDATE employees SET contract_type='CDD', exit_date=CURRENT_DATE + INTERVAL '14 days' WHERE matricule='FM-021';
UPDATE employees SET contract_type='CDD', exit_date=CURRENT_DATE + INTERVAL '22 days' WHERE matricule='FM-035';
UPDATE employees SET contract_type='STAGE', exit_date=CURRENT_DATE + INTERVAL '5 days'  WHERE matricule='FM-038';

-- ============================================================
-- 4. SOLDES DE CONGÉS 2025 & 2026
-- ============================================================
INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken)
SELECT id, 2025, 30,
  CASE WHEN grade::text IN ('ASSOCIE','DIRECTEUR','SENIOR_MANAGER_1') THEN 5 ELSE 2 END,
  ROUND((RANDOM()*14 + 5)::numeric, 0)
FROM employees
ON CONFLICT (employee_id, year) DO NOTHING;

INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken)
SELECT id, 2026, 30,
  CASE WHEN grade::text IN ('ASSOCIE','DIRECTEUR','SENIOR_MANAGER_1') THEN 3 ELSE 0 END,
  ROUND((RANDOM()*8)::numeric, 0)
FROM employees
ON CONFLICT (employee_id, year) DO NOTHING;

-- ============================================================
-- 5. CONGÉS — approuvés (2025), en attente (2026), refusés
-- ============================================================

-- Congés approuvés 2025
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, approved_by, approved_at, created_by)
VALUES
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600','PLANIFIE','2025-07-14','2025-07-25',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('f5d8a290-3197-4c29-a3ee-b8a8618f3bb2','PLANIFIE','2025-08-04','2025-08-15',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('8ac6a425-564e-421b-803d-0ec8eff6d4f1','PLANIFIE','2025-12-22','2025-12-31', 8,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','PLANIFIE','2025-07-28','2025-08-08',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('0a319971-1084-4029-812f-8c25bacced55','PLANIFIE','2025-08-18','2025-08-29',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('b1ebd671-cefe-409c-b60f-58ff69a4c541','PLANIFIE','2025-09-01','2025-09-12',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('50b657a8-e27f-482e-84b2-1b4abbd57c84','PLANIFIE','2025-10-13','2025-10-24',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('0ce23c14-8a91-4f02-8a69-ea409b66d204','PLANIFIE','2025-12-15','2025-12-24', 8,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('db254baf-ffb8-43e5-938b-fa9059788856','PLANIFIE','2025-07-07','2025-07-18',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('3c49813b-a779-44a2-ae33-dc587ac2a01f','PLANIFIE','2025-08-11','2025-08-22',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('9458ca32-a723-4faa-ab58-bfc14fb7f4c0','PLANIFIE','2025-07-21','2025-08-01',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('42d953ac-bdd2-426c-885b-9a9bf5257746','PLANIFIE','2025-09-15','2025-09-26',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('0232c465-e837-40d1-9261-fb17e803d031','PLANIFIE','2025-08-25','2025-09-05',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('a3454457-bc1f-4be4-9153-369ca3949772','PLANIFIE','2025-07-14','2025-07-18', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('fec5f2fd-fff6-4890-b6dc-92602c29289b','IMPREVU','2025-03-10','2025-03-12', 3,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('88dc1fba-50a7-4707-926d-69871cb44665','IMPREVU','2025-05-05','2025-05-06', 2,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('250bd9bf-80ca-485e-a417-8782805779d2','PLANIFIE','2025-12-22','2025-12-31', 8,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('e486d0de-c936-4040-8a91-cd995928bbbe','PLANIFIE','2025-08-04','2025-08-08', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('1450c3e0-5682-4c3d-83c4-4b4a13f29366','PLANIFIE','2025-09-22','2025-10-03',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ('83e730ca-4b1c-42f6-b43c-08130dadde67','PLANIFIE','2025-12-22','2025-12-26', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001');

-- Congés refusés 2025
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, notes, created_by)
VALUES
  ('f74b6dc7-ddff-49ba-aeba-087c9c6ac161','PLANIFIE','2025-04-14','2025-04-18', 5,2025,'REFUSE','Chevauchement avec mission client','a0000001-0000-0000-0000-000000000001'),
  ('cac390bd-db49-4cdb-89ca-7d5174178e0b','PLANIFIE','2025-05-19','2025-05-23', 5,2025,'REFUSE','Période de clôture','a0000001-0000-0000-0000-000000000001');

-- Congés EN ATTENTE 2026 — affichés dans le widget notifications
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, notes, created_by)
VALUES
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600','PLANIFIE','2026-06-15','2026-06-26',10,2026,'EN_ATTENTE','Congés annuels','a0000001-0000-0000-0000-000000000001'),
  ('f5d8a290-3197-4c29-a3ee-b8a8618f3bb2','PLANIFIE','2026-07-06','2026-07-17',10,2026,'EN_ATTENTE','Vacances familiales','a0000001-0000-0000-0000-000000000001'),
  ('db254baf-ffb8-43e5-938b-fa9059788856','PLANIFIE','2026-06-01','2026-06-05', 5,2026,'EN_ATTENTE','Repos','a0000001-0000-0000-0000-000000000001'),
  ('1450c3e0-5682-4c3d-83c4-4b4a13f29366','PLANIFIE','2026-06-22','2026-07-03',10,2026,'EN_ATTENTE','Congés annuels','a0000001-0000-0000-0000-000000000001'),
  ('88dc1fba-50a7-4707-926d-69871cb44665','IMPREVU','2026-05-26','2026-05-27', 2,2026,'EN_ATTENTE','Rendez-vous médical','a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 6. HISTORIQUE SALAIRES — entrée initiale pour chaque employé
-- ============================================================
INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes, created_by)
SELECT id, NULL, salary, entry_date, 'Salaire initial', 'a0000001-0000-0000-0000-000000000001'
FROM employees WHERE salary IS NOT NULL;

-- Quelques augmentations 2024-2025
INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes, created_by)
VALUES
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600',1150000,1250000,'2024-01-01','Promotion AM1 → AM2','a0000001-0000-0000-0000-000000000001'),
  ('fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8',1700000,1850000,'2024-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('db254baf-ffb8-43e5-938b-fa9059788856',1650000,1780000,'2024-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('0a319971-1084-4029-812f-8c25bacced55',870000, 940000, '2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('d9fcdb37-287d-4aa4-a837-152334c4c3ab',1100000,1180000,'2025-01-01','Promotion S2 → S3','a0000001-0000-0000-0000-000000000001'),
  ('9458ca32-a723-4faa-ab58-bfc14fb7f4c0',1150000,1230000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('3c49813b-a779-44a2-ae33-dc587ac2a01f',3000000,3200000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('50b657a8-e27f-482e-84b2-1b4abbd57c84',5000000,5200000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('b1ebd671-cefe-409c-b60f-58ff69a4c541',4300000,4500000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('0232c465-e837-40d1-9261-fb17e803d031',4000000,4200000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001'),
  ('0ce23c14-8a91-4f02-8a69-ea409b66d204',4600000,4800000,'2025-01-01','Révision annuelle','a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 7. FORMATIONS 2024-2026
-- ============================================================
INSERT INTO trainings (id, type, title, date, location, duration_hours, trainer, budget, created_by) VALUES
  ('t0000001-0000-0000-0000-000000000001','GROUPE',   'IFRS 16 — Normes de location',                    '2024-02-14','Ouagadougou', 8,  'Formateur Groupe Forvis Mazars',  500000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000002-0000-0000-0000-000000000002','AOC',      'Audit des états financiers — techniques avancées','2024-04-22','Abidjan',    16,  'Cabinet KPMG CI',                1200000, 'a0000001-0000-0000-0000-000000000001'),
  ('t0000003-0000-0000-0000-000000000003','INTERNE',  'Procédures internes Forvis Mazars BF',            '2024-06-10','Ouagadougou', 4,  'Catherine Sawadogo-Somé',        0,       'a0000001-0000-0000-0000-000000000001'),
  ('t0000004-0000-0000-0000-000000000004','INTRA',    'Fiscalité des entreprises BF — mise à jour 2024', '2024-09-09','Ouagadougou', 8,  'Direction Générale des Impôts',   350000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000005-0000-0000-0000-000000000005','GROUPE',   'Lutte anti-blanchiment (LAB/LFT)',                '2024-11-18','Dakar',       8,  'Formateur Compliance Group',      650000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000006-0000-0000-0000-000000000006','INTERNE',  'Soft skills — communication client',              '2025-01-20','Ouagadougou', 4,  'Coach externe',                   200000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000007-0000-0000-0000-000000000007','GROUPE',   'OHADA — Actualités SYSCOHADA révisé',             '2025-03-10','Ouagadougou', 8,  'OHADA Secrétariat Permanent',     400000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000008-0000-0000-0000-000000000008','AOC',      'Leadership & Management pour managers',           '2025-05-05','Lomé',       16,  'HEC Paris Executive Education',  1500000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000009-0000-0000-0000-000000000009','INTERNE',  'Cybersécurité & Protection des données',          '2025-07-14','Ouagadougou', 4,  'Équipe IT Forvis Mazars',         0,       'a0000001-0000-0000-0000-000000000001'),
  ('t0000010-0000-0000-0000-000000000010','INTRA',    'Comptabilité des ONG et projets bailleurs',       '2025-09-08','Ouagadougou', 8,  'Consultant indépendant',          450000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000011-0000-0000-0000-000000000011','GROUPE',   'Transformation digitale & IA en audit',           '2025-11-17','Casablanca',  16, 'Forvis Mazars Global Learning',  1800000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000012-0000-0000-0000-000000000012','INTERNE',  'Onboarding nouveaux collaborateurs 2026',         '2026-01-13','Ouagadougou', 4,  'DRH Forvis Mazars BF',            0,       'a0000001-0000-0000-0000-000000000001'),
  ('t0000013-0000-0000-0000-000000000013','INTRA',    'Excel avancé & Power BI pour auditeurs',          '2026-02-24','Ouagadougou', 8,  'Formateur Microsoft Partner',     380000,  'a0000001-0000-0000-0000-000000000001'),
  ('t0000014-0000-0000-0000-000000000014','AOC',      'Droit des affaires OHADA — Acte uniforme révisé', '2026-04-07','Abidjan',     8,  'Cabinet Juriste UEMOA',            750000,  'a0000001-0000-0000-0000-000000000001');

-- Participants formations
INSERT INTO training_participants (training_id, employee_id) VALUES
-- Formation IFRS 16 (2024)
  ('t0000001-0000-0000-0000-000000000001','eae9d8bf-4b20-4950-a68d-6bf59a75e600'),
  ('t0000001-0000-0000-0000-000000000001','f5d8a290-3197-4c29-a3ee-b8a8618f3bb2'),
  ('t0000001-0000-0000-0000-000000000001','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'),
  ('t0000001-0000-0000-0000-000000000001','db254baf-ffb8-43e5-938b-fa9059788856'),
  ('t0000001-0000-0000-0000-000000000001','0a319971-1084-4029-812f-8c25bacced55'),
  ('t0000001-0000-0000-0000-000000000001','88dc1fba-50a7-4707-926d-69871cb44665'),
  ('t0000001-0000-0000-0000-000000000001','250bd9bf-80ca-485e-a417-8782805779d2'),
-- Formation Audit Avancé AOC (2024)
  ('t0000002-0000-0000-0000-000000000002','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'),
  ('t0000002-0000-0000-0000-000000000002','db254baf-ffb8-43e5-938b-fa9059788856'),
  ('t0000002-0000-0000-0000-000000000002','da82c866-5f8f-45e4-8844-9367fee20e17'),
  ('t0000002-0000-0000-0000-000000000002','a3454457-bc1f-4be4-9153-369ca3949772'),
  ('t0000002-0000-0000-0000-000000000002','42d953ac-bdd2-426c-885b-9a9bf5257746'),
-- Formation Procédures internes (2024)
  ('t0000003-0000-0000-0000-000000000003','f74b6dc7-ddff-49ba-aeba-087c9c6ac161'),
  ('t0000003-0000-0000-0000-000000000003','068a9674-5b27-461c-ab0f-ff4db8f516f4'),
  ('t0000003-0000-0000-0000-000000000003','571c2af2-ddac-415e-b05d-802b6167dea0'),
  ('t0000003-0000-0000-0000-000000000003','b9fbca80-5755-4eac-a865-51b2027ffe6e'),
  ('t0000003-0000-0000-0000-000000000003','5c95b6cf-d0bc-4c06-8961-8e8f29bc5301'),
  ('t0000003-0000-0000-0000-000000000003','f3a214e0-69c3-4dca-8892-a13ec01efc47'),
-- Formation Fiscalité (2024)
  ('t0000004-0000-0000-0000-000000000004','8ac6a425-564e-421b-803d-0ec8eff6d4f1'),
  ('t0000004-0000-0000-0000-000000000004','cac390bd-db49-4cdb-89ca-7d5174178e0b'),
  ('t0000004-0000-0000-0000-000000000004','b981af9a-63ce-4814-990a-f6079a30f2aa'),
  ('t0000004-0000-0000-0000-000000000004','e1f7adc8-ce67-4a0f-8810-9f5e165308df'),
  ('t0000004-0000-0000-0000-000000000004','19239447-8f42-4512-92b1-cde30d8677ab'),
-- Formation LAB/LFT (2024)
  ('t0000005-0000-0000-0000-000000000005','b1ebd671-cefe-409c-b60f-58ff69a4c541'),
  ('t0000005-0000-0000-0000-000000000005','50b657a8-e27f-482e-84b2-1b4abbd57c84'),
  ('t0000005-0000-0000-0000-000000000005','0ce23c14-8a91-4f02-8a69-ea409b66d204'),
  ('t0000005-0000-0000-0000-000000000005','0232c465-e837-40d1-9261-fb17e803d031'),
  ('t0000005-0000-0000-0000-000000000005','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'),
  ('t0000005-0000-0000-0000-000000000005','db254baf-ffb8-43e5-938b-fa9059788856'),
-- Soft skills (2025)
  ('t0000006-0000-0000-0000-000000000006','eae9d8bf-4b20-4950-a68d-6bf59a75e600'),
  ('t0000006-0000-0000-0000-000000000006','0934abd4-7be5-4767-a3c9-134b68890a24'),
  ('t0000006-0000-0000-0000-000000000006','42d953ac-bdd2-426c-885b-9a9bf5257746'),
  ('t0000006-0000-0000-0000-000000000006','a3454457-bc1f-4be4-9153-369ca3949772'),
  ('t0000006-0000-0000-0000-000000000006','1450c3e0-5682-4c3d-83c4-4b4a13f29366'),
-- OHADA (2025)
  ('t0000007-0000-0000-0000-000000000007','8ac6a425-564e-421b-803d-0ec8eff6d4f1'),
  ('t0000007-0000-0000-0000-000000000007','fc122994-8c07-46e8-ab12-7471f35c9665'),
  ('t0000007-0000-0000-0000-000000000007','32fa4a31-2d72-4b17-8877-e1655db1479b'),
  ('t0000007-0000-0000-0000-000000000007','395c75a0-804e-42ef-b80e-d0424078772a'),
  ('t0000007-0000-0000-0000-000000000007','9e082756-8011-4a7b-8bfb-ca74c0ce253f'),
-- Leadership Managers (2025)
  ('t0000008-0000-0000-0000-000000000008','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'),
  ('t0000008-0000-0000-0000-000000000008','db254baf-ffb8-43e5-938b-fa9059788856'),
  ('t0000008-0000-0000-0000-000000000008','da82c866-5f8f-45e4-8844-9367fee20e17'),
  ('t0000008-0000-0000-0000-000000000008','b981af9a-63ce-4814-990a-f6079a30f2aa'),
  ('t0000008-0000-0000-0000-000000000008','3c49813b-a779-44a2-ae33-dc587ac2a01f'),
  ('t0000008-0000-0000-0000-000000000008','1450c3e0-5682-4c3d-83c4-4b4a13f29366'),
-- Cybersécurité (2025)
  ('t0000009-0000-0000-0000-000000000009','d0b17e1a-a266-4eca-9254-c49ea8d755e6'),
  ('t0000009-0000-0000-0000-000000000009','ab1e9ac7-612a-4d54-9272-e3db401f6109'),
  ('t0000009-0000-0000-0000-000000000009','eb7948d3-9f0d-4f6b-ac97-26a931e829f9'),
  ('t0000009-0000-0000-0000-000000000009','9458ca32-a723-4faa-ab58-bfc14fb7f4c0'),
  ('t0000009-0000-0000-0000-000000000009','fb6870e9-389c-490d-9a8c-f65edbe18e00'),
-- Comptabilité ONG (2025)
  ('t0000010-0000-0000-0000-000000000010','fc122994-8c07-46e8-ab12-7471f35c9665'),
  ('t0000010-0000-0000-0000-000000000010','32fa4a31-2d72-4b17-8877-e1655db1479b'),
  ('t0000010-0000-0000-0000-000000000010','5c95b6cf-d0bc-4c06-8961-8e8f29bc5301'),
  ('t0000010-0000-0000-0000-000000000010','395c75a0-804e-42ef-b80e-d0424078772a'),
  ('t0000010-0000-0000-0000-000000000010','6d3b44ec-a790-4f16-ad0d-923870d5a19e'),
-- IA & Transformation digitale (2025)
  ('t0000011-0000-0000-0000-000000000011','b1ebd671-cefe-409c-b60f-58ff69a4c541'),
  ('t0000011-0000-0000-0000-000000000011','50b657a8-e27f-482e-84b2-1b4abbd57c84'),
  ('t0000011-0000-0000-0000-000000000011','0ce23c14-8a91-4f02-8a69-ea409b66d204'),
  ('t0000011-0000-0000-0000-000000000011','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8'),
  ('t0000011-0000-0000-0000-000000000011','db254baf-ffb8-43e5-938b-fa9059788856'),
-- Onboarding 2026
  ('t0000012-0000-0000-0000-000000000012','f3a214e0-69c3-4dca-8892-a13ec01efc47'),
  ('t0000012-0000-0000-0000-000000000012','fec5f2fd-fff6-4890-b6dc-92602c29289b'),
  ('t0000012-0000-0000-0000-000000000012','589ef44d-7395-4f84-a0b0-260ec5c36afe'),
  ('t0000012-0000-0000-0000-000000000012','50800967-ea50-414a-afa4-0d255854e1bd'),
  ('t0000012-0000-0000-0000-000000000012','c5f2bb51-0c0e-4c36-aa67-3c877fab5c6d'),
-- Excel/Power BI (2026)
  ('t0000013-0000-0000-0000-000000000013','eae9d8bf-4b20-4950-a68d-6bf59a75e600'),
  ('t0000013-0000-0000-0000-000000000013','e486d0de-c936-4040-8a91-cd995928bbbe'),
  ('t0000013-0000-0000-0000-000000000013','83e730ca-4b1c-42f6-b43c-08130dadde67'),
  ('t0000013-0000-0000-0000-000000000013','71ad499c-e1c9-46fe-acc0-af4525cb5494'),
  ('t0000013-0000-0000-0000-000000000013','0934abd4-7be5-4767-a3c9-134b68890a24'),
  ('t0000013-0000-0000-0000-000000000013','d9fcdb37-287d-4aa4-a837-152334c4c3ab'),
-- Droit OHADA 2026
  ('t0000014-0000-0000-0000-000000000014','8ac6a425-564e-421b-803d-0ec8eff6d4f1'),
  ('t0000014-0000-0000-0000-000000000014','bcd1a32a-4b83-484c-a3d8-93aa4647734f'),
  ('t0000014-0000-0000-0000-000000000014','6cf4d540-9e45-4b56-8e4f-bfcae6da1a04');

-- ============================================================
-- 8. REPORTING COMMERCIAL 2024-2026
-- ============================================================
INSERT INTO commercial_submissions
  (type, reference, title, client, submission_date, service_line, responsible_employee_id, status, contract_amount, contract_start_date, contract_end_date, created_by)
VALUES
-- 2024 — AMI gagnés
  ('AMI','AMI-2024-001','Audit financier consolidé exercice 2023','SONABHY','2024-01-15','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','GAGNE',28500000,'2024-02-01','2024-07-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-002','Assistance à la mise en place contrôle interne','BRAKINA SA','2024-02-05','CONSULTING_FA','b981af9a-63ce-4814-990a-f6079a30f2aa','GAGNE',18000000,'2024-03-01','2024-08-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-003','Audit légal comptes annuels 2023','Hôtel Splendid Ouaga','2024-01-22','AUDIT_ASSURANCE','db254baf-ffb8-43e5-938b-fa9059788856','GAGNE',12000000,'2024-02-15','2024-05-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-004','Revue des procédures de passation marchés','Commune Urbaine Ouagadougou','2024-03-10','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','GAGNE',9500000,'2024-04-01','2024-06-30','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-005','Externalisation comptabilité','FASOPLAST','2024-04-08','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','GAGNE',24000000,'2024-05-01','2025-04-30','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-006','Conseil juridique et fiscal','CORIS BANK','2024-05-14','JURIDIQUE_FISCALITE','8ac6a425-564e-421b-803d-0ec8eff6d4f1','GAGNE',15000000,'2024-06-01','2024-11-30','a0000001-0000-0000-0000-000000000001'),
-- 2024 — AO gagnés
  ('APPEL_OFFRE','AO-2024-001','Audit de performance programme santé nationale','Ministère de la Santé','2024-03-25','AUDIT_ASSURANCE','b1ebd671-cefe-409c-b60f-58ff69a4c541','GAGNE',45000000,'2024-05-01','2024-10-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2024-002','Évaluation système gestion financière','Banque Mondiale / Projet Education','2024-06-10','CONSULTING_FA','50b657a8-e27f-482e-84b2-1b4abbd57c84','GAGNE',38000000,'2024-08-01','2025-01-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2024-003','Outsourcing paie & RH','TOTAL Energies BF','2024-07-22','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','GAGNE',32000000,'2024-09-01','2025-08-31','a0000001-0000-0000-0000-000000000001'),
-- 2024 — Perdus / Sans suite
  ('APPEL_OFFRE','AO-2024-004','Audit financier ONG Humanitaire','OXFAM Burkina','2024-04-15','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-007','Conseil en stratégie RH','ONATEL','2024-08-01','CONSULTING_FA','b981af9a-63ce-4814-990a-f6079a30f2aa','PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2024-008','Audit informatique / SI','BICIA-B','2024-09-12','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','SANS_SUITE',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
-- 2025 — AMI gagnés
  ('AMI','AMI-2025-001','Audit légal comptes 2024','SONAPOST','2025-01-10','AUDIT_ASSURANCE','db254baf-ffb8-43e5-938b-fa9059788856','GAGNE',14000000,'2025-02-01','2025-06-30','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-002','Externalisation comptabilité 2025-2026','SOFITEX','2025-01-20','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','GAGNE',30000000,'2025-02-01','2026-01-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-003','Mission due diligence acquisition','Groupe Bolloré Afrique','2025-02-14','CONSULTING_FA','50b657a8-e27f-482e-84b2-1b4abbd57c84','GAGNE',52000000,'2025-03-01','2025-07-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-004','Audit organisationnel & RH','CAMEG','2025-03-03','CONSULTING_FA','b981af9a-63ce-4814-990a-f6079a30f2aa','GAGNE',22000000,'2025-04-01','2025-09-30','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-005','Revue fiscale annuelle','ORANGE Burkina','2025-04-07','JURIDIQUE_FISCALITE','8ac6a425-564e-421b-803d-0ec8eff6d4f1','GAGNE',18500000,'2025-05-01','2025-10-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-006','Audit légal 2024','CNSS Burkina Faso','2025-01-28','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','GAGNE',20000000,'2025-03-01','2025-08-31','a0000001-0000-0000-0000-000000000001'),
-- 2025 — AO gagnés
  ('APPEL_OFFRE','AO-2025-001','Audit externe programme Eau & Assainissement','AFD / Ministère Eau','2025-02-03','AUDIT_ASSURANCE','b1ebd671-cefe-409c-b60f-58ff69a4c541','GAGNE',68000000,'2025-04-01','2025-12-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-002','Assistance technique budgétisation axée résultats','PNUD Burkina','2025-03-17','CONSULTING_FA','0232c465-e837-40d1-9261-fb17e803d031','GAGNE',55000000,'2025-05-01','2026-04-30','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-003','Externalisation gestion administrative','BSIC Burkina','2025-05-05','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','GAGNE',28000000,'2025-07-01','2026-06-30','a0000001-0000-0000-0000-000000000001'),
-- 2025 — Perdus
  ('APPEL_OFFRE','AO-2025-004','Audit performance programme agricole','FAO Burkina','2025-04-22','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-007','Conseil transformation digitale','ONEA','2025-06-02','CONSULTING_FA','b981af9a-63ce-4814-990a-f6079a30f2aa','PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
-- 2026 — En cours et récents
  ('AMI','AMI-2026-001','Audit légal comptes 2025','SONABHY','2026-01-08','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','GAGNE',30000000,'2026-02-01','2026-07-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-002','Externalisation paie & comptabilité','FASO COTON','2026-01-15','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','GAGNE',26000000,'2026-02-01','2027-01-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-003','Due diligence acquisition filiale','ECOBANK BF','2026-02-10','CONSULTING_FA','50b657a8-e27f-482e-84b2-1b4abbd57c84','GAGNE',44000000,'2026-03-01','2026-07-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-004','Revue procédures contrôle interne','BRAKINA SA','2026-03-03','AUDIT_ASSURANCE','db254baf-ffb8-43e5-938b-fa9059788856','GAGNE',16000000,'2026-04-01','2026-07-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2026-001','Audit programme développement rural','Banque Africaine Développement','2026-01-27','AUDIT_ASSURANCE','b1ebd671-cefe-409c-b60f-58ff69a4c541','GAGNE',72000000,'2026-03-01','2026-12-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-005','Conseil fiscal restructuration groupe','Groupe Aga Khan BF','2026-04-14','JURIDIQUE_FISCALITE','8ac6a425-564e-421b-803d-0ec8eff6d4f1','GAGNE',35000000,'2026-05-01','2026-10-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-006','Audit légal 2025','TOTAL Energies BF','2026-02-20','AUDIT_ASSURANCE','fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-007','Externalisation comptabilité','PETRO BURKINA','2026-03-17','OUTSOURCING','1450c3e0-5682-4c3d-83c4-4b4a13f29366','EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2026-002','Assistance maîtrise ouvrage réforme GFP','Ministère des Finances','2026-04-28','CONSULTING_FA','0232c465-e837-40d1-9261-fb17e803d031','EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2026-003','Audit programme formation professionnelle','Union Européenne','2026-05-05','AUDIT_ASSURANCE','b1ebd671-cefe-409c-b60f-58ff69a4c541','EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-008','Revue systèmes d''information comptables','JIRAMA-BF','2026-05-12','CONSULTING_FA','b981af9a-63ce-4814-990a-f6079a30f2aa','EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 9. ÉVALUATIONS 2024 (terminées) & 2025 (en cours)
-- ============================================================
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, strengths, improvements, comments)
VALUES
-- 2024 évaluations annuelles terminées
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',15.5,16.0,15.0,15.5,'Rigueur technique, bon sens du client','Développer capacité à déléguer','Excellente progression en 2024'),
  ('f5d8a290-3197-4c29-a3ee-b8a8618f3bb2','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',14.0,13.5,14.5,14.0,'Fiabilité, qualité des livrables','Améliorer prise d''initiative','Bon collaborateur, prêt pour promotion Senior 3'),
  ('fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',17.5,18.0,17.0,17.5,'Leadership naturel, management équipe','Communication externe à renforcer','Excellente année, manager de référence'),
  ('db254baf-ffb8-43e5-938b-fa9059788856','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',16.0,16.5,15.5,16.0,'Expertise technique reconnue','Gestion du temps sur multi-missions','Pilier de l''équipe audit'),
  ('b981af9a-63ce-4814-990a-f6079a30f2aa','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',16.5,17.0,16.0,16.5,'Développement commercial remarquable','Structuration des livrables','Excellent développeur de business'),
  ('8ac6a425-564e-421b-803d-0ec8eff6d4f1','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',15.0,15.5,14.5,15.0,'Expertise juridique et fiscale','Développer visibilité externe','Référente juridique du cabinet'),
  ('0a319971-1084-4029-812f-8c25bacced55','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',14.5,14.0,15.0,14.5,'Autonomie sur missions complexes','Encadrement équipe junior à renforcer','Prêt pour le niveau AM1'),
  ('42d953ac-bdd2-426c-885b-9a9bf5257746','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',15.0,15.5,14.5,15.0,'Expérience missions variées','Documentation de travail','Bonne progression globale'),
  ('1450c3e0-5682-4c3d-83c4-4b4a13f29366','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',16.0,16.0,16.0,16.0,'Pilotage outsourcing efficace','Automatisation processus','Excellent gestionnaire de portefeuille'),
  ('9458ca32-a723-4faa-ab58-bfc14fb7f4c0','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',14.0,14.5,13.5,14.0,'Organisation administration cabinet','Prise d''initiatives projets transverses','Indispensable pour le fonctionnement admin'),
  ('3c49813b-a779-44a2-ae33-dc587ac2a01f','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',17.0,17.0,17.5,16.5,'Pilotage stratégique RH & Admin','Digitalisation des processus','Directrice admin de très haut niveau'),
  ('88dc1fba-50a7-4707-926d-69871cb44665','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',13.5,13.0,14.0,13.5,'Progression constante','Confiance en soi sur présentations client','En bonne voie vers Senior 2'),
  ('250bd9bf-80ca-485e-a417-8782805779d2','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',14.0,14.5,13.5,14.0,'Qualité technique, sérieux','Développer réseau professionnel','Collaboratrice fiable'),
  ('a3454457-bc1f-4be4-9153-369ca3949772','a0000001-0000-0000-0000-000000000001',2024,'ANNUEL','TERMINE',15.5,15.0,16.0,15.5,'Expertise missions audit consolidation','Délégation et suivi équipe','Pivot entre juniors et associés'),
-- 2025 évaluations en cours
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours'),
  ('fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours'),
  ('db254baf-ffb8-43e5-938b-fa9059788856','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours'),
  ('b981af9a-63ce-4814-990a-f6079a30f2aa','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours'),
  ('1450c3e0-5682-4c3d-83c4-4b4a13f29366','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours'),
  ('3c49813b-a779-44a2-ae33-dc587ac2a01f','a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','EN_COURS',NULL,NULL,NULL,NULL,'','','En cours');

-- ============================================================
-- 10. RECRUTEMENT — Pipeline candidats
-- ============================================================
INSERT INTO candidates (first_name, last_name, email, phone, position, status, source, notes, salary_expected, created_by) VALUES
  ('Aimé',       'NANA',        'aime.nana@gmail.com',          '+226 70 11 22 33','Auditeur Senior 1',          'ENTRETIEN',  'LinkedIn',         'Candidat très sérieux, 4 ans expérience EY Côte d''Ivoire',          900000, 'a0000001-0000-0000-0000-000000000001'),
  ('Fatimata',   'OUEDRAOGO',   'f.ouedraogo@yahoo.fr',         '+226 65 22 33 44','Juriste Fiscaliste',         'ENTRETIEN',  'Site web',         'Master 2 Droit des Affaires OHADA, bonne impression 1er entretien',  750000, 'a0000001-0000-0000-0000-000000000001'),
  ('Boureima',   'TRAORE',      'b.traore.audit@gmail.com',     '+226 07 33 44 55','Auditeur Assistant Confirmé','OFFRE',      'Recommandation',   'Recommandé par FM-008 DARGA, profil solide, offre en cours',         550000, 'a0000001-0000-0000-0000-000000000001'),
  ('Clémence',   'KABORE',      'clemence.kabore@hotmail.com',  '+226 70 44 55 66','Assistante de Direction',    'EMBAUCHE',   'Cabinet recrutement','Recrutée, intégration prévue 01/06/2026',                          400000, 'a0000001-0000-0000-0000-000000000001'),
  ('Ibrahim',    'ZIDA',        'i.zida.consulting@gmail.com',  '+226 76 55 66 77','Consultant Financial Advisory','EN_COURS',  'LinkedIn',         'Ancien Deloitte Sénégal, profil international intéressant',          800000, 'a0000001-0000-0000-0000-000000000001'),
  ('Marcelline', 'YAMEOGO',     'marcelline.yameogo@gmail.com', '+226 65 66 77 88','Auditrice Débutante',        'NOUVEAU',    'Université Ouaga 2','CV reçu, Master Comptabilité, à contacter',                         300000, 'a0000001-0000-0000-0000-000000000001'),
  ('Souleymane', 'DIALLO',      's.diallo.rh@gmail.com',        '+226 07 77 88 99','Chargé RH & Formation',      'REFUSE',     'Site web',         'Profil insuffisant pour le niveau requis',                            500000, 'a0000001-0000-0000-0000-000000000001'),
  ('Aida',       'COMPAORE',    'aida.c.audit@gmail.com',       '+226 70 88 99 00','Auditeur Senior 2',          'EN_COURS',   'Recommandation',   'Recommandé par FM-031, expérience KPMG Mali',                        1000000,'a0000001-0000-0000-0000-000000000001'),
  ('Théophile',  'OUATTARA',    'theophile.ouattara@gmail.com', '+226 65 99 00 11','Informaticien / DSI',        'ENTRETIEN',  'LinkedIn',         'Ingénieur informatique, compétences ERP et audit informatique',       850000, 'a0000001-0000-0000-0000-000000000001'),
  ('Karidja',    'COULIBALY',   'karidja.coulibaly@yahoo.fr',   '+226 07 00 11 22','Assistante Comptable',       'NOUVEAU',    'Candidature spontanée','BTS Comptabilité, à évaluer',                                  280000, 'a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 11. OBJECTIFS KPI 2025 & 2026
-- ============================================================
INSERT INTO kpi_targets (year, indicator_key, target_value) VALUES
  (2025,'turnover_rate',          12),
  (2025,'training_hours_total',   800),
  (2025,'training_budget',        8000000),
  (2025,'new_hires',              8),
  (2025,'promotions_count',       6),
  (2025,'women_ratio',            45),
  (2025,'cdi_ratio',              80),
  (2026,'turnover_rate',          10),
  (2026,'training_hours_total',   1000),
  (2026,'training_budget',        10000000),
  (2026,'new_hires',              10),
  (2026,'promotions_count',       7),
  (2026,'women_ratio',            48),
  (2026,'cdi_ratio',              82)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Vérification finale
-- ============================================================
SELECT 'Employés'              AS table_name, COUNT(*) AS lignes FROM employees
UNION ALL SELECT 'Leave balances',            COUNT(*) FROM leave_balances
UNION ALL SELECT 'Congés',                    COUNT(*) FROM leaves
UNION ALL SELECT 'Formations',                COUNT(*) FROM trainings
UNION ALL SELECT 'Participants formations',   COUNT(*) FROM training_participants
UNION ALL SELECT 'Historique salaires',       COUNT(*) FROM salary_history
UNION ALL SELECT 'Soumissions commerciales',  COUNT(*) FROM commercial_submissions
UNION ALL SELECT 'Évaluations',               COUNT(*) FROM evaluations
UNION ALL SELECT 'Candidats recrutement',     COUNT(*) FROM candidates
UNION ALL SELECT 'KPI Targets',               COUNT(*) FROM kpi_targets;

COMMIT;
