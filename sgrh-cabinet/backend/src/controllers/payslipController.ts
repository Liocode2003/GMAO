import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  computePayslip,
  generatePayslipPDF,
  generateAttestation9421,
  buildMasseSalarialeWorkbook,
  MONTHS_FR,
  PAYSLIPS_DIR,
  type PayslipInput,
} from '../services/payslipService';

export const listPayslips = async (req: Request, res: Response) => {
  const { year, month, employee_id, status } = req.query as Record<string, string>;

  try {
    const conds: string[] = [];
    const params: unknown[] = [];

    if (year)        { params.push(parseInt(year));   conds.push(`p.period_year = $${params.length}`);  }
    if (month)       { params.push(parseInt(month));  conds.push(`p.period_month = $${params.length}`); }
    if (employee_id) { params.push(employee_id);      conds.push(`p.employee_id = $${params.length}`);  }
    if (status)      { params.push(status);           conds.push(`p.status = $${params.length}`);       }
    const whereClause = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const result = await query(`
      SELECT p.id, p.employee_id, p.period_year, p.period_month,
        p.gross_salary, p.net_salary, p.igr, p.status, p.pdf_path,
        p.created_at, p.updated_at,
        e.matricule, e.first_name, e.last_name, e.grade, e.service_line
      FROM payslips p
      JOIN employees e ON e.id = p.employee_id
      ${whereClause}
      ORDER BY p.period_year DESC, p.period_month DESC, e.last_name
    `, params);

    return res.json(result.rows);
  } catch (err) {
    logger.error('listPayslips error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.*, e.matricule, e.first_name, e.last_name, e.grade, e.function,
        e.service_line, e.contract_type, e.entry_date
      FROM payslips p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.id = $1
    `, [id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Bulletin introuvable' });
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('getPayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const previewPayslip = async (req: Request, res: Response) => {
  const inp = req.body as PayslipInput;
  try {
    const calc = computePayslip({
      base_salary:            parseFloat(String(inp.base_salary))            || 0,
      transport_allowance:    parseFloat(String(inp.transport_allowance))    || 0,
      meal_allowance:         parseFloat(String(inp.meal_allowance))         || 0,
      overtime_pay:           parseFloat(String(inp.overtime_pay))           || 0,
      prime_amount:           parseFloat(String(inp.prime_amount))           || 0,
      other_earnings_amount:  parseFloat(String(inp.other_earnings_amount))  || 0,
      cimr_rate:              parseFloat(String(inp.cimr_rate))              || 0,
      family_charges:         parseInt(String(inp.family_charges))           || 0,
      advance_amount:         parseFloat(String(inp.advance_amount))         || 0,
      other_deduction_amount: parseFloat(String(inp.other_deduction_amount)) || 0,
    });
    return res.json(calc);
  } catch {
    return res.status(500).json({ error: 'Erreur calcul' });
  }
};

export const createPayslip = async (req: Request, res: Response) => {
  const user = req.user as unknown as { userId: string; role: string };
  const b = req.body;

  try {
    const inp: PayslipInput = {
      base_salary:            parseFloat(b.base_salary)            || 0,
      transport_allowance:    parseFloat(b.transport_allowance)    || 0,
      meal_allowance:         parseFloat(b.meal_allowance)         || 0,
      overtime_pay:           parseFloat(b.overtime_pay)           || 0,
      prime_amount:           parseFloat(b.prime_amount)           || 0,
      other_earnings_amount:  parseFloat(b.other_earnings_amount)  || 0,
      cimr_rate:              parseFloat(b.cimr_rate)              || 0,
      family_charges:         parseInt(b.family_charges)           || 0,
      advance_amount:         parseFloat(b.advance_amount)         || 0,
      other_deduction_amount: parseFloat(b.other_deduction_amount) || 0,
    };
    const calc = computePayslip(inp);

    const ytd = await query(`
      SELECT COALESCE(SUM(gross_salary),0) as gross, COALESCE(SUM(net_salary),0) as net, COALESCE(SUM(igr),0) as igr
      FROM payslips
      WHERE employee_id = $1 AND period_year = $2 AND period_month < $3
    `, [b.employee_id, b.period_year, b.period_month]);

    const ytdGross = parseFloat(ytd.rows[0].gross) + calc.gross_salary;
    const ytdNet   = parseFloat(ytd.rows[0].net)   + calc.net_salary;
    const ytdIgr   = parseFloat(ytd.rows[0].igr)   + calc.igr;

    const result = await query(`
      INSERT INTO payslips (
        employee_id, period_year, period_month,
        base_salary, transport_allowance, meal_allowance, overtime_pay,
        prime_label, prime_amount, other_earnings_label, other_earnings_amount,
        gross_salary, cnss_employee, amo_employee, cimr_rate, cimr_employee,
        professional_deduction, net_taxable_monthly, family_charges, family_charge_deduction, igr,
        advance_amount, other_deduction_label, other_deduction_amount,
        net_salary, cnss_employer, amo_employer, cimr_employer,
        annual_gross_ytd, annual_net_ytd, annual_igr_ytd,
        created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
      )
      RETURNING id
    `, [
      b.employee_id, b.period_year, b.period_month,
      inp.base_salary, inp.transport_allowance, inp.meal_allowance, inp.overtime_pay,
      b.prime_label || null, inp.prime_amount, b.other_earnings_label || null, inp.other_earnings_amount,
      calc.gross_salary, calc.cnss_employee, calc.amo_employee, inp.cimr_rate, calc.cimr_employee,
      calc.professional_deduction, calc.net_taxable_monthly, inp.family_charges, calc.family_charge_deduction, calc.igr,
      inp.advance_amount, b.other_deduction_label || null, inp.other_deduction_amount,
      calc.net_salary, calc.cnss_employer, calc.amo_employer, calc.cimr_employer,
      ytdGross, ytdNet, ytdIgr,
      user.userId,
    ]);

    return res.status(201).json({ id: result.rows[0].id });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Un bulletin existe déjà pour cette période' });
    }
    logger.error('createPayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updatePayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body;

  try {
    const existing = await query(`SELECT status FROM payslips WHERE id = $1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Introuvable' });
    if (existing.rows[0].status === 'PUBLIE') {
      return res.status(400).json({ error: 'Impossible de modifier un bulletin publié' });
    }

    const inp: PayslipInput = {
      base_salary:            parseFloat(b.base_salary)            || 0,
      transport_allowance:    parseFloat(b.transport_allowance)    || 0,
      meal_allowance:         parseFloat(b.meal_allowance)         || 0,
      overtime_pay:           parseFloat(b.overtime_pay)           || 0,
      prime_amount:           parseFloat(b.prime_amount)           || 0,
      other_earnings_amount:  parseFloat(b.other_earnings_amount)  || 0,
      cimr_rate:              parseFloat(b.cimr_rate)              || 0,
      family_charges:         parseInt(b.family_charges)           || 0,
      advance_amount:         parseFloat(b.advance_amount)         || 0,
      other_deduction_amount: parseFloat(b.other_deduction_amount) || 0,
    };
    const calc = computePayslip(inp);

    await query(`
      UPDATE payslips SET
        base_salary=$1, transport_allowance=$2, meal_allowance=$3, overtime_pay=$4,
        prime_label=$5, prime_amount=$6, other_earnings_label=$7, other_earnings_amount=$8,
        gross_salary=$9, cnss_employee=$10, amo_employee=$11, cimr_rate=$12, cimr_employee=$13,
        professional_deduction=$14, net_taxable_monthly=$15, family_charges=$16, family_charge_deduction=$17, igr=$18,
        advance_amount=$19, other_deduction_label=$20, other_deduction_amount=$21,
        net_salary=$22, cnss_employer=$23, amo_employer=$24, cimr_employer=$25, pdf_path=NULL
      WHERE id=$26
    `, [
      inp.base_salary, inp.transport_allowance, inp.meal_allowance, inp.overtime_pay,
      b.prime_label || null, inp.prime_amount, b.other_earnings_label || null, inp.other_earnings_amount,
      calc.gross_salary, calc.cnss_employee, calc.amo_employee, inp.cimr_rate, calc.cimr_employee,
      calc.professional_deduction, calc.net_taxable_monthly, inp.family_charges, calc.family_charge_deduction, calc.igr,
      inp.advance_amount, b.other_deduction_label || null, inp.other_deduction_amount,
      calc.net_salary, calc.cnss_employer, calc.amo_employer, calc.cimr_employer, id,
    ]);

    return res.json({ ok: true });
  } catch (err) {
    logger.error('updatePayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const publishPayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let filename = '';
    try { filename = await generatePayslipPDF(id); } catch { /* PDF non bloquant */ }
    await query(`UPDATE payslips SET status='PUBLIE', pdf_path=$1 WHERE id=$2`, [filename, id]);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('publishPayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const downloadPayslipPDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.*, e.matricule
      FROM payslips p JOIN employees e ON e.id = p.employee_id
      WHERE p.id = $1
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Introuvable' });
    const ps = result.rows[0];

    if (!ps.pdf_path || !fs.existsSync(path.join(PAYSLIPS_DIR, ps.pdf_path))) {
      const filename = await generatePayslipPDF(id);
      await query(`UPDATE payslips SET pdf_path=$1 WHERE id=$2`, [filename, id]);
      ps.pdf_path = filename;
    }

    const filepath = path.join(PAYSLIPS_DIR, ps.pdf_path);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${ps.pdf_path}"`);
    fs.createReadStream(filepath).pipe(res);
  } catch (err) {
    logger.error('downloadPayslipPDF error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deletePayslip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await query(`SELECT status, pdf_path FROM payslips WHERE id=$1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Introuvable' });
    if (existing.rows[0].status === 'PUBLIE') {
      return res.status(400).json({ error: 'Impossible de supprimer un bulletin publié' });
    }
    if (existing.rows[0].pdf_path) {
      const fp = path.join(PAYSLIPS_DIR, existing.rows[0].pdf_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await query(`DELETE FROM payslips WHERE id=$1`, [id]);
    return res.status(204).send();
  } catch (err) {
    logger.error('deletePayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getMasseSalariale = async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();
  try {
    const result = await query(`
      SELECT
        period_month as month,
        COUNT(*) as count,
        SUM(gross_salary)  as total_brut,
        SUM(net_salary)    as total_net,
        SUM(igr)           as total_igr,
        SUM(cnss_employee) as total_cnss,
        SUM(amo_employee)  as total_amo,
        SUM(cnss_employer) as total_cnss_patronal
      FROM payslips
      WHERE period_year = $1
      GROUP BY period_month
      ORDER BY period_month
    `, [year]);

    const months = result.rows.map(r => ({
      month:             parseInt(r.month),
      monthLabel:        MONTHS_FR[parseInt(r.month)],
      count:             parseInt(r.count),
      totalBrut:         parseFloat(r.total_brut)         || 0,
      totalNet:          parseFloat(r.total_net)          || 0,
      totalIgr:          parseFloat(r.total_igr)          || 0,
      totalCnss:         parseFloat(r.total_cnss)         || 0,
      totalAmo:          parseFloat(r.total_amo)          || 0,
      totalCnssPatronal: parseFloat(r.total_cnss_patronal) || 0,
    }));

    const totals = {
      totalBrut: months.reduce((s, m) => s + m.totalBrut, 0),
      totalNet:  months.reduce((s, m) => s + m.totalNet, 0),
      totalIgr:  months.reduce((s, m) => s + m.totalIgr, 0),
      totalCnss: months.reduce((s, m) => s + m.totalCnss, 0),
    };

    return res.json({ year, months, totals });
  } catch (err) {
    logger.error('getMasseSalariale error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAnnualSummary = async (req: Request, res: Response) => {
  const { id } = req.params;
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();
  try {
    const empResult = await query(`
      SELECT id, matricule, first_name, last_name, grade, service_line, function, children_count
      FROM employees WHERE id = $1
    `, [id]);
    if (!empResult.rows[0]) return res.status(404).json({ error: 'Employé introuvable' });
    const emp = empResult.rows[0];

    const slipsResult = await query(`
      SELECT
        period_month,
        base_salary, gross_salary, net_salary,
        cnss_employee, amo_employee, cimr_employee, igr,
        advance_amount, other_deduction_amount
      FROM payslips
      WHERE employee_id = $1 AND period_year = $2
      ORDER BY period_month
    `, [id, year]);

    const slips = slipsResult.rows.map(r => ({
      month:       parseInt(r.period_month),
      monthLabel:  MONTHS_FR[parseInt(r.period_month)],
      grossSalary: parseFloat(r.gross_salary) || 0,
      netSalary:   parseFloat(r.net_salary)   || 0,
      igr:         parseFloat(r.igr)          || 0,
      cnss:        parseFloat(r.cnss_employee) || 0,
      amo:         parseFloat(r.amo_employee)  || 0,
      cimr:        parseFloat(r.cimr_employee) || 0,
    }));

    const cumul = {
      grossSalary: slips.reduce((s, r) => s + r.grossSalary, 0),
      netSalary:   slips.reduce((s, r) => s + r.netSalary, 0),
      igr:         slips.reduce((s, r) => s + r.igr, 0),
      cnss:        slips.reduce((s, r) => s + r.cnss, 0),
      amo:         slips.reduce((s, r) => s + r.amo, 0),
      cimr:        slips.reduce((s, r) => s + r.cimr, 0),
    };

    return res.json({ employee: emp, year, slips, cumul });
  } catch (err) {
    logger.error('getAnnualSummary error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const downloadAttestation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();
  try {
    const emp = await query(`SELECT matricule, first_name, last_name FROM employees WHERE id = $1`, [id]);
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employé introuvable' });
    const e = emp.rows[0];

    const count = await query(`SELECT COUNT(*) as c FROM payslips WHERE employee_id=$1 AND period_year=$2`, [id, year]);
    if (parseInt(count.rows[0].c) === 0) {
      return res.status(404).json({ error: `Aucun bulletin trouvé pour ${year}` });
    }

    const pdfBuffer = await generateAttestation9421(id, year);
    const filename = `attestation_fiscale_${e.matricule}_${year}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    logger.error('downloadAttestation error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const exportMasseSalarialeExcel = async (req: Request, res: Response) => {
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();
  try {
    const buf = await buildMasseSalarialeWorkbook(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="masse_salariale_${year}.xlsx"`);
    return res.send(buf);
  } catch (err) {
    logger.error('exportMasseSalarialeExcel error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
