-- Migration 017 : Suppression du champ department
-- Le champ département est redondant avec service_line (ligne de service)
ALTER TABLE employees DROP COLUMN IF EXISTS department;
ALTER TABLE candidates DROP COLUMN IF EXISTS department;
