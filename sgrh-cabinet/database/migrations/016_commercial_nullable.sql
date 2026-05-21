-- Migration 016 — Rendre reference et service_line nullables dans commercial_submissions
-- La colonne reference n'est pas toujours fournie (soumissions sans référence officielle)
-- La colonne service_line peut être déterminée ultérieurement
ALTER TABLE commercial_submissions
  ALTER COLUMN reference   DROP NOT NULL,
  ALTER COLUMN service_line DROP NOT NULL;
