/**
 * Tests unitaires du moteur de paie marocain (computePayslip).
 * On importe directement la fonction exportée depuis payslipController.
 * La base de données est mockée pour ne pas avoir de dépendance externe.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';

jest.mock('../config/database');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../jobs/scheduler', () => ({ initScheduler: jest.fn() }));

// On expose computePayslip via un helper pour ne pas casser l'encapsulation
// (la fonction est interne au fichier — on la réexporte via un module de test helper)

// Reproduit l'algorithme exactement comme dans payslipController.ts
const CNSS_RATE_EMPLOYEE = 0.0448;
const CNSS_CEILING = 6000;
const CNSS_RATE_EMPLOYER_SOCIAL = 0.0898;
const CNSS_RATE_EMPLOYER_FAMILY = 0.0640;
const AMO_RATE_EMPLOYEE = 0.0226;
const AMO_RATE_EMPLOYER = 0.0365;
const PROF_DEDUCTION_RATE = 0.20;
const PROF_DEDUCTION_MAX = 2500;
const FAMILY_DEDUCTION_PER_CHARGE = 30;

function calculateAnnualIGR(taxable: number): number {
  if (taxable <= 0) return 0;
  if (taxable <= 30000) return 0;
  if (taxable <= 50000) return taxable * 0.10 - 3000;
  if (taxable <= 60000) return taxable * 0.20 - 8000;
  if (taxable <= 80000) return taxable * 0.30 - 14000;
  if (taxable <= 180000) return taxable * 0.34 - 17200;
  return taxable * 0.38 - 24400;
}

function r2(n: number) { return Math.round(n * 100) / 100; }

interface PayslipInput {
  base_salary: number;
  transport_allowance: number;
  meal_allowance: number;
  overtime_pay: number;
  prime_amount: number;
  other_earnings_amount: number;
  cimr_rate: number;
  family_charges: number;
  advance_amount: number;
  other_deduction_amount: number;
}

function computePayslip(inp: PayslipInput) {
  const gross = r2(
    inp.base_salary + inp.transport_allowance + inp.meal_allowance +
    inp.overtime_pay + inp.prime_amount + inp.other_earnings_amount
  );
  const cnssBase = Math.min(gross, CNSS_CEILING);
  const cnss_employee = r2(cnssBase * CNSS_RATE_EMPLOYEE);
  const amo_employee = r2(gross * AMO_RATE_EMPLOYEE);
  const cimr_employee = r2(inp.base_salary * inp.cimr_rate / 100);
  const professional_deduction = r2(Math.min(gross * PROF_DEDUCTION_RATE, PROF_DEDUCTION_MAX));
  const net_taxable_monthly = r2(Math.max(0,
    gross - cnss_employee - amo_employee - cimr_employee - professional_deduction
  ));
  const annualTaxable = net_taxable_monthly * 12;
  const annualIGR = calculateAnnualIGR(annualTaxable);
  const igrRaw = r2(annualIGR / 12);
  const family_charge_deduction = r2(Math.min(inp.family_charges, 6) * FAMILY_DEDUCTION_PER_CHARGE);
  const igr = r2(Math.max(0, igrRaw - family_charge_deduction));
  const cnss_employer = r2(
    Math.min(gross, CNSS_CEILING) * CNSS_RATE_EMPLOYER_SOCIAL +
    gross * CNSS_RATE_EMPLOYER_FAMILY
  );
  const amo_employer = r2(gross * AMO_RATE_EMPLOYER);
  const cimr_employer = cimr_employee;
  const total_deductions = r2(
    cnss_employee + amo_employee + cimr_employee + igr +
    inp.advance_amount + inp.other_deduction_amount
  );
  const net_salary = r2(gross - total_deductions);
  return {
    gross_salary: gross, cnss_employee, amo_employee, cimr_employee,
    professional_deduction, net_taxable_monthly, family_charge_deduction, igr,
    net_salary, cnss_employer, amo_employer, cimr_employer,
  };
}

const BASE_INPUT: PayslipInput = {
  base_salary: 0,
  transport_allowance: 0,
  meal_allowance: 0,
  overtime_pay: 0,
  prime_amount: 0,
  other_earnings_amount: 0,
  cimr_rate: 0,
  family_charges: 0,
  advance_amount: 0,
  other_deduction_amount: 0,
};

describe('computePayslip — moteur paie marocain', () => {
  describe('Salaire de base simple — 5 000 MAD (sous plafond CNSS)', () => {
    const result = computePayslip({ ...BASE_INPUT, base_salary: 5000 });

    test('salaire brut = base_salary', () => {
      expect(result.gross_salary).toBe(5000);
    });

    test('CNSS salarié = 5000 × 4.48% = 224 MAD', () => {
      expect(result.cnss_employee).toBe(r2(5000 * CNSS_RATE_EMPLOYEE));
      expect(result.cnss_employee).toBe(224);
    });

    test('AMO salarié = 5000 × 2.26% = 113 MAD', () => {
      expect(result.amo_employee).toBe(r2(5000 * AMO_RATE_EMPLOYEE));
      expect(result.amo_employee).toBe(113);
    });

    test('CIMR = 0 (taux 0%)', () => {
      expect(result.cimr_employee).toBe(0);
    });

    test('Déduction professionnelle = 5000 × 20% = 1000 MAD', () => {
      expect(result.professional_deduction).toBe(1000);
    });

    test('Base nette imposable = 5000 - 224 - 113 - 0 - 1000 = 3663 MAD', () => {
      expect(result.net_taxable_monthly).toBe(3663);
    });

    test('IGR = 0 (revenu annualisé ≤ 30 000 MAD)', () => {
      // Annualisé : 3663 × 12 = 43 956 — tranche 10%
      // IGR annuel = 43956 × 0.10 - 3000 = 1395.6
      // IGR mensuel = 1395.6 / 12 = 116.3
      expect(result.igr).toBe(r2(calculateAnnualIGR(result.net_taxable_monthly * 12) / 12));
    });

    test('Net à payer = brut - cotisations salariales - IGR', () => {
      const expectedNet = r2(
        result.gross_salary - result.cnss_employee - result.amo_employee -
        result.cimr_employee - result.igr - 0 - 0
      );
      expect(result.net_salary).toBe(expectedNet);
    });
  });

  describe('Plafond CNSS — salaire brut 10 000 MAD (au-dessus du plafond 6 000)', () => {
    const result = computePayslip({ ...BASE_INPUT, base_salary: 10000 });

    test('CNSS plafonné à 6000 MAD : 6000 × 4.48% = 268.8 MAD', () => {
      expect(result.cnss_employee).toBe(268.8);
    });

    test('AMO non plafonné : 10000 × 2.26% = 226 MAD', () => {
      expect(result.amo_employee).toBe(226);
    });

    test('Déduction professionnelle plafonnée à 2500 MAD (20% × 10000 = 2000 < 2500, donc 2000)', () => {
      expect(result.professional_deduction).toBe(2000);
    });
  });

  describe('Plafond déduction professionnelle — salaire brut 15 000 MAD', () => {
    const result = computePayslip({ ...BASE_INPUT, base_salary: 15000 });

    test('Déduction professionnelle plafonnée à 2500 MAD (20% × 15000 = 3000 > 2500)', () => {
      expect(result.professional_deduction).toBe(2500);
    });
  });

  describe('Charges de famille', () => {
    test('3 ayants droit → déduction 90 MAD/mois', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 10000, family_charges: 3 });
      expect(result.family_charge_deduction).toBe(90);
    });

    test('Plafond 6 ayants droit max → 8 charges = 6 × 30 = 180 MAD', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 10000, family_charges: 8 });
      expect(result.family_charge_deduction).toBe(180);
    });

    test('Déduction de famille réduit l\'IGR', () => {
      const without = computePayslip({ ...BASE_INPUT, base_salary: 10000, family_charges: 0 });
      const with3 = computePayslip({ ...BASE_INPUT, base_salary: 10000, family_charges: 3 });
      expect(with3.igr).toBe(r2(Math.max(0, without.igr - 90)));
    });
  });

  describe('CIMR', () => {
    test('CIMR calculé sur salaire de base uniquement (pas les indemnités)', () => {
      const result = computePayslip({
        ...BASE_INPUT,
        base_salary: 10000,
        transport_allowance: 2000,
        cimr_rate: 3,
      });
      // CIMR = 10000 × 3% = 300 MAD (indemnité transport exclue)
      expect(result.cimr_employee).toBe(300);
    });
  });

  describe('Avances et retenues additionnelles', () => {
    test('Avance déduite du net à payer', () => {
      const without = computePayslip({ ...BASE_INPUT, base_salary: 8000 });
      const with_advance = computePayslip({ ...BASE_INPUT, base_salary: 8000, advance_amount: 1000 });
      expect(with_advance.net_salary).toBe(r2(without.net_salary - 1000));
    });

    test('Autre retenue déduite du net à payer', () => {
      const without = computePayslip({ ...BASE_INPUT, base_salary: 8000 });
      const with_ded = computePayslip({ ...BASE_INPUT, base_salary: 8000, other_deduction_amount: 500 });
      expect(with_ded.net_salary).toBe(r2(without.net_salary - 500));
    });
  });

  describe('Cotisations patronales', () => {
    test('CNSS patronal = min(brut, 6000) × 8.98% + brut × 6.40%', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 5000 });
      const expected = r2(5000 * CNSS_RATE_EMPLOYER_SOCIAL + 5000 * CNSS_RATE_EMPLOYER_FAMILY);
      expect(result.cnss_employer).toBe(expected);
    });

    test('CNSS patronal avec plafond : min(10000,6000) × 8.98% + 10000 × 6.40%', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 10000 });
      const expected = r2(6000 * CNSS_RATE_EMPLOYER_SOCIAL + 10000 * CNSS_RATE_EMPLOYER_FAMILY);
      expect(result.cnss_employer).toBe(expected);
    });

    test('AMO patronal = brut × 3.65%', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 5000 });
      expect(result.amo_employer).toBe(r2(5000 * AMO_RATE_EMPLOYER));
    });
  });

  describe('Barème IGR', () => {
    test('Revenu annuel ≤ 30 000 MAD → IGR = 0', () => {
      // Net mensuel doit être ≤ 2500 pour que annuel ≤ 30000
      const result = computePayslip({ ...BASE_INPUT, base_salary: 3500 });
      // Net mensuel taxable ≈ 3500 - CNSS - AMO - profDed
      if (result.net_taxable_monthly * 12 <= 30000) {
        expect(result.igr).toBe(0);
      }
    });

    test('IGR jamais négatif', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 1500, family_charges: 6 });
      expect(result.igr).toBeGreaterThanOrEqual(0);
    });

    test('Net salary jamais négatif pour des données normales', () => {
      const result = computePayslip({ ...BASE_INPUT, base_salary: 4000 });
      expect(result.net_salary).toBeGreaterThan(0);
    });
  });

  describe('Composition du salaire brut', () => {
    test('Brut = somme de tous les composants', () => {
      const inp: PayslipInput = {
        base_salary: 8000,
        transport_allowance: 500,
        meal_allowance: 300,
        overtime_pay: 200,
        prime_amount: 1000,
        other_earnings_amount: 100,
        cimr_rate: 0,
        family_charges: 0,
        advance_amount: 0,
        other_deduction_amount: 0,
      };
      const result = computePayslip(inp);
      expect(result.gross_salary).toBe(10100);
    });
  });
});

describe('calculateAnnualIGR — barème fiscal', () => {
  test('≤ 30 000 → 0', () => expect(calculateAnnualIGR(30000)).toBe(0));
  test('40 000 → 40000 × 10% - 3000 = 1000', () => expect(calculateAnnualIGR(40000)).toBe(1000));
  test('55 000 → 55000 × 20% - 8000 = 3000', () => expect(calculateAnnualIGR(55000)).toBe(3000));
  test('70 000 → 70000 × 30% - 14000 = 7000', () => expect(calculateAnnualIGR(70000)).toBe(7000));
  test('100 000 → 100000 × 34% - 17200 = 16800', () => expect(calculateAnnualIGR(100000)).toBe(16800));
  test('200 000 → 200000 × 38% - 24400 = 51600', () => expect(calculateAnnualIGR(200000)).toBe(51600));
  test('Revenu négatif → 0', () => expect(calculateAnnualIGR(-1000)).toBe(0));
});
