-- ============================================================
-- DONNÉES ENRICHIES DE DÉMONSTRATION — SGRH Cabinet
-- Couvre : Congés, Évaluations, Recrutement, Commercial,
--          Formations 2025-2026, Diplômes, Mobilités, KPI
-- Prérequis : demo_data.sql déjà appliqué
-- ============================================================

-- ============================================================
-- 1. UTILISATEURS — DRH et ADG uniquement
--    DRH : drh@forvismazars.com / drh2026
--    ADG : adg@forvismazars.com / adg2026
-- ============================================================
-- (déjà insérés via demo_data.sql — aucun utilisateur additionnel)

-- ============================================================
-- 2. HIÉRARCHIE — manager_id pour l'organigramme
-- ============================================================
-- Robert Nikiéma (ASSOCIE) → racine
-- François Ouattara (SENIOR_MANAGER) et Chantal Zongo (DIRECTEUR) rapportent à Robert
UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE matricule = 'MAT-2016-009')
WHERE matricule IN ('MAT-2018-015', 'MAT-2017-006');

-- Équipe Audit → François Ouattara
UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE matricule = 'MAT-2018-015')
WHERE matricule IN ('MAT-2019-001','MAT-2020-002','MAT-2022-005','MAT-2023-008','MAT-2023-013');

-- Équipe Consulting / Juridique → Mariam Compaoré
UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE matricule = 'MAT-2018-004')
WHERE matricule IN ('MAT-2021-010','MAT-2022-011','MAT-2021-003');

-- Équipe Outsourcing / Admin → Chantal Zongo
UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE matricule = 'MAT-2017-006')
WHERE matricule IN ('MAT-2020-014','MAT-2019-012','MAT-2020-007');

-- ============================================================
-- 3. DATES FIN DE CONTRAT — widget "Contrats à renouveler"
--    exit_date dans les 30 prochains jours depuis aujourd'hui
-- ============================================================
UPDATE employees SET exit_date = CURRENT_DATE + 9
WHERE matricule = 'MAT-2022-005';   -- Adama Kaboré (STAGE)

UPDATE employees SET exit_date = CURRENT_DATE + 16
WHERE matricule = 'MAT-2021-010';   -- Nathalie Coulibaly (CDD)

UPDATE employees SET exit_date = CURRENT_DATE + 23
WHERE matricule = 'MAT-2023-008';   -- Awa Sanogo (STAGE)

UPDATE employees SET exit_date = CURRENT_DATE + 28
WHERE matricule = 'MAT-2023-013';   -- Idrissa Yougbaré (STAGE)

-- ============================================================
-- 4. SOLDES DE CONGÉS 2025 & 2026
-- ============================================================
INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'), 2025, 30, 3, 12),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'), 2025, 30, 0,  8),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'), 2025, 30, 0,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'), 2025, 30, 5, 15),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-005'), 2025, 20, 0,  3),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'), 2025, 30, 0,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'), 2025, 30, 0,  3),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-008'), 2025, 20, 0,  2),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'), 2025, 30, 2, 10),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'), 2025, 30, 0, 20),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'), 2025, 30, 0,  7),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'), 2025, 30, 1,  9),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-013'), 2025, 20, 0,  1),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'), 2025, 30, 0,  6),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'), 2025, 30, 4, 11)
ON CONFLICT (employee_id, year) DO NOTHING;

INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'), 2026, 30, 3,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'), 2026, 30, 0,  3),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'), 2026, 30, 0,  0),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'), 2026, 30, 5,  7),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-005'), 2026, 20, 0,  0),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'), 2026, 30, 0,  0),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'), 2026, 30, 0,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-008'), 2026, 20, 0,  0),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'), 2026, 30, 2, 10),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'), 2026, 30, 0,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'), 2026, 30, 0,  3),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'), 2026, 30, 1,  5),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-013'), 2026, 20, 0,  0),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'), 2026, 30, 0,  3),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'), 2026, 30, 4,  5)
ON CONFLICT (employee_id, year) DO NOTHING;

-- ============================================================
-- 5. CONGÉS — alimentent le calendrier d'équipe
-- ============================================================

-- 2025 (historique)
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, approved_by, approved_at, created_by)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'PLANIFIE','2025-01-06','2025-01-10', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'PLANIFIE','2025-02-03','2025-02-07', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'PLANIFIE','2025-04-14','2025-04-25',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'PLANIFIE','2025-07-07','2025-07-18',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'PLANIFIE','2025-08-04','2025-08-15',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'PLANIFIE','2025-05-05','2025-05-09', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'PLANIFIE','2025-09-01','2025-09-12',10,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'PLANIFIE','2025-06-02','2025-06-06', 5,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'IMPRÉVU', '2025-03-17','2025-03-19', 3,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'IMPRÉVU', '2025-10-20','2025-10-22', 3,2025,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001');

-- 2026 janvier-février (historique)
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, approved_by, approved_at, created_by)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'PLANIFIE','2026-01-12','2026-01-23',10,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'PLANIFIE','2026-01-05','2026-01-09', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'PLANIFIE','2026-02-02','2026-02-06', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'PLANIFIE','2026-02-16','2026-02-20', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001');

-- 2026 mars — VISIBLES sur le calendrier du mois courant
INSERT INTO leaves (employee_id, type, start_date, end_date, days, year, status, approved_by, approved_at, created_by)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'PLANIFIE','2026-03-02','2026-03-06', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'PLANIFIE','2026-03-16','2026-03-18', 3,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'PLANIFIE','2026-03-09','2026-03-13', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'PLANIFIE','2026-03-23','2026-03-27', 5,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'IMPRÉVU', '2026-03-10','2026-03-11', 2,2026,'APPROUVE','a0000001-0000-0000-0000-000000000001',NOW(),'a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'PLANIFIE','2026-03-30','2026-04-03', 5,2026,'EN_ATTENTE',NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 6. ÉVALUATIONS — 2 fois par an (MI_ANNUEL + ANNUEL) par employé
-- ============================================================

-- ── 2025 MI_ANNUEL (TERMINE — bilan de mi-parcours) ──────────
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, strengths, improvements, objectives)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',15.5,16.0,15.0,15.5,'Bonne progression sur les missions Audit.','Renforcer la supervision des juniors.','Atteindre 80% des objectifs S1.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',14.0,13.5,14.5,14.0,'Montée en compétence visible.','Prendre plus d''initiatives.','Conduire une mission en autonomie.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',13.5,13.5,13.5,13.5,'Solide maîtrise du droit fiscal local.','Améliorer la communication écrite.','Produire 3 mémos fiscaux de qualité.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',17.0,17.5,16.5,17.0,'Gestion rigoureuse des projets clients.','Développer la délégation.','Signer 2 nouveaux contrats clients.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',17.5,17.5,17.5,17.5,'Pilotage exemplaire du département.','Renforcer le reporting à la direction.','Recruter 2 profils expérimentés.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',13.0,12.5,13.5,13.0,'Fiabilité des systèmes maintenue.','Documenter davantage les procédures IT.','Déployer la solution de sauvegarde cloud.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',18.5,18.5,18.5,18.5,'Leadership stratégique remarquable.','Déléguer les décisions opérationnelles.','Finaliser la stratégie régionale S2.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',15.0,14.5,15.5,15.0,'Rigueur dans les dossiers contentieux.','Améliorer la réactivité client.','Traiter 20 dossiers fiscaux.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',14.0,13.5,14.5,14.0,'Fiabilité administrative excellente.','Développer l''utilisation des outils RH.','Digitaliser 3 processus administratifs.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',16.5,16.5,16.5,16.5,'Encadrement de qualité des équipes.','Renforcer le suivi budgétaire.','Superviser 4 missions simultanément.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',13.0,13.0,13.0,13.0,'Bonne adaptation au département Outsourcing.','Améliorer la maîtrise des outils SAGE.','Gérer 5 dossiers clients en autonomie.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'a0000001-0000-0000-0000-000000000001',2025,'MI_ANNUEL','TERMINE',13.5,13.0,14.0,13.5,'Sérieux et implication dans les missions.','Développer l''autonomie.','Réduire les délais de rendu de 20%.')
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- ── 2025 ANNUEL (TERMINE — bilan de fin d'année) ─────────────
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, strengths, improvements, objectives)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',16.5,17.0,16.0,16.5,'Excellente maîtrise des normes IFRS, autonomie.','Renforcer les compétences en management.','Certifier 2 collaborateurs juniors ; conduire 3 missions en chef de mission.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',15.0,14.5,15.5,15.0,'Rigueur et sérieux dans les missions.','Développer la prise d''initiative.','Passer au grade Senior d''ici fin 2026.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',14.0,14.0,14.0,14.0,'Bonne connaissance de la fiscalité locale.','Améliorer la rédaction des rapports.','Suivre une formation fiscalité internationale.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',17.5,18.0,17.0,17.5,'Leadership exemplaire, excellente gestion de projet.','Déléguer davantage aux juniors.','Développer 2 nouveaux clients institutionnels.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',18.0,18.0,18.0,18.0,'Vision stratégique et excellente gestion des équipes.','Optimiser les processus internes.','Atteindre 15% de croissance du département Outsourcing.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',13.5,13.0,14.0,13.5,'Fiabilité dans la gestion des systèmes.','Renforcer les compétences en cybersécurité.','Migrer l''infrastructure vers le cloud d''ici Q3.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',19.0,19.0,19.0,19.0,'Référence du cabinet, vision d''ensemble remarquable.','Transmettre davantage aux managers.','Développer deux nouveaux marchés régionaux.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',15.5,15.0,16.0,15.5,'Rigueur juridique et fiscale.','Améliorer la communication client.','Obtenir une certification en droit OHADA.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',14.5,14.0,15.0,14.5,'Organisation et fiabilité administratives.','Prendre plus de responsabilités.','Automatiser 3 processus RH récurrents.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',17.0,17.0,17.0,17.0,'Capacité à encadrer et motiver les équipes.','Renforcer la relation avec les clients.','Superviser 5 missions en simultané.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',13.5,13.0,14.0,13.5,'Sérieux et engagement dans les missions.','Développer la polyvalence.','Gérer 8 dossiers clients en autonomie.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'a0000001-0000-0000-0000-000000000001',2025,'ANNUEL','TERMINE',14.0,13.5,14.5,14.0,'Implication et rigueur.','Améliorer la rapidité d''exécution.','Réduire les délais de 25% sur S2.')
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- ── 2025 PROBATOIRE — stagiaires ─────────────────────────────
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, overall_score, objectives_score, skills_score, behavior_score, strengths, improvements)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2022-005'),'a0000001-0000-0000-0000-000000000001',2025,'PROBATOIRE','TERMINE',13.0,13.0,13.0,13.0,'Bon esprit d''équipe, volonté d''apprendre.','Acquérir plus d''autonomie.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-008'),'a0000001-0000-0000-0000-000000000001',2025,'PROBATOIRE','TERMINE',14.0,14.0,14.0,14.0,'Bonne intégration, curieux.','Renforcer la maîtrise des outils.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2023-013'),'a0000001-0000-0000-0000-000000000001',2025,'PROBATOIRE','TERMINE',12.5,12.0,13.0,12.5,'Motivé et assidu.','Améliorer la rigueur dans les dossiers.')
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- ── 2026 MI_ANNUEL (EN_COURS pour les plus avancés, BROUILLON pour les autres)
--    Nous sommes en mars 2026 → les entretiens de mi-année débutent
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, objectives_score, skills_score, behavior_score, objectives)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','EN_COURS',16.0,15.5,16.0,'Conduire 2 missions complexes et encadrer les juniors.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','EN_COURS',17.0,17.0,17.5,'Développer le portefeuille clients de 20%.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','EN_COURS',19.0,19.0,19.0,'Valider la stratégie de croissance régionale.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','EN_COURS',17.5,17.5,18.0,'Finaliser le plan de recrutement Outsourcing.')
ON CONFLICT (employee_id, year, period) DO NOTHING;

INSERT INTO evaluations (employee_id, evaluator_id, year, period, status, objectives)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Conduire une mission en chef de mission.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Produire 3 mémos fiscaux de qualité.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Déployer la solution de sauvegarde cloud.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Traiter 25 dossiers fiscaux et contentieux.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Digitaliser 2 nouveaux processus RH.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Superviser 5 missions simultanément.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Gérer 6 dossiers clients en autonomie.'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'a0000001-0000-0000-0000-000000000001',2026,'MI_ANNUEL','BROUILLON','Réduire les délais de rendu de 30%.')
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- ── 2026 ANNUEL (BROUILLON — fin d'année pas encore atteinte)
INSERT INTO evaluations (employee_id, evaluator_id, year, period, status)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2017-006'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-007'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-012'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-010'),'a0000001-0000-0000-0000-000000000001',2026,'ANNUEL','BROUILLON')
ON CONFLICT (employee_id, year, period) DO NOTHING;

-- ============================================================
-- 7. CANDIDATS — pipeline recrutement (tous statuts)
-- ============================================================
INSERT INTO candidates (first_name, last_name, email, phone, position, department, status, source, notes, salary_expected, created_by)
VALUES
  ('Moussa',    'Kinda',      'moussa.kinda@gmail.com',       '+226 70 11 11 11', 'Auditeur Junior',            'Audit',               'NOUVEAU',   'LinkedIn',         'Diplômé ISCAE 2025, stage chez Deloitte.',          500000,  'a0000001-0000-0000-0000-000000000001'),
  ('Fatimata',  'Ouédraogo',  'fatimata.o@yahoo.fr',          '+226 76 22 22 22', 'Consultante Financière',     'Financial Advisory',  'NOUVEAU',   'Site web',         'Expérience 3 ans en banque.',                       750000,  'a0000001-0000-0000-0000-000000000001'),
  ('Ibrahim',   'Traoré',     'ibrahim.traore@outlook.com',   '+226 65 33 33 33', 'Juriste Fiscaliste',         'Tax & Legal',         'NOUVEAU',   'Recommandation',   'Maîtrise droit des affaires UEMOA.',                700000,  'a0000001-0000-0000-0000-000000000001'),
  ('Aminata',   'Sawadogo',   'aminata.s@gmail.com',          '+226 74 44 44 44', 'Responsable Outsourcing',    'Outsourcing',         'EN_COURS',  'LinkedIn',         'CV analysé, compétences solides en comptabilité.',  900000,  'a0000001-0000-0000-0000-000000000001'),
  ('Serge',     'Compaoré',   'serge.c@cabinet.bf',           '+226 70 55 55 55', 'Auditeur Senior',            'Audit',               'EN_COURS',  'Cabinet partenaire','Candidature transmise par Ernst & Young Dakar.',    1100000, 'a0000001-0000-0000-0000-000000000001'),
  ('Rasmata',   'Zongo',      'rasmata.z@gmail.com',          '+226 65 66 66 66', 'Assistante de Direction',    'Administration',      'ENTRETIEN', 'Site web',         'Entretien planifié — profil RH confirmé.',          450000,  'a0000001-0000-0000-0000-000000000001'),
  ('Adrien',    'Nikiéma',    'adrien.n@gmail.com',           '+226 76 77 77 77', 'Informaticien Réseau',       'IT',                  'ENTRETIEN', 'LinkedIn',         'Maîtrise Cisco et systèmes Linux.',                 680000,  'a0000001-0000-0000-0000-000000000001'),
  ('Corinne',   'Belem',      'corinne.b@gmail.com',          '+226 70 88 88 88', 'Manager Audit',              'Audit',               'OFFRE',     'Recommandation',   'Offre envoyée — en attente de réponse.',            1400000, 'a0000001-0000-0000-0000-000000000001'),
  ('Patrick',   'Yameogo',    'patrick.y@gmail.com',          '+226 74 99 99 99', 'Auditeur Confirmé',          'Audit',               'EMBAUCHE',  'LinkedIn',         'Embauché — intégration prévue le 01/04/2026.',      850000,  'a0000001-0000-0000-0000-000000000001'),
  ('Sylvie',    'Coulibaly',  'sylvie.c@gmail.com',           '+226 65 10 10 10', 'Fiscaliste Senior',          'Tax & Legal',         'EMBAUCHE',  'Site web',         'Embauché — contrat CDI signé.',                     950000,  'a0000001-0000-0000-0000-000000000001'),
  ('Didier',    'Kaboré',     'didier.k@gmail.com',           '+226 76 20 20 20', 'Consultant FA',              'Financial Advisory',  'REFUSE',    'LinkedIn',         'Profil insuffisant pour le poste senior.',           800000,  'a0000001-0000-0000-0000-000000000001'),
  ('Martine',   'Tapsoba',    'martine.t@gmail.com',          '+226 70 30 30 30', 'Auditrice Débutante',        'Audit',               'REFUSE',    'Site web',         'Attentes salariales trop élevées pour le profil.',  600000,  'a0000001-0000-0000-0000-000000000001');

-- Mise à jour date d'entretien pour les candidats ENTRETIEN et OFFRE
UPDATE candidates SET interview_date = NOW() + INTERVAL '3 days'  WHERE email = 'rasmata.z@gmail.com';
UPDATE candidates SET interview_date = NOW() + INTERVAL '5 days'  WHERE email = 'adrien.n@gmail.com';
UPDATE candidates SET interview_date = NOW() - INTERVAL '7 days'  WHERE email = 'corinne.b@gmail.com';

-- ============================================================
-- 8. SOUMISSIONS COMMERCIALES — AMI & Appels d'offre
-- ============================================================

-- AMI 2025
INSERT INTO commercial_submissions (type, reference, title, client, submission_date, service_line, responsible_employee_id, status, contract_amount, contract_start_date, contract_end_date, created_by)
VALUES
  ('AMI','AMI-2025-001','Audit des états financiers SONABHY','SONABHY','2025-01-15','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2018-015'),'GAGNE',45000000,'2025-03-01','2025-12-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-002','Conseil en restructuration BICIA-B','BICIA-B','2025-02-10','CONSULTING_FA',
   (SELECT id FROM employees WHERE matricule='MAT-2018-004'),'GAGNE',32000000,'2025-04-01','2025-09-30','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-003','Externalisation paie CNSS','CNSS','2025-03-20','OUTSOURCING',
   (SELECT id FROM employees WHERE matricule='MAT-2017-006'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-004','Assistance fiscale Groupe SOMA','Groupe SOMA','2025-04-05','JURIDIQUE_FISCALITE',
   (SELECT id FROM employees WHERE matricule='MAT-2022-011'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2025-005','Audit interne Banque Atlantique','Banque Atlantique BF','2025-05-12','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2016-009'),'PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- Appels d'offre 2025
INSERT INTO commercial_submissions (type, reference, title, client, submission_date, service_line, responsible_employee_id, status, contract_amount, contract_start_date, contract_end_date, created_by)
VALUES
  ('APPEL_OFFRE','AO-2025-001','Audit légal ONEA 2025','ONEA','2025-02-01','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2018-015'),'GAGNE',28000000,'2025-04-01','2026-03-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-002','Externalisation comptabilité FASONORM','FASONORM','2025-03-15','OUTSOURCING',
   (SELECT id FROM employees WHERE matricule='MAT-2017-006'),'GAGNE',18500000,'2025-06-01','2026-05-31','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-003','Conseil stratégique Ministère Finances','Min. Finances','2025-04-20','CONSULTING_FA',
   (SELECT id FROM employees WHERE matricule='MAT-2018-004'),'PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-004','Certification ISO 9001 Cabinet','Cabinet BF','2025-06-01','ADMINISTRATION',
   (SELECT id FROM employees WHERE matricule='MAT-2019-012'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2025-005','Audit de performance SOTRACO','SOTRACO','2025-07-10','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2016-009'),'PERDU',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- AMI 2026 (année courante)
INSERT INTO commercial_submissions (type, reference, title, client, submission_date, service_line, responsible_employee_id, status, contract_amount, contract_start_date, contract_end_date, created_by)
VALUES
  ('AMI','AMI-2026-001','Audit consolidé Groupe Coris','Coris Bank International','2026-01-20','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2018-015'),'GAGNE',62000000,'2026-03-01','2026-12-31','a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-002','Assistance juridique ARCEP','ARCEP','2026-02-05','JURIDIQUE_FISCALITE',
   (SELECT id FROM employees WHERE matricule='MAT-2022-011'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('AMI','AMI-2026-003','Conseil RH & transformation BRAKINA','BRAKINA','2026-02-28','CONSULTING_FA',
   (SELECT id FROM employees WHERE matricule='MAT-2018-004'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- Appels d'offre 2026 (année courante)
INSERT INTO commercial_submissions (type, reference, title, client, submission_date, service_line, responsible_employee_id, status, contract_amount, contract_start_date, contract_end_date, created_by)
VALUES
  ('APPEL_OFFRE','AO-2026-001','Audit légal SBIF 2026','SBIF','2026-01-10','AUDIT_ASSURANCE',
   (SELECT id FROM employees WHERE matricule='MAT-2016-009'),'GAGNE',35000000,'2026-03-15','2027-03-14','a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2026-002','Externalisation RH Sofitex','Sofitex','2026-02-14','OUTSOURCING',
   (SELECT id FROM employees WHERE matricule='MAT-2017-006'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001'),
  ('APPEL_OFFRE','AO-2026-003','Conseil fiscal Chambre Commerce','CCI-BF','2026-03-01','JURIDIQUE_FISCALITE',
   (SELECT id FROM employees WHERE matricule='MAT-2022-011'),'EN_COURS',NULL,NULL,NULL,'a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 9. FORMATIONS 2025 & 2026 (pages Formations + KPIs)
-- ============================================================
INSERT INTO trainings (type, title, date, location, start_time, end_time, duration_hours, trainer, observations)
VALUES
  ('INTRA',   'Audit des risques & contrôle interne',   '2025-01-20','Salle A - Cabinet',            '09:00','17:00', 8,'Dr. Issouf Sawadogo',  'Formation obligatoire équipe Audit'),
  ('AOC',     'Conférence IFRS AOC 2025',               '2025-02-12','Abidjan, Côte d'Ivoire',       '08:30','17:30', 9,'Expert IASB',           'Conférence annuelle réseau AOC'),
  ('INTERNE', 'Management et leadership avancé',        '2025-03-05','Ouagadougou - Laïco Ouaga',    '09:00','17:00', 8,'Consultant RH externe', 'Programme Forvis Mazars leadership'),
  ('INTRA',   'Fiscalité des sociétés BF 2025',         '2025-04-10','Salle B - Cabinet',            '09:00','13:00', 4,'Yves Belem',            'Mise à jour loi de finances 2025'),
  ('GROUPE',  'Formation Forvis Mazars Global 2025',    '2025-05-19','Paris - Forvis Mazars HQ',     '09:00','17:00', 8,'Direction technique',   'Formation internationale annuelle'),
  ('INTRA',   'Power BI & Analyse de données',          '2025-09-15','Salle A - Cabinet',            '09:00','17:00', 8,'Seydou Konaté',         'Formation outils décisionnels'),
  ('INTRA',   'Normes ISA & qualité des audits 2026',   '2026-01-13','Salle A - Cabinet',            '09:00','17:00', 8,'Dr. Issouf Sawadogo',  'Actualisation ISA 2026'),
  ('AOC',     'Séminaire fiscal AOC 2026',              '2026-02-18','Dakar, Sénégal',               '08:30','17:30', 9,'Expert CREDAF',         'Fiscalité internationale AOC'),
  ('INTERNE', 'Cybersécurité & protection des données', '2026-03-04','Ouagadougou - Hôtel Azalaï',  '09:00','17:00', 8,'Expert CISA',           'Sensibilisation RGPD & ISO 27001'),
  ('INTRA',   'Excellence opérationnelle & Lean',       '2026-03-25','Salle B - Cabinet',            '09:00','13:00', 4,'Chantal Zongo',         'Optimisation des processus internes');

-- ============================================================
-- 10. PARTICIPANTS AUX FORMATIONS (2024 + 2025 + 2026)
-- ============================================================
INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Normes IFRS 2024'
  AND e.matricule IN ('MAT-2019-001','MAT-2020-002','MAT-2022-005','MAT-2023-008','MAT-2018-015','MAT-2016-009')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Leadership et Management'
  AND e.matricule IN ('MAT-2018-004','MAT-2017-006','MAT-2018-015','MAT-2016-009','MAT-2019-012')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Fiscalité internationale'
  AND e.matricule IN ('MAT-2021-003','MAT-2022-011','MAT-2018-004','MAT-2016-009')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Excel Avancé & Power BI'
  AND e.matricule IN ('MAT-2020-007','MAT-2019-012','MAT-2020-002','MAT-2021-010','MAT-2022-005','MAT-2023-008','MAT-2023-013')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Audit Qualité ISO'
  AND e.matricule IN ('MAT-2016-009','MAT-2018-015','MAT-2017-006','MAT-2018-004','MAT-2019-001')
ON CONFLICT (training_id, employee_id) DO NOTHING;

-- 2025
INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Audit des risques & contrôle interne'
  AND e.matricule IN ('MAT-2019-001','MAT-2020-002','MAT-2018-015','MAT-2022-005','MAT-2023-008','MAT-2023-013','MAT-2020-014')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Conférence IFRS AOC 2025'
  AND e.matricule IN ('MAT-2016-009','MAT-2018-015','MAT-2019-001','MAT-2018-004')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Management et leadership avancé'
  AND e.matricule IN ('MAT-2018-004','MAT-2017-006','MAT-2018-015','MAT-2016-009','MAT-2019-012','MAT-2022-011')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Fiscalité des sociétés BF 2025'
  AND e.matricule IN ('MAT-2021-003','MAT-2022-011','MAT-2018-004','MAT-2021-010')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Formation Forvis Mazars Global 2025'
  AND e.matricule IN ('MAT-2016-009','MAT-2018-015','MAT-2017-006','MAT-2018-004')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Power BI & Analyse de données'
  AND e.matricule IN ('MAT-2020-007','MAT-2019-012','MAT-2020-002','MAT-2021-010','MAT-2019-001')
ON CONFLICT (training_id, employee_id) DO NOTHING;

-- 2026
INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Normes ISA & qualité des audits 2026'
  AND e.matricule IN ('MAT-2019-001','MAT-2020-002','MAT-2018-015','MAT-2022-005','MAT-2023-013','MAT-2020-014')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Séminaire fiscal AOC 2026'
  AND e.matricule IN ('MAT-2021-003','MAT-2022-011','MAT-2016-009','MAT-2018-004')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Cybersécurité & protection des données'
  AND e.matricule IN ('MAT-2020-007','MAT-2019-012','MAT-2018-015','MAT-2016-009','MAT-2017-006','MAT-2018-004','MAT-2021-010')
ON CONFLICT (training_id, employee_id) DO NOTHING;

INSERT INTO training_participants (training_id, employee_id)
SELECT t.id, e.id FROM trainings t, employees e
WHERE t.title = 'Excellence opérationnelle & Lean'
  AND e.matricule IN ('MAT-2017-006','MAT-2019-012','MAT-2018-004','MAT-2016-009','MAT-2022-011')
ON CONFLICT (training_id, employee_id) DO NOTHING;

-- ============================================================
-- 11. DIPLÔMES PROFESSIONNELS (KPI section diplômes)
-- ============================================================
INSERT INTO employee_diplomas (employee_id, diploma_type, domaine, created_by)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'CISA',  'Systèmes d''information','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2016-009'),'CFA',   'Finance & Investissement','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'CISA',  'Audit SI','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'DECOFI','Expertise comptable','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'DECOFI','Expertise comptable','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'DEC',   'Expertise juridique et fiscale','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'AUTRES','Droit des affaires OHADA','a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 12. MOBILITÉS INTERNES (KPI section mobilités)
-- ============================================================
INSERT INTO internal_mobilities (employee_id, mobility_type, from_value, to_value, effective_date, notes, created_by)
VALUES
  ((SELECT id FROM employees WHERE matricule='MAT-2019-001'),'GRADE_CHANGE',  'SENIOR_1',           'SENIOR_2',          '2023-09-01','Promotion suite à évaluation exceptionnelle','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-002'),'GRADE_CHANGE',  'ASSISTANT_DEBUTANT', 'JUNIOR',            '2024-10-01','Fin de période probatoire concluante','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-004'),'GRADE_CHANGE',  'ASSISTANT_MANAGER_1','ASSISTANT_MANAGER_2','2023-03-01','Promotion — très bonne performance','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2022-011'),'GRADE_CHANGE',  'ASSISTANT_CONFIRME', 'SENIOR_1',          '2022-09-01','Passage confirmé au grade Senior','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2021-003'),'SERVICE_LINE_CHANGE','AUDIT_ASSURANCE','JURIDIQUE_FISCALITE','2021-01-15','Affectation au département Tax & Legal','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2020-014'),'FUNCTION_CHANGE','AUDITEUR',          'AUDITEUR',          '2025-01-01','Transfert vers l''équipe Outsourcing','a0000001-0000-0000-0000-000000000001'),
  ((SELECT id FROM employees WHERE matricule='MAT-2018-015'),'GRADE_CHANGE',  'SENIOR_MANAGER_2',   'SENIOR_MANAGER_1',  '2025-09-01','Promotion — encadrement équipe audit','a0000001-0000-0000-0000-000000000001');

-- ============================================================
-- 13. OBJECTIFS KPI 2025 & 2026
-- ============================================================
INSERT INTO kpi_targets (year, indicator_key, target_value, description) VALUES
  (2025,'TRAINING_BUDGET', 200000,'Budget formation 2025 en FCFA'),
  (2025,'TRAINING_HOURS',  250,   'Total heures de formation 2025'),
  (2025,'HEADCOUNT',        55,   'Effectif cible 2025'),
  (2025,'TURNOVER_RATE',    12,   'Taux de turnover cible 2025 (%)'),
  (2025,'ATTRITION_RATE',    8,   'Taux d''attrition cible 2025 (%)')
ON CONFLICT (year, indicator_key) DO NOTHING;

INSERT INTO kpi_targets (year, indicator_key, target_value, description) VALUES
  (2026,'TRAINING_BUDGET', 220000,'Budget formation 2026 en FCFA'),
  (2026,'TRAINING_HOURS',  280,   'Total heures de formation 2026'),
  (2026,'HEADCOUNT',        60,   'Effectif cible 2026'),
  (2026,'TURNOVER_RATE',    10,   'Taux de turnover cible 2026 (%)'),
  (2026,'ATTRITION_RATE',    7,   'Taux d''attrition cible 2026 (%)')
ON CONFLICT (year, indicator_key) DO NOTHING;
