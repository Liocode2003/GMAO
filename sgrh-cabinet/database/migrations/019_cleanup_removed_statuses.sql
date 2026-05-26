-- Migration des statuts supprimés vers leurs équivalents valides
-- Recrutement : EN_COURS → NOUVEAU (candidats en attente de traitement)
UPDATE candidates SET status = 'NOUVEAU' WHERE status = 'EN_COURS';

-- Évaluations : BROUILLON → EN_COURS (une évaluation créée est déjà en cours)
UPDATE evaluations SET status = 'EN_COURS' WHERE status = 'BROUILLON';

-- Évaluations : PROBATOIRE (période) → ANNUEL (période la plus proche)
UPDATE evaluations SET period = 'ANNUEL' WHERE period = 'PROBATOIRE';
