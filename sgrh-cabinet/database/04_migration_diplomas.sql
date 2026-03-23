-- ============================================================
-- SGRH Cabinet - Migration v4 : Diplômes professionnels
-- Remplacement des colonnes booléennes par une table dédiée
-- ============================================================

-- ============================================================
-- 1. NOUVELLE TABLE employee_diplomas
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

-- ============================================================
-- 2. MIGRATION DES DONNÉES BOOLÉENNES EXISTANTES
-- ============================================================

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'DEC' FROM employees WHERE has_dec_french = true;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'DECOFI' FROM employees WHERE has_decofi = true;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'AUTRES' FROM employees WHERE has_other_dec = true;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'CISA' FROM employees WHERE has_cisa = true;

INSERT INTO employee_diplomas (employee_id, diploma_type)
SELECT id, 'CFA' FROM employees WHERE has_cfa = true;
