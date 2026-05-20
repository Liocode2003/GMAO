-- Réinitialisation des utilisateurs — seuls DRH et ADG autorisés
-- DRH  : drh@forvismazars.com  / drh2026
-- ADG  : adg@forvismazars.com  / adg2026

-- Supprimer tous les autres utilisateurs (nullifier les FK d'abord)
UPDATE employees       SET created_by = NULL WHERE created_by NOT IN (
  'a0000001-0000-0000-0000-000000000001',
  'a0000002-0000-0000-0000-000000000002'
);
UPDATE leaves          SET approved_by = NULL, created_by = NULL WHERE approved_by NOT IN (
  'a0000001-0000-0000-0000-000000000001',
  'a0000002-0000-0000-0000-000000000002'
) OR created_by NOT IN (
  'a0000001-0000-0000-0000-000000000001',
  'a0000002-0000-0000-0000-000000000002'
);
-- colonne changed_by supprimée de salary_history (n'existe plus dans le schéma actuel)
-- UPDATE salary_history  SET changed_by = NULL WHERE changed_by NOT IN (
--   'a0000001-0000-0000-0000-000000000001',
--   'a0000002-0000-0000-0000-000000000002'
-- );
DELETE FROM audit_logs WHERE user_id NOT IN (
  'a0000001-0000-0000-0000-000000000001',
  'a0000002-0000-0000-0000-000000000002'
);
DELETE FROM users WHERE id NOT IN (
  'a0000001-0000-0000-0000-000000000001',
  'a0000002-0000-0000-0000-000000000002'
);

-- Upsert compte DRH
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  'drh@forvismazars.com',
  '$2a$12$B1fARKWKQgss8VJm20pmrexZiygAoTn3vkyRWCgH50dUYiXLsJ.nm',
  'DRH',
  'Forvis Mazars',
  'DRH',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  role          = EXCLUDED.role,
  is_active     = EXCLUDED.is_active;

-- Upsert compte ADG (Direction Générale — lecture seule)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'a0000002-0000-0000-0000-000000000002',
  'adg@forvismazars.com',
  '$2a$12$Z8lliNNusJcjomI2ZwJGCeccBvyFXV006WeGClrsEwtbRM74LPqVy',
  'ADG',
  'Forvis Mazars',
  'DIRECTION_GENERALE',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  role          = EXCLUDED.role,
  is_active     = EXCLUDED.is_active;
