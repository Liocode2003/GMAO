-- ============================================================
-- SGRH Cabinet - Migration v2
-- Enrichissement collaborateurs, historique salaires, congés
-- ============================================================

-- ============================================================
-- 1. NOUVEAUX CHAMPS SUR LA TABLE EMPLOYEES
-- ============================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS photo_url       VARCHAR(500),
  ADD COLUMN IF NOT EXISTS manager_id      UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS marital_status  VARCHAR(20) DEFAULT 'CELIBATAIRE',
  ADD COLUMN IF NOT EXISTS spouse_name     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS spouse_phone    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS children_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_balance   DECIMAL(5,2) DEFAULT 0;

-- ============================================================
-- 2. TABLE HISTORIQUE DES SALAIRES
-- ============================================================

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

-- ============================================================
-- 3. TABLE CONGÉS (pour développement futur)
-- ============================================================

CREATE TABLE IF NOT EXISTS leaves (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL DEFAULT 'ANNUEL',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         INTEGER,
  status       VARCHAR(20) DEFAULT 'PENDING',
  notes        TEXT,
  approved_by  UUID REFERENCES users(id),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

-- ============================================================
-- 4. TRIGGER: STATUT AUTOMATIQUE BASÉ SUR LA DATE DE SORTIE
-- ============================================================

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

-- ============================================================
-- 5. MISE À JOUR DU STATUT DES COLLABORATEURS EXISTANTS
-- ============================================================

UPDATE employees
SET status = CASE
  WHEN exit_date IS NULL OR exit_date > CURRENT_DATE THEN 'ACTIF'::employee_status
  ELSE 'INACTIF'::employee_status
END;

-- ============================================================
-- 6. INITIALISER L'HISTORIQUE DES SALAIRES DEPUIS LES DONNÉES EXISTANTES
-- ============================================================

INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes)
SELECT id, NULL, salary, entry_date, 'Salaire initial (migration)'
FROM employees
WHERE salary IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. METTRE À JOUR LE TRIGGER HISTORIQUE POUR INCLURE LES NOUVEAUX CHAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'first_name','last_name','gender','email','phone','function',
    'service_line','grade','contract_type','entry_date','exit_date','salary','status',
    'department','is_expatriate','marital_status','spouse_name','spouse_phone',
    'children_count','manager_id'
  ] LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO new_val USING NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO employee_history(employee_id, field_name, old_value, new_value)
      VALUES (NEW.id, col, old_val, new_val);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
