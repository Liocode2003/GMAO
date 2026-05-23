-- ================================================================
-- SEED BULLETINS DE PAIE — JAN–MAI 2026
-- Forvis Mazars Burkina Faso — tous les employés actifs (hors STAGE)
-- Calcul identique au moteur payslipController.ts
-- ================================================================

BEGIN;

-- Réinitialiser les bulletins existants pour repartir propre
TRUNCATE payslips RESTART IDENTITY CASCADE;

DO $$
DECLARE
  emp       RECORD;
  m         INTEGER;
  mstart    DATE;
  mend      DATE;

  -- Constantes identiques à payslipController.ts
  CNSS_RATE_EMP    CONSTANT NUMERIC := 0.0448;
  CNSS_CEIL        CONSTANT NUMERIC := 6000;
  CNSS_RATE_ES     CONSTANT NUMERIC := 0.0898;  -- patronal social (plafonné)
  CNSS_RATE_EF     CONSTANT NUMERIC := 0.0640;  -- patronal famille (non plafonné)
  AMO_RATE_EMP     CONSTANT NUMERIC := 0.0226;
  AMO_RATE_EMPL    CONSTANT NUMERIC := 0.0365;
  PROF_DED_RATE    CONSTANT NUMERIC := 0.20;
  PROF_DED_MAX     CONSTANT NUMERIC := 2500;
  FAM_DED_PER      CONSTANT NUMERIC := 30;

  v_base        NUMERIC;
  v_transport   NUMERIC;
  v_meal        NUMERIC;
  v_gross       NUMERIC;
  v_cnss_emp    NUMERIC;
  v_amo_emp     NUMERIC;
  v_prof_ded    NUMERIC;
  v_net_tax     NUMERIC;
  v_ann_tax     NUMERIC;
  v_ann_igr     NUMERIC;
  v_igr_raw     NUMERIC;
  v_fam         INTEGER;
  v_fam_ded     NUMERIC;
  v_igr         NUMERIC;
  v_cnss_empl   NUMERIC;
  v_amo_empl    NUMERIC;
  v_net         NUMERIC;
  v_ytd_gross   NUMERIC;
  v_ytd_net     NUMERIC;
  v_ytd_igr     NUMERIC;

  admin_id CONSTANT UUID := 'a0000001-0000-0000-0000-000000000001';
BEGIN

  FOR emp IN
    SELECT
      id,
      matricule,
      salary,
      COALESCE(children_count, 0) AS children_count,
      entry_date,
      exit_date,
      contract_type
    FROM employees
    WHERE salary IS NOT NULL
      AND contract_type::TEXT <> 'STAGE'
    ORDER BY matricule
  LOOP

    v_ytd_gross := 0;
    v_ytd_net   := 0;
    v_ytd_igr   := 0;

    FOR m IN 1..5 LOOP
      mstart := make_date(2026, m, 1);
      mend   := (mstart + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

      -- Ignorer le mois si l'employé n'était pas encore là ou déjà parti
      CONTINUE WHEN emp.entry_date > mend;
      CONTINUE WHEN emp.exit_date IS NOT NULL AND emp.exit_date <= mstart;

      v_base := emp.salary;

      -- Indemnité transport selon niveau de salaire
      v_transport := CASE
        WHEN v_base >= 3000000 THEN 100000
        WHEN v_base >= 2000000 THEN 75000
        WHEN v_base >= 1000000 THEN 50000
        WHEN v_base >= 500000  THEN 35000
        ELSE 20000
      END;

      -- Indemnité repas
      v_meal := CASE
        WHEN v_base >= 3000000 THEN 50000
        WHEN v_base >= 2000000 THEN 40000
        WHEN v_base >= 1000000 THEN 30000
        WHEN v_base >= 500000  THEN 20000
        ELSE 15000
      END;

      v_gross := ROUND(v_base + v_transport + v_meal, 2);

      -- CNSS salarié (plafonné)
      v_cnss_emp := ROUND(LEAST(v_gross, CNSS_CEIL) * CNSS_RATE_EMP, 2);

      -- AMO salarié
      v_amo_emp := ROUND(v_gross * AMO_RATE_EMP, 2);

      -- Déduction professionnelle (20%, max 2 500/mois)
      v_prof_ded := ROUND(LEAST(v_gross * PROF_DED_RATE, PROF_DED_MAX), 2);

      -- Base imposable mensuelle
      v_net_tax := ROUND(GREATEST(0, v_gross - v_cnss_emp - v_amo_emp - v_prof_ded), 2);

      -- IGR : annualiser → barème → /12
      v_ann_tax := v_net_tax * 12;
      v_ann_igr := CASE
        WHEN v_ann_tax <= 0       THEN 0
        WHEN v_ann_tax <= 30000   THEN 0
        WHEN v_ann_tax <= 50000   THEN v_ann_tax * 0.10 - 3000
        WHEN v_ann_tax <= 60000   THEN v_ann_tax * 0.20 - 8000
        WHEN v_ann_tax <= 80000   THEN v_ann_tax * 0.30 - 14000
        WHEN v_ann_tax <= 180000  THEN v_ann_tax * 0.34 - 17200
        ELSE                           v_ann_tax * 0.38 - 24400
      END;
      v_igr_raw := ROUND(v_ann_igr / 12, 2);

      -- Charges de famille (max 6 ayants droit × 30/mois)
      v_fam     := emp.children_count;
      v_fam_ded := ROUND(LEAST(v_fam, 6) * FAM_DED_PER, 2);
      v_igr     := ROUND(GREATEST(0, v_igr_raw - v_fam_ded), 2);

      -- Cotisations patronales (informatif)
      v_cnss_empl := ROUND(LEAST(v_gross, CNSS_CEIL) * CNSS_RATE_ES + v_gross * CNSS_RATE_EF, 2);
      v_amo_empl  := ROUND(v_gross * AMO_RATE_EMPL, 2);

      -- Net à payer
      v_net := ROUND(v_gross - v_cnss_emp - v_amo_emp - v_igr, 2);

      -- Cumuls YTD
      v_ytd_gross := v_ytd_gross + v_gross;
      v_ytd_net   := v_ytd_net   + v_net;
      v_ytd_igr   := v_ytd_igr   + v_igr;

      INSERT INTO payslips (
        employee_id, period_year, period_month,
        base_salary, transport_allowance, meal_allowance, overtime_pay,
        prime_label, prime_amount, other_earnings_label, other_earnings_amount,
        gross_salary,
        cnss_employee, amo_employee, cimr_rate, cimr_employee,
        professional_deduction, net_taxable_monthly,
        family_charges, family_charge_deduction, igr,
        advance_amount, other_deduction_label, other_deduction_amount,
        net_salary, cnss_employer, amo_employer, cimr_employer,
        annual_gross_ytd, annual_net_ytd, annual_igr_ytd,
        status, created_by
      ) VALUES (
        emp.id, 2026, m,
        v_base, v_transport, v_meal, 0,
        NULL, 0, NULL, 0,
        v_gross,
        v_cnss_emp, v_amo_emp, 0, 0,
        v_prof_ded, v_net_tax,
        v_fam, v_fam_ded, v_igr,
        0, NULL, 0,
        v_net, v_cnss_empl, v_amo_empl, 0,
        v_ytd_gross, v_ytd_net, v_ytd_igr,
        'PUBLIE', admin_id
      )
      ON CONFLICT (employee_id, period_year, period_month) DO NOTHING;

    END LOOP; -- mois
  END LOOP; -- employés

END $$;

-- Rapport de création
SELECT
  COUNT(*)                             AS bulletins_crees,
  COUNT(DISTINCT employee_id)          AS employes_couverts,
  MIN(period_month)                    AS mois_debut,
  MAX(period_month)                    AS mois_fin,
  ROUND(SUM(net_salary))               AS total_net_annuel,
  ROUND(AVG(net_salary))               AS net_moyen_mensuel
FROM payslips
WHERE period_year = 2026;

COMMIT;
