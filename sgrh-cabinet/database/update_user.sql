-- Compte administrateur DRH — créé ou mis à jour au démarrage
-- Mot de passe : Mazars2025!
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  'catherine.sawadogo@forvismazars.com',
  '$2a$12$HDRDnIHuC0SlfX/rD2zhyOof9nohTt93P/ZwRF649LOzwdQs40x7.',
  'Catherine',
  'Sawadogo',
  'DRH',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email         = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name;
