-- ============================================================
-- SGRH Cabinet - Patch cumulatif
-- Applique toutes les migrations manquantes de façon idempotente
-- Utiliser si le volume postgres_data existe déjà et que
-- les migrations n'ont pas été jouées.
-- ============================================================

-- ============================================================
-- MIGRATION V2 : Nouveaux champs employees + salary_history
-- ============================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS photo_url       VARCHAR(500),
  ADD COLUMN IF NOT EXISTS manager_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marital_status  VARCHAR(20) DEFAULT 'CELIBATAIRE',
  ADD COLUMN IF NOT EXISTS spouse_name     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS spouse_phone    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS children_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_balance   DECIMAL(5,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS salary_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  old_salary     DECIMAL(15,2),
  new_salary     DECIMAL(15,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_history_employee ON salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_date ON salary_history(effective_date);

CREATE OR REPLACE FUNCTION compute_employee_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.exit_date IS NULL OR NEW.exit_date > CURRENT_DATE THEN
    NEW.status = 'ACTIF';
  ELSE
    NEW.status = 'INACTIF';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employee_auto_status ON employees;
CREATE TRIGGER trg_employee_auto_status
  BEFORE INSERT OR UPDATE OF exit_date ON employees
  FOR EACH ROW EXECUTE FUNCTION compute_employee_status();

UPDATE employees
SET status = CASE
  WHEN exit_date IS NULL OR exit_date > CURRENT_DATE THEN 'ACTIF'::employee_status
  ELSE 'INACTIF'::employee_status
END;

INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes)
SELECT id, NULL, salary, entry_date, 'Salaire initial (migration)'
FROM employees
WHERE salary IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION 003 : Mise à jour utilisateur DRH
-- ============================================================

UPDATE users
SET
  email         = 'catherine.sawadogo@forvismazars.com',
  password_hash = '$2b$12$dWw5u.dV2a6czJU.jPpcCuCeB336clLZMcXiw27SUcJEgBjFuEeXK',
  first_name    = 'Catherine',
  last_name     = 'Sawadogo'
WHERE id = 'a0000001-0000-0000-0000-000000000001';

-- ============================================================
-- MIGRATION 004 : Table employee_diplomas
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_diplomas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  diploma_type VARCHAR(100) NOT NULL,
  diploma_other VARCHAR(200),
  domaine      VARCHAR(100),
  domaine_other VARCHAR(200),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_diplomas_employee ON employee_diplomas(employee_id);

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'DEC' FROM employees WHERE has_dec_french = true
ON CONFLICT DO NOTHING;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'DECOFI' FROM employees WHERE has_decofi = true
ON CONFLICT DO NOTHING;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'AUTRES' FROM employees WHERE has_other_dec = true
ON CONFLICT DO NOTHING;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'CISA' FROM employees WHERE has_cisa = true
ON CONFLICT DO NOTHING;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'CFA' FROM employees WHERE has_cfa = true
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION 005 : Congés - index et vue récapitulative
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leaves_end_date
  ON leaves(end_date)
  WHERE type = 'PLANIFIE' AND status = 'APPROUVE';

CREATE OR REPLACE VIEW v_leave_summary AS
SELECT
  e.id           AS employee_id,
  e.matricule,
  e.first_name,
  e.last_name,
  e.status       AS employee_status,
  lb.year,
  lb.annual_allowance,
  lb.carry_over,
  lb.days_taken,
  lb.days_unpaid,
  lb.balance,
  COALESCE(
    (SELECT SUM(l.days) FROM leaves l
     WHERE l.employee_id = e.id AND l.year = lb.year AND l.type = 'IMPRÉVU'),
    0
  ) AS days_unplanned,
  (SELECT COUNT(*) FROM leaves l
   WHERE l.employee_id = e.id AND l.year = lb.year AND l.status = 'EN_ATTENTE') AS pending_count
FROM employees e
JOIN leave_balances lb ON lb.employee_id = e.id
ORDER BY lb.year DESC, e.last_name;

-- ============================================================
-- MIGRATION 006 : Commercial submissions (si non encore créé)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_type') THEN
    CREATE TYPE submission_type AS ENUM ('AMI', 'APPEL_OFFRE');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE submission_status AS ENUM ('EN_COURS', 'GAGNE', 'PERDU');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS commercial_submissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                    submission_type NOT NULL,
  reference               VARCHAR(100) NOT NULL,
  title                   TEXT NOT NULL,
  client                  VARCHAR(200) NOT NULL,
  submission_date         DATE NOT NULL,
  service_line            service_line NOT NULL,
  responsible_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status                  submission_status NOT NULL DEFAULT 'EN_COURS',
  contract_amount         DECIMAL(15,2),
  contract_start_date     DATE,
  contract_end_date       DATE,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_type            ON commercial_submissions(type);
CREATE INDEX IF NOT EXISTS idx_cs_status          ON commercial_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cs_service_line    ON commercial_submissions(service_line);
CREATE INDEX IF NOT EXISTS idx_cs_submission_date ON commercial_submissions(submission_date);

-- ============================================================
-- MIGRATION 007 : Index notifications / sécurité
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_birth_date_month
  ON employees (TO_CHAR(birth_date, 'MM-DD'));

CREATE INDEX IF NOT EXISTS idx_employees_exit_date_contract
  ON employees (exit_date, contract_type)
  WHERE exit_date IS NOT NULL AND contract_type IN ('CDD', 'STAGE');

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
  ON refresh_tokens (expires_at)
  WHERE expires_at < NOW();

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
