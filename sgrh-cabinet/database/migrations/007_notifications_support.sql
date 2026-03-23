-- Migration 007 : Support des notifications et améliorations sécurité
-- Date : 2026-03-23

-- Index pour accélérer les requêtes de notifications (anniversaires, fins de contrat)
CREATE INDEX IF NOT EXISTS idx_employees_birth_date_month
  ON employees (TO_CHAR(birth_date, 'MM-DD'));

CREATE INDEX IF NOT EXISTS idx_employees_exit_date_contract
  ON employees (exit_date, contract_type)
  WHERE exit_date IS NOT NULL AND contract_type IN ('CDD', 'STAGE');

-- Nettoyage automatique des refresh tokens expirés (via cron côté app)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
  ON refresh_tokens (expires_at)
  WHERE expires_at < NOW();

-- Table schema_migrations (créée dynamiquement par le runner si absente)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
