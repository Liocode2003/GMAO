-- ================================================================
-- DONNÉES RÉELLES - FORVIS MAZARS BURKINA FASO - 2026
-- Source : Liste du personnel mise à jour
-- ================================================================

BEGIN;

-- 1. Supprimer toutes les données liées aux employés (CASCADE)
TRUNCATE TABLE
  training_participants,
  salary_history,
  employee_documents,
  evaluations,
  leaves,
  alerts,
  candidates,
  commercial_submissions,
  audit_logs,
  employees
RESTART IDENTITY CASCADE;

-- 2. Supprimer formations
TRUNCATE TABLE trainings RESTART IDENTITY CASCADE;

-- 3. Insérer les 56 employés réels
INSERT INTO employees (
  id, matricule, first_name, last_name, gender, email,
  grade, service_line, function, contract_type, entry_date,
  birth_date, status, leave_balance, exit_date, departure_reason, created_at, updated_at
) VALUES
  ('eae9d8bf-4b20-4950-a68d-6bf59a75e600', 'FM-001', 'Abdallah Aziz Mohamed', 'BAMBARA', 'M'::"gender", 'abdallah.bambara@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-05-01',
   '1985-01-17', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('f5d8a290-3197-4c29-a3ee-b8a8618f3bb2', 'FM-002', 'Abdoul Hady', 'BANCE', 'M'::"gender", 'abdoul.bance@forvismazars.com',
   'SENIOR_2'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2020-01-10',
   '1998-09-01', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('bcd1a32a-4b83-484c-a3d8-93aa4647734f', 'FM-003', 'Ludovic', 'BANSSE', 'M'::"gender", 'ludovic.bansse@forvismazars.com',
   'CONSULTANT'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-03-17',
   '2000-03-13', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('b981af9a-63ce-4814-990a-f6079a30f2aa', 'FM-004', 'Djibril', 'BAYALA', 'M'::"gender", 'djibril.bayala@forvismazars.com',
   'SENIOR_MANAGER_1'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-01-10',
   '1988-12-31', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000046-0000-4000-8000-000000000000', 'FM-046', 'Djibril', 'BELEM', 'M'::"gender", 'djibril.belem@forvismazars.com',
   'SENIOR_1'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2024-03-01',
   '1988-03-18', 'INACTIF'::"employee_status", 0, '2025-03-17', 'RAISONS_PERSONNELLES', NOW(), NOW()),

  ('a689a7c3-a1f4-42e7-b646-558154efbd37', 'FM-005', 'Kalifa', 'BELEM', 'M'::"gender", 'kalifa.belem@forvismazars.com',
   'ASSISTANT_MANAGER_2'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-03-01',
   '1985-04-18', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('fb6870e9-389c-490d-9a8c-f65edbe18e00', 'FM-006', 'Gervais', 'BOURGOU', 'M'::"gender", 'gervais.bourgou@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'ADMINISTRATION'::"service_line", 'CHAUFFEUR'::"employee_function", 'CDI'::"contract_type", '2009-03-13',
   '1967-12-12', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('8ac6a425-564e-421b-803d-0ec8eff6d4f1', 'FM-007', 'Fabienne Théodora', 'COMPAORE', 'F'::"gender", 'fabienne.compaore@forvismazars.com',
   'SENIOR_1'::"grade", 'JURIDIQUE_FISCALITE'::"service_line", 'JURISTE_FISCALISTE'::"employee_function", 'CDI'::"contract_type", '2021-03-22',
   '1989-05-14', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('fa07f8e1-cae0-41b4-b3ba-dc18212d3eb8', 'FM-008', 'Arnaud', 'DARGA', 'M'::"gender", 'arnaud.darga@forvismazars.com',
   'ASSISTANT_MANAGER_3'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2011-10-01',
   '1984-08-24', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000047-0000-4000-8000-000000000000', 'FM-047', 'Aïssetou', 'DIALLO/BALDE', 'F'::"gender", 'aissetou.diallobile@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2024-03-11',
   '1989-10-14', 'INACTIF'::"employee_status", 0, '2025-06-30', 'RAISONS_PERSONNELLES', NOW(), NOW()),

  ('7f000048-0000-4000-8000-000000000000', 'FM-048', 'Fatimata', 'DOUAMBA/NANA', 'F'::"gender", 'fatimata.douambanana@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-11-01',
   '1995-06-04', 'INACTIF'::"employee_status", 0, '2025-11-01', 'AUTRES', NOW(), NOW()),

  ('f3a214e0-69c3-4dca-8892-a13ec01efc47', 'FM-009', 'Sidi Ibrahim', 'DIARRA BREHIMA', 'M'::"gender", 'sidi.diarrabrehima@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-01-12',
   '1992-01-13', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('fec5f2fd-fff6-4890-b6dc-92602c29289b', 'FM-010', 'Wendyam', 'DIBGOLONGO', 'F'::"gender", 'wendyam.dibgolongo@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-03-11',
   '1998-09-16', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('cac390bd-db49-4cdb-89ca-7d5174178e0b', 'FM-011', 'Zoenabo', 'DIPAMA', 'F'::"gender", 'zoenabo.dipama@forvismazars.com',
   'CONSULTANT'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2026-04-01',
   '1997-12-31', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('6cf4d540-9e45-4b56-8e4f-bfcae6da1a04', 'FM-012', 'Yaya', 'GUINDO', 'M'::"gender", 'yaya.guindo@forvismazars.com',
   'CONSULTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-08-11',
   '1992-02-26', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('e1f7adc8-ce67-4a0f-8810-9f5e165308df', 'FM-013', 'Arsène', 'KABORE', 'M'::"gender", 'arsene.kabore@forvismazars.com',
   'SENIOR_1'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-05-02',
   '1996-05-07', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('20c83e92-0e30-474a-831f-1871d8f63731', 'FM-014', 'Noraogo', 'KABRE', 'M'::"gender", 'noraogo.kabre@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'ADMINISTRATION'::"service_line", 'CHAUFFEUR'::"employee_function", 'CDI'::"contract_type", '2019-06-01',
   '1981-07-13', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('0a319971-1084-4029-812f-8c25bacced55', 'FM-015', 'Aboubacar', 'KADIO', 'M'::"gender", 'aboubacar.kadio@forvismazars.com',
   'SENIOR_2'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2020-06-15',
   '1998-06-23', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('d9fcdb37-287d-4aa4-a837-152334c4c3ab', 'FM-016', 'Sié Gaël Lionel', 'KAM', 'M'::"gender", 'sie.kam@forvismazars.com',
   'SENIOR_3'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2021-01-02',
   '1996-02-14', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('0934abd4-7be5-4767-a3c9-134b68890a24', 'FM-017', 'Asmao', 'KARA/KOURAOGO', 'F'::"gender", 'asmao.karakouraogo@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2021-02-15',
   '1989-10-22', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('b1ebd671-cefe-409c-b60f-58ff69a4c541', 'FM-018', 'Eric Arnaud Zângbêwendé', 'KINDA', 'M'::"gender", 'eric.kinda@forvismazars.com',
   'ASSOCIE'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'ASSOCIE'::"employee_function", 'CDI'::"contract_type", '2016-11-01',
   '1988-02-07', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('f74b6dc7-ddff-49ba-aeba-087c9c6ac161', 'FM-019', 'Lionel', 'KONATE', 'M'::"gender", 'lionel.konate@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-10-10',
   '1998-01-01', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('9458ca32-a723-4faa-ab58-bfc14fb7f4c0', 'FM-020', 'Relwendé Alida', 'KONDOMBO', 'F'::"gender", 'relwende.kondombo@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'ADMINISTRATION'::"service_line", 'ASSISTANT_DIRECTION'::"employee_function", 'CDI'::"contract_type", '2018-02-05',
   '1993-12-19', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('068a9674-5b27-461c-ab0f-ff4db8f516f4', 'FM-021', 'Shayma Se Amal', 'KONE', 'F'::"gender", 'shayma.kone@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-05-03',
   '2001-07-30', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('19239447-8f42-4512-92b1-cde30d8677ab', 'FM-022', 'Rasmané', 'KOUDOUGOU', 'M'::"gender", 'rasmane.koudougou@forvismazars.com',
   'SENIOR_1'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2024-09-01',
   '1987-03-29', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('db254baf-ffb8-43e5-938b-fa9059788856', 'FM-023', 'Fati', 'MAÏGA/ILBOUDO', 'F'::"gender", 'fati.maigailboudo@forvismazars.com',
   'ASSISTANT_MANAGER_3'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2009-12-15',
   '1979-06-04', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('589ef44d-7395-4f84-a0b0-260ec5c36afe', 'FM-024', 'Mercia Sevora', 'NGOUEMBE NGALA', 'F'::"gender", 'mercia.ngouembengala@forvismazars.com',
   'CONSULTANT'::"grade", 'CONSULTING_FA'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2026-02-23',
   '1996-01-10', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('ab1e9ac7-612a-4d54-9272-e3db401f6109', 'FM-025', 'Gaël Larissa', 'NIKIEMA', 'F'::"gender", 'gael.nikiema@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'ADMINISTRATION'::"service_line", 'SECRETAIRE'::"employee_function", 'CDI'::"contract_type", '2017-07-11',
   '1990-12-01', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('88dc1fba-50a7-4707-926d-69871cb44665', 'FM-026', 'Mouna Chadya', 'NIKIEMA', 'F'::"gender", 'mouna.nikiema@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-02-14',
   '1997-04-22', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('50b657a8-e27f-482e-84b2-1b4abbd57c84', 'FM-027', 'Amidou', 'OUEDRAOGO', 'M'::"gender", 'amidou.ouedraogo@forvismazars.com',
   'ASSOCIE'::"grade", 'CONSULTING_FA'::"service_line", 'ASSOCIE'::"employee_function", 'CDI'::"contract_type", '2016-11-02',
   '1972-08-28', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('42d953ac-bdd2-426c-885b-9a9bf5257746', 'FM-028', 'Assami', 'OUEDRAOGO', 'M'::"gender", 'assami.ouedraogo@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2014-02-06',
   '1991-06-29', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('fc122994-8c07-46e8-ab12-7471f35c9665', 'FM-029', 'Azèra', 'OUEDRAOGO', 'F'::"gender", 'azera.ouedraogo@forvismazars.com',
   'ASSISTANT_CONFIRME'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-03-05',
   '1999-10-01', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('250bd9bf-80ca-485e-a417-8782805779d2', 'FM-030', 'Dalila', 'ILBOUDO/OUEDRAOGO', 'F'::"gender", 'dalila.ilboudoouedraogo@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2022-02-11',
   '1995-09-26', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('0ce23c14-8a91-4f02-8a69-ea409b66d204', 'FM-031', 'Hamadé', 'OUEDRAOGO', 'M'::"gender", 'hamade.ouedraogo@forvismazars.com',
   'ASSOCIE'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'ASSOCIE'::"employee_function", 'CDI'::"contract_type", '2009-04-09',
   '1972-04-25', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('e486d0de-c936-4040-8a91-cd995928bbbe', 'FM-032', 'Neimata', 'OUEDRAOGO', 'F'::"gender", 'neimata.ouedraogo@forvismazars.com',
   'SENIOR_2'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-04-17',
   '1994-06-28', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('1450c3e0-5682-4c3d-83c4-4b4a13f29366', 'FM-033', 'O. Mamounata', 'OUEDRAOGO', 'F'::"gender", 'o.ouedraogo@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2017-05-04',
   '1980-07-08', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000049-0000-4000-8000-000000000000', 'FM-049', 'Soufiane', 'OUEDRAOGO', 'M'::"gender", 'soufiane.ouedraogo@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2024-08-31',
   '1997-06-13', 'INACTIF'::"employee_status", 0, '2026-01-31', 'NOUVELLES_OPPORTUNITES', NOW(), NOW()),

  ('571c2af2-ddac-415e-b05d-802b6167dea0', 'FM-035', 'Stéphanie', 'OUEDRAOGO', 'F'::"gender", 'stephanie.ouedraogo@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-10-02',
   '1995-12-08', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('71ad499c-e1c9-46fe-acc0-af4525cb5494', 'FM-036', 'Inoussa', 'PORGO', 'M'::"gender", 'inoussa.porgo@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2024-08-15',
   '1998-12-31', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('3c49813b-a779-44a2-ae33-dc587ac2a01f', 'FM-037', 'K. Catherine', 'SAWADOGO SOME', 'F'::"gender", 'k.sawadogosome@forvismazars.com',
   'DIRECTEUR'::"grade", 'ADMINISTRATION'::"service_line", 'DIRECTEUR'::"employee_function", 'CDI'::"contract_type", '2022-10-17',
   '1976-03-25', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000050-0000-4000-8000-000000000000', 'FM-050', 'Romaric', 'SOME', 'M'::"gender", 'romaric.some@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'JURIDIQUE_FISCALITE'::"service_line", 'JURISTE_FISCALISTE'::"employee_function", 'CDI'::"contract_type", '2022-12-05',
   '1985-12-31', 'INACTIF'::"employee_status", 0, '2026-01-30', 'NOUVELLES_OPPORTUNITES', NOW(), NOW()),

  ('b9fbca80-5755-4eac-a865-51b2027ffe6e', 'FM-038', 'Elise', 'SERME', 'F'::"gender", 'elise.serme@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2025-10-13',
   '2000-06-20', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('a3454457-bc1f-4be4-9153-369ca3949772', 'FM-039', 'Sandrine', 'SOUNTOURA/SOMA', 'F'::"gender", 'sandrine.sountourasoma@forvismazars.com',
   'ASSISTANT_MANAGER_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2014-01-10',
   '1991-08-08', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('5c95b6cf-d0bc-4c06-8961-8e8f29bc5301', 'FM-040', 'Issa', 'TAPSOBA', 'M'::"gender", 'issa.tapsoba@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-12-01',
   '1995-04-18', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('eb7948d3-9f0d-4f6b-ac97-26a931e829f9', 'FM-041', 'Oumoul Koulsoum', 'TAPSOBA/BELEM', 'F'::"gender", 'oumoul.tapsobabelem@forvismazars.com',
   'ASSISTANT_DEBUTANT'::"grade", 'ADMINISTRATION'::"service_line", 'ASSISTANT_DIRECTION'::"employee_function", 'CDI'::"contract_type", '2022-07-11',
   '1999-04-07', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('32fa4a31-2d72-4b17-8877-e1655db1479b', 'FM-042', 'Elisabeth', 'TIEMTORE', 'F'::"gender", 'elisabeth.tiemtore@forvismazars.com',
   'ASSISTANT_CONFIRME'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2017-04-01',
   '1990-01-01', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000051-0000-4000-8000-000000000000', 'FM-051', 'Nafissatou Lore Liliane', 'TRAORE', 'F'::"gender", 'nafissatou.lore.traore@forvismazars.com',
   'ASSISTANT_CONFIRME'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2020-03-18',
   '1992-12-23', 'INACTIF'::"employee_status", 0, '2025-01-02', 'RAISONS_PERSONNELLES', NOW(), NOW()),

  ('83e730ca-4b1c-42f6-b43c-08130dadde67', 'FM-043', 'T. Salif', 'TRAORE', 'M'::"gender", 't.traore@forvismazars.com',
   'SENIOR_1'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2023-12-18',
   '1996-12-31', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('da82c866-5f8f-45e4-8844-9367fee20e17', 'FM-044', 'Beya Kota Louange Mercia', 'YONABA/NAMSENEI', 'F'::"gender", 'beya.yonabanamsenei@forvismazars.com',
   'ASSISTANT_MANAGER_3'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2014-01-01',
   '1986-07-25', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('7f000052-0000-4000-8000-000000000000', 'FM-052', 'Rasmané', 'ZONGO', 'M'::"gender", 'rasmane.zongo@forvismazars.com',
   'SENIOR_2'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CDI'::"contract_type", '2018-02-01',
   '1991-01-01', 'INACTIF'::"employee_status", 0, '2025-07-31', 'NOUVELLES_OPPORTUNITES', NOW(), NOW()),

  ('d0b17e1a-a266-4eca-9254-c49ea8d755e6', 'FM-045', 'Windinonga Sylvain', 'ZOUNGRANA', 'M'::"gender", 'windinonga.zoungrana@forvismazars.com',
   'DIRECTEUR'::"grade", 'ADMINISTRATION'::"service_line", 'MANAGER_PRINCIPAL'::"employee_function", 'CDI'::"contract_type", '2015-10-15',
   '1979-12-12', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  -- Consultants
  ('9e082756-8011-4a7b-8bfb-ca74c0ce253f', 'CONS-001', 'Djamila', 'KORBEOGO', 'F'::"gender", 'djamila.korbeogo@forvismazars.com',
   'CONSULTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CONSULTANT'::"contract_type", '2024-03-12',
   '1996-09-16', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('6d3b44ec-a790-4f16-ad0d-923870d5a19e', 'CONS-002', 'Andréa Evanne H.', 'SAWADOGO', 'F'::"gender", 'andrea.sawadogo@forvismazars.com',
   'CONSULTANT'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CONSULTANT'::"contract_type", '2025-04-14',
   '2002-11-30', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('395c75a0-804e-42ef-b80e-d0424078772a', 'CONS-003', 'Nafissatou', 'ILBOUDO/TRAORE', 'F'::"gender", 'nafissatou.ilboudotraore@forvismazars.com',
   'CONSULTANT'::"grade", 'OUTSOURCING'::"service_line", 'AUDITEUR'::"employee_function", 'CONSULTANT'::"contract_type", '2020-03-18',
   '1992-12-23', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('c5f2bb51-0c0e-4c36-aa67-3c877fab5c6d', 'CONS-004', 'Aziz', 'SANOGO', 'M'::"gender", 'aziz.sanogo@forvismazars.com',
   'CONSULTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CONSULTANT'::"contract_type", '2026-01-01',
   '2001-07-14', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW()),

  ('50800967-ea50-414a-afa4-0d255854e1bd', 'CONS-005', 'Bénéwendé Dieudonnée', 'SAWADOGO', 'F'::"gender", 'benewende.sawadogo@forvismazars.com',
   'CONSULTANT'::"grade", 'AUDIT_ASSURANCE'::"service_line", 'AUDITEUR'::"employee_function", 'CONSULTANT'::"contract_type", '2026-07-12',
   '2001-11-11', 'ACTIF'::"employee_status", 22.50, NULL, NULL, NOW(), NOW());

-- 4. Vérification
SELECT COUNT(*) as total_employes FROM employees;
SELECT status, COUNT(*) FROM employees GROUP BY status;
SELECT service_line, COUNT(*) FROM employees GROUP BY service_line ORDER BY service_line;

COMMIT;
