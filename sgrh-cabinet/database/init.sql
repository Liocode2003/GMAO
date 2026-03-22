-- ============================================================
-- SGRH Cabinet - Schéma de base de données PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES DE RÉFÉRENCE
-- ============================================================

CREATE TYPE user_role AS ENUM ('DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER', 'UTILISATEUR');
CREATE TYPE contract_type AS ENUM ('CDI', 'CDD', 'STAGE', 'CONSULTANT', 'FREELANCE');
CREATE TYPE employee_status AS ENUM ('ACTIF', 'INACTIF');
CREATE TYPE gender AS ENUM ('M', 'F');
CREATE TYPE service_line AS ENUM (
  'AUDIT_ASSURANCE',
  'CONSULTING_FA',
  'OUTSOURCING',
  'ADMINISTRATION',
  'JURIDIQUE_FISCALITE'
);
CREATE TYPE employee_function AS ENUM (
  'AUDITEUR',
  'JURISTE_FISCALISTE',
  'INFORMATICIEN',
  'MANAGER_PRINCIPAL',
  'ASSOCIE',
  'DIRECTEUR',
  'ASSISTANT_DIRECTION',
  'SECRETAIRE',
  'CHAUFFEUR'
);
CREATE TYPE grade AS ENUM (
  'ASSISTANT_DEBUTANT',
  'ASSISTANT_CONFIRME',
  'JUNIOR',
  'SENIOR_1',
  'SENIOR_2',
  'SENIOR_3',
  'CONSULTANT',
  'ASSISTANT_MANAGER_1',
  'ASSISTANT_MANAGER_2',
  'ASSISTANT_MANAGER_3',
  'SENIOR_MANAGER_1',
  'SENIOR_MANAGER_2',
  'SENIOR_MANAGER_3',
  'DIRECTEUR',
  'ASSOCIE'
);
CREATE TYPE formation_type AS ENUM ('INTRA', 'INTERNE', 'AOC', 'GROUPE');
CREATE TYPE alert_type AS ENUM ('BIRTHDAY', 'CONTRACT_END', 'CONTRACT_RENEWAL');
CREATE TYPE alert_status AS ENUM ('PENDING', 'SENT', 'DISMISSED');
CREATE TYPE mobility_type AS ENUM ('GRADE_CHANGE', 'SERVICE_LINE_CHANGE', 'FUNCTION_CHANGE');

-- ============================================================
-- UTILISATEURS ET AUTHENTIFICATION
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'UTILISATEUR',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLLABORATEURS
-- ============================================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender gender NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(30),
  birth_date DATE NOT NULL,
  function employee_function NOT NULL,
  service_line service_line NOT NULL,
  grade grade NOT NULL,
  contract_type contract_type NOT NULL,
  entry_date DATE NOT NULL,
  exit_date DATE,
  salary DECIMAL(15,2),
  status employee_status DEFAULT 'ACTIF',
  notes TEXT,
  -- Diplômes professionnels
  has_dec_french BOOLEAN DEFAULT false,
  has_decofi BOOLEAN DEFAULT false,
  has_other_dec BOOLEAN DEFAULT false,
  has_cisa BOOLEAN DEFAULT false,
  has_cfa BOOLEAN DEFAULT false,
  -- Associations
  department VARCHAR(100),
  is_expatriate BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index de performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_service_line ON employees(service_line);
CREATE INDEX idx_employees_contract_type ON employees(contract_type);
CREATE INDEX idx_employees_grade ON employees(grade);
CREATE INDEX idx_employees_entry_date ON employees(entry_date);
CREATE INDEX idx_employees_exit_date ON employees(exit_date);
CREATE INDEX idx_employees_birth_date ON employees(birth_date);

-- ============================================================
-- HISTORIQUE DES MODIFICATIONS
-- ============================================================

CREATE TABLE employee_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_history_employee ON employee_history(employee_id);

-- ============================================================
-- MOBILITÉS INTERNES
-- ============================================================

CREATE TABLE internal_mobilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mobility_type mobility_type NOT NULL,
  from_value VARCHAR(100) NOT NULL,
  to_value VARCHAR(100) NOT NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FORMATIONS
-- ============================================================

CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type formation_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  start_time TIME,
  end_time TIME,
  duration_hours DECIMAL(5,2),
  trainer VARCHAR(255),
  observations TEXT,
  budget DECIMAL(15,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, employee_id)
);

-- ============================================================
-- ALERTES
-- ============================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type alert_type NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status alert_status DEFAULT 'PENDING',
  message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_scheduled_date ON alerts(scheduled_date);
CREATE INDEX idx_alerts_employee ON alerts(employee_id);

-- ============================================================
-- JOURNAL D'AUDIT
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  field_accessed VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- RAPPORTS
-- ============================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  file_path VARCHAR(500),
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TARGETS KPI
-- ============================================================

CREATE TABLE kpi_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  indicator_key VARCHAR(100) NOT NULL,
  target_value DECIMAL(15,2),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, indicator_key)
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trainings_updated_at BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Historique automatique des changements employé
-- ============================================================

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY['first_name','last_name','gender','email','phone','function',
    'service_line','grade','contract_type','entry_date','exit_date','salary','status',
    'department','is_expatriate'] LOOP
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

CREATE TRIGGER trg_employee_history
AFTER UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION log_employee_changes();
