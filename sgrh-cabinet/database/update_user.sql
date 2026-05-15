-- Mise à jour des identifiants de connexion DRH
-- Mot de passe : Mazars2025!
UPDATE users
SET
  email         = 'catherine.sawadogo@forvismazars.com',
  password_hash = '$2a$12$HDRDnIHuC0SlfX/rD2zhyOof9nohTt93P/ZwRF649LOzwdQs40x7.',
  first_name    = 'Catherine',
  last_name     = 'Sawadogo'
WHERE id = 'a0000001-0000-0000-0000-000000000001';
