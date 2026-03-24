-- ============================================================
-- Données de démonstration SGRH Cabinet — Burkina Faso
-- ============================================================

-- Utilisateurs
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'catherine.sawadogo@forvismazars.com', '$2b$12$/nf6N1Ja1sLFf911RLqSueJ0IR0YsDEdWzISwNyrFEfmNk5d/OcBi', 'Catherine', 'Sawadogo', 'DRH');

-- Collaborateurs
INSERT INTO employees (matricule, first_name, last_name, gender, email, phone, birth_date, function, service_line, grade, contract_type, entry_date, salary, status, has_dec_french, is_expatriate, department) VALUES
  ('MAT-2019-001', 'Issouf',    'Sawadogo',   'M', 'i.sawadogo@cabinet.bf',  '+226 70 12 34 56', '1990-03-15', 'AUDITEUR',           'AUDIT_ASSURANCE',      'SENIOR_2',           'CDI',   '2019-09-01', 850000,  'ACTIF', true,  false, 'Audit'),
  ('MAT-2020-002', 'Aïssata',   'Traoré',     'F', 'a.traore@cabinet.bf',    '+226 76 98 76 54', '1993-07-22', 'AUDITEUR',           'AUDIT_ASSURANCE',      'JUNIOR',             'CDI',   '2020-10-01', 600000,  'ACTIF', false, false, 'Audit'),
  ('MAT-2021-003', 'Hamidou',   'Ouédraogo',  'M', 'h.ouedraogo@cabinet.bf', '+226 65 23 45 67', '1995-11-08', 'JURISTE_FISCALISTE', 'JURIDIQUE_FISCALITE',  'ASSISTANT_CONFIRME', 'CDI',   '2021-01-15', 550000,  'ACTIF', false, false, 'Tax & Legal'),
  ('MAT-2018-004', 'Mariam',    'Compaoré',   'F', 'm.compaore@cabinet.bf',  '+226 70 65 43 21', '1985-04-30', 'MANAGER_PRINCIPAL',  'CONSULTING_FA',        'ASSISTANT_MANAGER_2','CDI',   '2018-03-01', 1200000, 'ACTIF', true,  false, 'Financial Advisory'),
  ('MAT-2022-005', 'Adama',     'Kaboré',     'M', 'a.kabore@cabinet.bf',    '+226 74 11 22 33', '1998-09-18', 'AUDITEUR',           'AUDIT_ASSURANCE',      'ASSISTANT_DEBUTANT', 'STAGE', '2022-07-01', 180000,  'ACTIF', false, false, 'Audit'),
  ('MAT-2017-006', 'Chantal',   'Zongo',      'F', 'c.zongo@cabinet.bf',     '+226 70 44 55 66', '1982-01-25', 'DIRECTEUR',          'OUTSOURCING',          'DIRECTEUR',          'CDI',   '2017-06-01', 2500000, 'ACTIF', true,  false, 'Outsourcing'),
  ('MAT-2020-007', 'Seydou',    'Konaté',     'M', 's.konate@cabinet.bf',    '+226 65 77 88 99', '1994-06-12', 'INFORMATICIEN',      'ADMINISTRATION',       'JUNIOR',             'CDI',   '2020-02-01', 620000,  'ACTIF', false, false, 'IT'),
  ('MAT-2023-008', 'Awa',       'Sanogo',     'F', 'a.sanogo@cabinet.bf',    '+226 76 33 44 55', '2000-12-03', 'AUDITEUR',           'AUDIT_ASSURANCE',      'ASSISTANT_DEBUTANT', 'STAGE', '2023-01-09', 175000,  'ACTIF', false, false, 'Audit'),
  ('MAT-2016-009', 'Robert',    'Nikiéma',    'M', 'r.nikiema@cabinet.bf',   '+226 70 99 00 11', '1978-08-17', 'ASSOCIE',            'AUDIT_ASSURANCE',      'ASSOCIE',            'CDI',   '2016-09-01', 4000000, 'ACTIF', true,  false, 'Audit'),
  ('MAT-2021-010', 'Nathalie',  'Coulibaly',  'F', 'n.coulibaly@cabinet.bf', '+226 65 55 66 77', '1996-02-28', 'AUDITEUR',           'CONSULTING_FA',        'ASSISTANT_CONFIRME', 'CDD',   '2021-04-01', 500000,  'ACTIF', false, false, 'Consulting'),
  ('MAT-2022-011', 'Yves',      'Belem',      'M', 'y.belem@cabinet.bf',     '+226 74 22 33 44', '1991-10-14', 'JURISTE_FISCALISTE', 'JURIDIQUE_FISCALITE',  'SENIOR_1',           'CDI',   '2022-09-01', 750000,  'ACTIF', false, false, 'Tax & Legal'),
  ('MAT-2019-012', 'Edith',     'Tapsoba',    'F', 'e.tapsoba@cabinet.bf',   '+226 70 88 99 00', '1988-05-07', 'ASSISTANT_DIRECTION','ADMINISTRATION',       'CONSULTANT',         'CDI',   '2019-11-01', 700000,  'ACTIF', false, false, 'RH'),
  ('MAT-2023-013', 'Idrissa',   'Yougbaré',   'M', NULL,                     '+226 65 44 55 66', '2001-03-21', 'AUDITEUR',           'AUDIT_ASSURANCE',      'ASSISTANT_DEBUTANT', 'STAGE', '2023-06-01', 160000,  'ACTIF', false, false, 'Audit'),
  ('MAT-2020-014', 'Mariame',   'Diabaté',    'F', 'm.diabate@cabinet.bf',   '+226 76 66 77 88', '1992-09-09', 'AUDITEUR',           'OUTSOURCING',          'JUNIOR',             'CDI',   '2020-08-01', 610000,  'ACTIF', false, false, 'Outsourcing'),
  ('MAT-2018-015', 'François',  'Ouattara',   'M', 'f.ouattara@cabinet.bf',  '+226 70 11 22 33', '1984-07-16', 'MANAGER_PRINCIPAL',  'AUDIT_ASSURANCE',      'SENIOR_MANAGER_1',   'CDI',   '2018-01-01', 1800000, 'ACTIF', true,  false, 'Audit');

-- Formations
INSERT INTO trainings (type, title, date, location, start_time, end_time, duration_hours, trainer, observations) VALUES
  ('INTRA',   'Normes IFRS 2024',              '2024-02-15', 'Salle A - Cabinet',                   '09:00', '17:00', 8, 'Dr. Moussa Kaboré',  'Formation obligatoire pour équipe Audit'),
  ('INTERNE', 'Leadership et Management',      '2024-02-22', 'Ouagadougou - Hôtel Laïco Ouaga 2000','08:30', '16:30', 8, 'Consultant RH',      'Formation groupe Forvis Mazars'),
  ('AOC',     'Fiscalité internationale',       '2024-03-05', 'Dakar, Sénégal',                      '09:00', '18:00', 9, 'Expert KPMG',        'Conférence AOC annuelle'),
  ('INTRA',   'Excel Avancé & Power BI',       '2024-03-12', 'Salle B - Cabinet',                   '09:00', '13:00', 4, 'IT Dept',            'Formation bureautique'),
  ('GROUPE',  'Audit Qualité ISO',             '2024-03-20', 'Paris - Forvis Mazars HQ',            '09:00', '17:00', 8, 'Directeur Qualité',  'Formation internationale groupe');

-- Targets KPI
INSERT INTO kpi_targets (year, indicator_key, target_value, description) VALUES
  (2024, 'TRAINING_BUDGET', 175000, 'Budget formation en FCFA'),
  (2024, 'TRAINING_HOURS',  200,    'Total heures de formation'),
  (2024, 'HEADCOUNT',       50,     'Effectif cible'),
  (2024, 'TURNOVER_RATE',   15,     'Taux de turnover cible (%)'),
  (2024, 'ATTRITION_RATE',  10,     'Taux d attrition cible (%)');
