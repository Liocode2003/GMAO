-- Ajout du titre de poste libre (pour les rapports RH)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_title VARCHAR(150);

-- Titres spécifiques qui diffèrent du libellé de grade standard
UPDATE employees SET position_title = 'Assistant Manager'             WHERE matricule = 'FM-001';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'FM-003';
UPDATE employees SET position_title = 'Chauffeur'                     WHERE matricule = 'FM-006';
UPDATE employees SET position_title = 'Assistant Manager'             WHERE matricule = 'FM-009';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'FM-012';
UPDATE employees SET position_title = 'Chauffeur'                     WHERE matricule = 'FM-014';
UPDATE employees SET position_title = 'Assistante de Direction'       WHERE matricule = 'FM-020';
UPDATE employees SET position_title = 'Secrétaire'                    WHERE matricule = 'FM-025';
UPDATE employees SET position_title = 'Assistant Manager'             WHERE matricule = 'FM-033';
UPDATE employees SET position_title = 'Assistant Manager'             WHERE matricule = 'FM-050';
UPDATE employees SET position_title = 'Directrice de l''Administration' WHERE matricule = 'FM-037';
UPDATE employees SET position_title = 'RAF'                           WHERE matricule = 'FM-045';
UPDATE employees SET position_title = 'Assistant Manager'             WHERE matricule = 'FM-039';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'CONS-001';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'CONS-002';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'CONS-003';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'CONS-004';
UPDATE employees SET position_title = 'Assistant consultant'          WHERE matricule = 'CONS-005';

-- Correction motif de départ BELEM Djibril (démission pour préparation mémoire → Autres)
UPDATE employees SET departure_reason = 'AUTRES' WHERE matricule = 'FM-046';

-- Correction motif TRAORE Nafissatou (partie en formation fonction publique → Nouvelles opportunités)
UPDATE employees SET departure_reason = 'NOUVELLES_OPPORTUNITES' WHERE matricule = 'FM-051';

-- Champ type de départ (Volontaire / Involontaire) — indépendant du motif
ALTER TABLE employees ADD COLUMN IF NOT EXISTS departure_type VARCHAR(20);

-- AUTRES peut être volontaire (BELEM : démission) ou involontaire (DOUAMBA : fin de contrat)
-- Tous les autres motifs nommés sont volontaires
UPDATE employees SET departure_type = 'VOLONTAIRE'
  WHERE departure_reason IN ('NOUVELLES_OPPORTUNITES','RAISONS_PERSONNELLES','REMUNERATION','MANAGEMENT')
    AND exit_date IS NOT NULL;

UPDATE employees SET departure_type = 'INVOLONTAIRE'
  WHERE departure_reason = 'AUTRES' AND exit_date IS NOT NULL;

-- Override BELEM Djibril : démission volontaire même si motif = Autres
UPDATE employees SET departure_type = 'VOLONTAIRE' WHERE matricule = 'FM-046';
