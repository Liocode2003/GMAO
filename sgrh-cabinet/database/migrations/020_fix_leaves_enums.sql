-- Migration 020 : conversion des colonnes VARCHAR de la table leaves en types ENUM
-- Avant cette migration, type et status étaient des VARCHAR libres,
-- ce qui permettait des valeurs incohérentes contrairement au reste du schéma.

CREATE TYPE leave_type   AS ENUM ('PLANIFIE', 'IMPRÉVU');
CREATE TYPE leave_status AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REFUSE');

-- Normaliser les valeurs existantes avant la conversion
UPDATE leaves SET type   = 'PLANIFIE'   WHERE type   NOT IN ('PLANIFIE', 'IMPRÉVU');
UPDATE leaves SET status = 'EN_ATTENTE' WHERE status NOT IN ('EN_ATTENTE', 'APPROUVE', 'REFUSE');

ALTER TABLE leaves
  ALTER COLUMN type   TYPE leave_type   USING type::leave_type,
  ALTER COLUMN status TYPE leave_status USING status::leave_status;

-- Mettre à jour la valeur par défaut
ALTER TABLE leaves
  ALTER COLUMN type   SET DEFAULT 'PLANIFIE',
  ALTER COLUMN status SET DEFAULT 'EN_ATTENTE';
