-- ============================================================
-- MODULE BULLETINS DE PAIE
-- ============================================================

CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  -- Éléments de rémunération brute
  base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  transport_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
  meal_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
  overtime_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
  prime_label VARCHAR(100),
  prime_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  other_earnings_label VARCHAR(100),
  other_earnings_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Brut total
  gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Cotisations salariales
  cnss_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
  amo_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
  cimr_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  cimr_employee DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- IGR
  professional_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_taxable_monthly DECIMAL(12,2) NOT NULL DEFAULT 0,
  family_charges INT NOT NULL DEFAULT 0,
  family_charge_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  igr DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Retenues supplémentaires
  advance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  other_deduction_label VARCHAR(100),
  other_deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Net
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Cotisations patronales (informatif)
  cnss_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
  amo_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
  cimr_employer DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Cumuls annuels
  annual_gross_ytd DECIMAL(12,2) NOT NULL DEFAULT 0,
  annual_net_ytd DECIMAL(12,2) NOT NULL DEFAULT 0,
  annual_igr_ytd DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
    CHECK (status IN ('BROUILLON', 'PUBLIE')),
  pdf_path VARCHAR(500),

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT payslips_unique_period UNIQUE (employee_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- update_updated_at() est définie dans init.sql (pas update_updated_at_column)
CREATE TRIGGER update_payslips_updated_at
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
