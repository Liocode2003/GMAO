CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  period VARCHAR(20) DEFAULT 'ANNUEL', -- ANNUEL, MI_ANNUEL, PROBATOIRE
  status VARCHAR(20) DEFAULT 'BROUILLON', -- BROUILLON, EN_COURS, TERMINE
  overall_score DECIMAL(4,2), -- 0-20
  objectives_score DECIMAL(4,2),
  skills_score DECIMAL(4,2),
  behavior_score DECIMAL(4,2),
  comments TEXT,
  objectives TEXT, -- JSON array of objectives
  strengths TEXT,
  improvements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year, period)
);
CREATE INDEX idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX idx_evaluations_year ON evaluations(year);
CREATE TRIGGER trg_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
