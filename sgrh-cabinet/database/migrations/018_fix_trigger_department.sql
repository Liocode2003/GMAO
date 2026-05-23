-- Migration 018 — Supprimer 'department' du trigger log_employee_changes
-- La colonne department a été supprimée en 017 mais le trigger la référençait encore

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  FOREACH col IN ARRAY ARRAY['first_name','last_name','gender','email','phone','function',
    'service_line','grade','contract_type','entry_date','exit_date','salary','status',
    'is_expatriate'] LOOP
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
