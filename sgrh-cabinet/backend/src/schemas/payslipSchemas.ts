import { z } from 'zod';

// coerce convertit automatiquement les strings numériques envoyées par les <input type="number">
// ex: "25000" → 25000, "0" → 0, "" → 0
const amount   = z.coerce.number().nonnegative('Montant invalide (≥ 0)');
const intField = z.coerce.number().int().nonnegative();

const payslipBase = z.object({
  employee_id:              z.string().uuid('employee_id invalide'),
  period_year:              z.coerce.number().int().min(2020).max(2100),
  period_month:             z.coerce.number().int().min(1, 'Mois invalide').max(12, 'Mois invalide'),
  base_salary:              amount.optional(),
  transport_allowance:      amount.optional(),
  meal_allowance:           amount.optional(),
  overtime_pay:             amount.optional(),
  prime_label:              z.string().max(100).optional(),
  prime_amount:             amount.optional(),
  other_earnings_label:     z.string().max(100).optional(),
  other_earnings_amount:    amount.optional(),
  cimr_rate:                z.coerce.number().min(0).max(100).optional(),
  family_charges:           intField.max(20).optional(),
  advance_amount:           amount.optional(),
  other_deduction_label:    z.string().max(100).optional(),
  other_deduction_amount:   amount.optional(),
});

export const createPayslipSchema  = payslipBase;
export const previewPayslipSchema = payslipBase;
export const updatePayslipSchema  = payslipBase
  .omit({ employee_id: true, period_year: true, period_month: true })
  .partial();
