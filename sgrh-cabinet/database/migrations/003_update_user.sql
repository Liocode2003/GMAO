-- Mise à jour des identifiants de connexion DRH
UPDATE users
SET
  email         = 'catherine.sawadogo@forvismazars.com',
  password_hash = '$2b$12$dWw5u.dV2a6czJU.jPpcCuCeB336clLZMcXiw27SUcJEgBjFuEeXK',
  first_name    = 'Catherine',
  last_name     = 'Sawadogo'
WHERE id = 'a0000001-0000-0000-0000-000000000001';
