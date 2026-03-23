-- ============================================================
-- Migration : Module Reporting Commercial (AMI & Appels d'offre)
-- ============================================================

CREATE TYPE submission_type AS ENUM ('AMI', 'APPEL_OFFRE');
CREATE TYPE submission_status AS ENUM ('EN_COURS', 'GAGNE', 'PERDU');

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
  -- Champs obligatoires si statut = GAGNE
  contract_amount         DECIMAL(15,2),
  contract_start_date     DATE,
  contract_end_date       DATE,
  -- Traçabilité
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_type            ON commercial_submissions(type);
CREATE INDEX IF NOT EXISTS idx_cs_status          ON commercial_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cs_service_line    ON commercial_submissions(service_line);
CREATE INDEX IF NOT EXISTS idx_cs_submission_date ON commercial_submissions(submission_date);

CREATE TRIGGER update_commercial_submissions_updated_at
  BEFORE UPDATE ON commercial_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
