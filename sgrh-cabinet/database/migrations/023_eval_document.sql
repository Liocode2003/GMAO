-- Migration 023: champ document sur les évaluations
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS document_path VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_mime VARCHAR(100);
