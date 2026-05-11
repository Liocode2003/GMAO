CREATE TYPE candidate_status AS ENUM ('NOUVEAU', 'EN_COURS', 'ENTRETIEN', 'OFFRE', 'EMBAUCHE', 'REFUSE');
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  position VARCHAR(150) NOT NULL, -- poste visé
  department VARCHAR(100),
  status candidate_status DEFAULT 'NOUVEAU',
  source VARCHAR(100), -- LinkedIn, Recommandation, Site web...
  cv_path VARCHAR(500),
  cover_letter TEXT,
  notes TEXT,
  interview_date TIMESTAMPTZ,
  salary_expected INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
