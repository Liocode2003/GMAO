-- ================================================================
-- SEED BULLETINS DE PAIE — JAN–MAI 2026
-- Forvis Mazars Burkina Faso — tous les employés actifs (hors STAGE)
-- Taux Burkina Faso identiques à payslipController.ts
-- ================================================================

BEGIN;

TRUNCATE payslips RESTART IDENTITY CASCADE;

DO $$
DECLARE
  emp       RECORD;
  m         INTEGER;
  mstart    DATE;
  mend      DATE;

  -- ── Constantes Burkina Faso (identiques à payslipController.ts) ──
  CNSS_RATE_EMP    CONSTANT NUMERIC := 0.055;      -- 5,5 % salarié
  CNSS_CEIL        CONSTANT NUMERIC := 350000;     -- plafond mensuel FCFA
  CNSS_RATE_EMPL   CONSTANT NUMERIC := 0.16;       -- 16 % patronal (plafonné)
  PROF_DED_RATE    CONSTANT NUMERIC := 0.20;       -- 20 % déduction professionnelle
  PROF_DED_MAX     CONSTANT NUMERIC := 25000;      -- plafond mensuel FCFA
  FAM_DED_PER      CONSTANT NUMERIC := 1500;       -- 1 500 FCFA/mois par ayant droit

  v_base        NUMERIC;
  v_transport   NUMERIC;
  v_meal        NUMERIC;
  v_gross       NUMERIC;
  v_cnss_emp    NUMERIC;
  v_prof_ded    NUMERIC;
  v_net_tax     NUMERIC;
  v_ann_tax     NUMERIC;
  v_ann_iuts    NUMERIC;
  v_iuts_raw    NUMERIC;
  v_fam         INTEGER;
  v_fam_ded     NUMERIC;
  v_igr         NUMERIC;
  v_cnss_empl   NUMERIC;
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

      CONTINUE WHEN emp.entry_date > mend;
      CONTINUE WHEN emp.exit_date IS NOT NULL AND emp.exit_date <= mstart;

      v_base := emp.salary;

      -- Indemnité transport selon niveau de salaire
      v_transport := CASE
        WHEN v_base >= 3000000 THEN 100000
        WHEN v_base >= 2000000 THEN  75000
        WHEN v_base >= 1000000 THEN  50000
        WHEN v_base >= 500000  THEN  35000
        ELSE                         20000
      END;

      -- Indemnité repas
      v_meal := CASE
        WHEN v_base >= 3000000 THEN 50000
        WHEN v_base >= 2000000 THEN 40000
        WHEN v_base >= 1000000 THEN 30000
        WHEN v_base >= 500000  THEN 20000
        ELSE                        15000
      END;

      v_gross := ROUND(v_base + v_transport + v_meal, 2);

      -- CNSS salarié (5,5 %, plafonné à 350 000 FCFA)
      v_cnss_emp := ROUND(LEAST(v_gross, CNSS_CEIL) * CNSS_RATE_EMP, 2);

      -- Déduction professionnelle (20 %, max 25 000 FCFA/mois)
      v_prof_ded := ROUND(LEAST(v_gross * PROF_DED_RATE, PROF_DED_MAX), 2);

      -- Base imposable mensuelle (brut - CNSS - déd. prof.)
      v_net_tax := ROUND(GREATEST(0, v_gross - v_cnss_emp - v_prof_ded), 2);

      -- IUTS : annualiser → barème BF → diviser par 12
      v_ann_tax := v_net_tax * 12;
      v_ann_iuts := CASE
        WHEN v_ann_tax <=       0 THEN 0
        WHEN v_ann_tax <=  240000 THEN 0
        WHEN v_ann_tax <=  300000 THEN (v_ann_tax -  240000) * 0.12
        WHEN v_ann_tax <=  600000 THEN  7200 + (v_ann_tax -  300000) * 0.15
        WHEN v_ann_tax <= 1200000 THEN 52200 + (v_ann_tax -  600000) * 0.225
        WHEN v_ann_tax <= 2400000 THEN 187200 + (v_ann_tax - 1200000) * 0.26
        WHEN v_ann_tax <= 4800000 THEN 499200 + (v_ann_tax - 2400000) * 0.29
        ELSE                           1195200 + (v_ann_tax - 4800000) * 0.32
      END;
      v_iuts_raw := ROUND(v_ann_iuts / 12, 2);

      -- Réduction charges de famille (1 500 FCFA/mois par ayant droit, max 6)
      v_fam     := emp.children_count;
      v_fam_ded := ROUND(LEAST(v_fam, 6) * FAM_DED_PER, 2);
      v_igr     := ROUND(GREATEST(0, v_iuts_raw - v_fam_ded), 2);

      -- Cotisation patronale CNSS (16 %, plafonné — informatif)
      v_cnss_empl := ROUND(LEAST(v_gross, CNSS_CEIL) * CNSS_RATE_EMPL, 2);

      -- Net à payer (brut - CNSS salarié - IUTS)
      v_net := ROUND(v_gross - v_cnss_emp - v_igr, 2);

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
        v_cnss_emp, 0, 0, 0,
        v_prof_ded, v_net_tax,
        v_fam, v_fam_ded, v_igr,
        0, NULL, 0,
        v_net, v_cnss_empl, 0, 0,
        v_ytd_gross, v_ytd_net, v_ytd_igr,
        'PUBLIE', admin_id
      )
      ON CONFLICT (employee_id, period_year, period_month) DO NOTHING;

    END LOOP; -- mois
  END LOOP; -- employés

END $$;

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
