-- ============================================================
-- Données de démonstration SGRH Cabinet
-- ============================================================

-- Utilisateurs (mot de passe: Admin123! pour tous)
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'drh@cabinet.ci', '$2a$12$e9mHuFjbZyqWx6PmFpE/Z.IBOX0aCfVGOGLg04cPBTXnMz0uAx0Hi', 'Aminata', 'Koné', 'DRH'),
  ('a0000001-0000-0000-0000-000000000002', 'dg@cabinet.ci', '$2a$12$e9mHuFjbZyqWx6PmFpE/Z.IBOX0aCfVGOGLg04cPBTXnMz0uAx0Hi', 'Jean-Pierre', 'Dupont', 'DIRECTION_GENERALE'),
  ('a0000001-0000-0000-0000-000000000003', 'associe@cabinet.ci', '$2a$12$e9mHuFjbZyqWx6PmFpE/Z.IBOX0aCfVGOGLg04cPBTXnMz0uAx0Hi', 'Moussa', 'Traoré', 'ASSOCIE'),
  ('a0000001-0000-0000-0000-000000000004', 'manager@cabinet.ci', '$2a$12$e9mHuFjbZyqWx6PmFpE/Z.IBOX0aCfVGOGLg04cPBTXnMz0uAx0Hi', 'Sophie', 'Martin', 'MANAGER'),
  ('a0000001-0000-0000-0000-000000000005', 'user@cabinet.ci', '$2a$12$e9mHuFjbZyqWx6PmFpE/Z.IBOX0aCfVGOGLg04cPBTXnMz0uAx0Hi', 'Paul', 'Yao', 'UTILISATEUR');

-- Collaborateurs
INSERT INTO employees (matricule, first_name, last_name, gender, email, phone, birth_date, function, service_line, grade, contract_type, entry_date, salary, status, has_dec_french, is_expatriate, department) VALUES
  ('MAT-2019-001', 'Kouassi', 'Bamba', 'M', 'k.bamba@cabinet.ci', '+225 07 12 34 56', '1990-03-15', 'AUDITEUR', 'AUDIT_ASSURANCE', 'SENIOR_2', 'CDI', '2019-09-01', 850000, 'ACTIF', true, false, 'Audit'),
  ('MAT-2020-002', 'Fatou', 'Diallo', 'F', 'f.diallo@cabinet.ci', '+225 05 98 76 54', '1993-07-22', 'AUDITEUR', 'AUDIT_ASSURANCE', 'JUNIOR', 'CDI', '2020-10-01', 600000, 'ACTIF', false, false, 'Audit'),
  ('MAT-2021-003', 'Ibrahim', 'Coulibaly', 'M', 'i.coulibaly@cabinet.ci', '+225 01 23 45 67', '1995-11-08', 'JURISTE_FISCALISTE', 'JURIDIQUE_FISCALITE', 'ASSISTANT_CONFIRME', 'CDI', '2021-01-15', 550000, 'ACTIF', false, false, 'Tax & Legal'),
  ('MAT-2018-004', 'Marie', 'N''Guessan', 'F', 'm.nguessan@cabinet.ci', '+225 07 65 43 21', '1985-04-30', 'MANAGER_PRINCIPAL', 'CONSULTING_FA', 'ASSISTANT_MANAGER_2', 'CDI', '2018-03-01', 1200000, 'ACTIF', true, false, 'Financial Advisory'),
  ('MAT-2022-005', 'Adama', 'Ouédraogo', 'M', 'a.ouedraogo@cabinet.ci', '+225 05 11 22 33', '1998-09-18', 'AUDITEUR', 'AUDIT_ASSURANCE', 'ASSISTANT_DEBUTANT', 'STAGE', '2022-07-01', 180000, 'ACTIF', false, false, 'Audit'),
  ('MAT-2017-006', 'Chantal', 'Aka', 'F', 'c.aka@cabinet.ci', '+225 07 44 55 66', '1982-01-25', 'DIRECTEUR', 'OUTSOURCING', 'DIRECTEUR', 'CDI', '2017-06-01', 2500000, 'ACTIF', true, false, 'Outsourcing'),
  ('MAT-2020-007', 'Seydou', 'Konaté', 'M', 's.konate@cabinet.ci', '+225 01 77 88 99', '1994-06-12', 'INFORMATICIEN', 'ADMINISTRATION', 'JUNIOR', 'CDI', '2020-02-01', 620000, 'ACTIF', false, false, 'IT'),
  ('MAT-2023-008', 'Awa', 'Sanogo', 'F', 'a.sanogo@cabinet.ci', '+225 05 33 44 55', '2000-12-03', 'AUDITEUR', 'AUDIT_ASSURANCE', 'ASSISTANT_DEBUTANT', 'STAGE', '2023-01-09', 175000, 'ACTIF', false, false, 'Audit'),
  ('MAT-2016-009', 'Robert', 'Mensah', 'M', 'r.mensah@cabinet.ci', '+225 07 99 00 11', '1978-08-17', 'ASSOCIE', 'AUDIT_ASSURANCE', 'ASSOCIE', 'CDI', '2016-09-01', 4000000, 'ACTIF', true, false, 'Audit'),
  ('MAT-2021-010', 'Nathalie', 'Touré', 'F', 'n.toure@cabinet.ci', '+225 01 55 66 77', '1996-02-28', 'AUDITEUR', 'CONSULTING_FA', 'ASSISTANT_CONFIRME', 'CDD', '2021-04-01', 500000, 'ACTIF', false, false, 'Consulting'),
  ('MAT-2022-011', 'Yves', 'Kouamé', 'M', 'y.kouame@cabinet.ci', '+225 05 22 33 44', '1991-10-14', 'JURISTE_FISCALISTE', 'JURIDIQUE_FISCALITE', 'SENIOR_1', 'CDI', '2022-09-01', 750000, 'ACTIF', false, false, 'Tax & Legal'),
  ('MAT-2019-012', 'Edith', 'Yao', 'F', 'e.yao@cabinet.ci', '+225 07 88 99 00', '1988-05-07', 'ASSISTANT_DIRECTION', 'ADMINISTRATION', 'CONSULTANT', 'CDI', '2019-11-01', 700000, 'ACTIF', false, false, 'RH'),
  ('MAT-2023-013', 'Koffi', 'Assi', 'M', NULL, '+225 01 44 55 66', '2001-03-21', 'AUDITEUR', 'AUDIT_ASSURANCE', 'ASSISTANT_DEBUTANT', 'STAGE', '2023-06-01', 160000, 'ACTIF', false, false, 'Audit'),
  ('MAT-2020-014', 'Mariame', 'Diabaté', 'F', 'm.diabate@cabinet.ci', '+225 05 66 77 88', '1992-09-09', 'AUDITEUR', 'OUTSOURCING', 'JUNIOR', 'CDI', '2020-08-01', 610000, 'ACTIF', false, false, 'Outsourcing'),
  ('MAT-2018-015', 'François', 'Koua', 'M', 'f.koua@cabinet.ci', '+225 07 11 22 33', '1984-07-16', 'MANAGER_PRINCIPAL', 'AUDIT_ASSURANCE', 'SENIOR_MANAGER_1', 'CDI', '2018-01-01', 1800000, 'ACTIF', true, false, 'Audit');

-- Formations
INSERT INTO trainings (type, title, date, location, start_time, end_time, duration_hours, trainer, observations) VALUES
  ('INTRA', 'Normes IFRS 2024', '2024-02-15', 'Salle A - Cabinet', '09:00', '17:00', 8, 'Dr. Kofi Mensah', 'Formation obligatoire pour équipe Audit'),
  ('INTERNE', 'Leadership et Management', '2024-02-22', 'Abidjan - Hôtel Ivoire', '08:30', '16:30', 8, 'Consultant RH', 'Formation groupe Forvis Mazars'),
  ('AOC', 'Fiscalité internationale', '2024-03-05', 'Dakar, Sénégal', '09:00', '18:00', 9, 'Expert KPMG', 'Conférence AOC annuelle'),
  ('INTRA', 'Excel Avancé & Power BI', '2024-03-12', 'Salle B - Cabinet', '09:00', '13:00', 4, 'IT Dept', 'Formation bureautique'),
  ('GROUPE', 'Audit Qualité ISO', '2024-03-20', 'Paris - Forvis Mazars HQ', '09:00', '17:00', 8, 'Directeur Qualité', 'Formation internationale groupe');

-- Targets KPI
INSERT INTO kpi_targets (year, indicator_key, target_value, description) VALUES
  (2024, 'TRAINING_BUDGET', 175000, 'Budget formation en FCFA'),
  (2024, 'TRAINING_HOURS', 200, 'Total heures de formation'),
  (2024, 'HEADCOUNT', 50, 'Effectif cible'),
  (2024, 'TURNOVER_RATE', 15, 'Taux de turnover cible (%)'),
  (2024, 'ATTRITION_RATE', 10, 'Taux d attrition cible (%)');
