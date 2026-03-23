-- Migration Congés v2 — règles métier complètes
-- Date : 2026-03-23
-- Auteur : SGRH Cabinet

-- ============================================================
-- 1. Assurer que le solde ne peut PAS être négatif en affichage
--    (la colonne balance est générée : annual_allowance + carry_over - days_taken)
--    On ajoute une contrainte : days_taken ne dépasse pas annual_allowance + carry_over
--    via une constraint CHECK pour les congés planifiés uniquement.
--    Les dépassements d'imprévus sont trackés via days_unpaid.
-- ============================================================

-- Rien à modifier dans la table leave_balances : le comportement est déjà correct.
-- Le solde peut techniquement être négatif (IMPRÉVU dépassant le solde).
-- Règle d'affichage : le front affiche max(0, balance).

-- ============================================================
-- 2. Recalculer les allowances pro-rata pour l'année en cours
--    pour les employés ayant rejoint cette année
-- ============================================================

DO $$
DECLARE
  current_yr INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  rec RECORD;
  months_remaining INTEGER;
  pro_rata NUMERIC(5,2);
BEGIN
  FOR rec IN
    SELECT e.id, e.entry_date
    FROM employees e
    JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = current_yr
    WHERE EXTRACT(YEAR FROM e.entry_date)::INTEGER = current_yr
      AND e.status = 'ACTIF'
  LOOP
    months_remaining := 12 - EXTRACT(MONTH FROM rec.entry_date)::INTEGER + 1;
    -- arrondi au 0.5 supérieur
    pro_rata := CEIL((months_remaining::NUMERIC / 12.0 * 30.0) * 2) / 2.0;

    UPDATE leave_balances
    SET annual_allowance = pro_rata, updated_at = NOW()
    WHERE employee_id = rec.id AND year = current_yr
      AND annual_allowance = 30; -- ne pas écraser si déjà personnalisé
  END LOOP;

  RAISE NOTICE 'Pro-rata congés recalculés pour l''année %', current_yr;
END;
$$;

-- ============================================================
-- 3. Index supplémentaire pour les alertes de fin de congé
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leaves_end_date
  ON leaves(end_date)
  WHERE type = 'PLANIFIE' AND status = 'APPROUVE';

-- ============================================================
-- 4. Vue pratique : récapitulatif congés par employé (année courante)
-- ============================================================
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

COMMENT ON VIEW v_leave_summary IS 'Récapitulatif des congés par collaborateur et par année';
