-- Migration 014 — Réinitialisation des comptes utilisateurs
-- Seuls deux comptes : DRH (lecture/écriture) et ADG (lecture seule)
-- DRH : drh@forvismazars.com  / drh2026
-- ADG : adg@forvismazars.com  / adg2026

-- Nullifier les FK avant suppression
UPDATE employees      SET created_by = NULL;
UPDATE leaves         SET approved_by = NULL, created_by = NULL;
UPDATE salary_history SET changed_by = NULL;
DELETE FROM audit_logs;
DELETE FROM users;

-- Compte DRH
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  'drh@forvismazars.com',
  '$2a$12$B1fARKWKQgss8VJm20pmrexZiygAoTn3vkyRWCgH50dUYiXLsJ.nm',
  'DRH',
  'Forvis Mazars',
  'DRH',
  true
);

-- Compte ADG
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'a0000002-0000-0000-0000-000000000002',
  'adg@forvismazars.com',
  '$2a$12$Z8lliNNusJcjomI2ZwJGCeccBvyFXV006WeGClrsEwtbRM74LPqVy',
  'ADG',
  'Forvis Mazars',
  'DIRECTION_GENERALE',
  true
);
