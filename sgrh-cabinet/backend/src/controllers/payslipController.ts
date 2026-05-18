import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// ============================================================
// MOTEUR DE PAIE MAROCAIN 2024
// ============================================================

const CNSS_RATE_EMPLOYEE = 0.0448;
const CNSS_CEILING = 6000;           // plafond mensuel MAD
const CNSS_RATE_EMPLOYER_SOCIAL = 0.0898;  // plafonné
const CNSS_RATE_EMPLOYER_FAMILY = 0.0640;  // non plafonné
const AMO_RATE_EMPLOYEE = 0.0226;
const AMO_RATE_EMPLOYER = 0.0365;
const PROF_DEDUCTION_RATE = 0.20;
const PROF_DEDUCTION_MAX = 2500;     // MAD/mois (30 000/an)
const FAMILY_DEDUCTION_PER_CHARGE = 30; // MAD/mois par ayant droit

// Barème IGR annuel (régime général)
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

interface PayslipCalc {
  gross_salary: number;
  cnss_employee: number;
  amo_employee: number;
  cimr_employee: number;
  professional_deduction: number;
  net_taxable_monthly: number;
  family_charge_deduction: number;
  igr: number;
  net_salary: number;
  cnss_employer: number;
  amo_employer: number;
  cimr_employer: number;
}

function computePayslip(inp: PayslipInput): PayslipCalc {
  const gross = r2(
    inp.base_salary + inp.transport_allowance + inp.meal_allowance +
    inp.overtime_pay + inp.prime_amount + inp.other_earnings_amount
  );

  // CNSS salarié (plafonné à 6 000 MAD)
  const cnssBase = Math.min(gross, CNSS_CEILING);
  const cnss_employee = r2(cnssBase * CNSS_RATE_EMPLOYEE);

  // AMO salarié
  const amo_employee = r2(gross * AMO_RATE_EMPLOYEE);

  // CIMR salarié (assis sur salaire de base uniquement)
  const cimr_employee = r2(inp.base_salary * inp.cimr_rate / 100);

  // Déduction professionnelle (20% brut, max 2 500/mois)
  const professional_deduction = r2(Math.min(gross * PROF_DEDUCTION_RATE, PROF_DEDUCTION_MAX));

  // Base imposable mensuelle
  const net_taxable_monthly = r2(Math.max(0,
    gross - cnss_employee - amo_employee - cimr_employee - professional_deduction
  ));

  // IGR mensuel : annualiser → barème → diviser par 12
  const annualTaxable = net_taxable_monthly * 12;
  const annualIGR = calculateAnnualIGR(annualTaxable);
  const igrRaw = r2(annualIGR / 12);

  // Déduction charges de famille (30 MAD/mois par ayant droit, max 6)
  const family_charge_deduction = r2(Math.min(inp.family_charges, 6) * FAMILY_DEDUCTION_PER_CHARGE);
  const igr = r2(Math.max(0, igrRaw - family_charge_deduction));

  // Cotisations patronales (informatif)
  const cnss_employer = r2(
    Math.min(gross, CNSS_CEILING) * CNSS_RATE_EMPLOYER_SOCIAL +
    gross * CNSS_RATE_EMPLOYER_FAMILY
  );
  const amo_employer = r2(gross * AMO_RATE_EMPLOYER);
  const cimr_employer = cimr_employee; // taux identique par convention

  // Net à payer
  const total_deductions = r2(
    cnss_employee + amo_employee + cimr_employee + igr +
    inp.advance_amount + inp.other_deduction_amount
  );
  const net_salary = r2(gross - total_deductions);

  return {
    gross_salary: gross,
    cnss_employee,
    amo_employee,
    cimr_employee,
    professional_deduction,
    net_taxable_monthly,
    family_charge_deduction,
    igr,
    net_salary,
    cnss_employer,
    amo_employer,
    cimr_employer,
  };
}

// ============================================================
// GÉNÉRATION PDF
// ============================================================

const PAYSLIPS_DIR = path.join(process.cwd(), 'uploads', 'payslips');

function fmt(n: number | string) {
  return Number(n).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

async function generatePDF(payslipId: string): Promise<string> {
  const res = await query(`
    SELECT p.*,
      e.matricule, e.first_name, e.last_name, e.grade, e.function,
      e.service_line, e.contract_type, e.entry_date, e.department
    FROM payslips p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.id = $1
  `, [payslipId]);

  if (!res.rows[0]) throw new Error('Payslip not found');
  const ps = res.rows[0];

  if (!fs.existsSync(PAYSLIPS_DIR)) fs.mkdirSync(PAYSLIPS_DIR, { recursive: true });

  const filename = `bulletin_${ps.matricule}_${ps.period_year}_${String(ps.period_month).padStart(2, '0')}.pdf`;
  const filepath = path.join(PAYSLIPS_DIR, filename);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Bulletin de paie — ${MONTHS_FR[ps.period_month]} ${ps.period_year}` } });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const W = doc.page.width - 80; // usable width
    const navy = '#1e3a5f';
    const light = '#f0f4f8';
    const red = '#dc2626';
    const green = '#16a34a';

    // ── HEADER ────────────────────────────────────────────
    doc.rect(40, 40, W, 54).fill(navy);
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
      .text('FORVIS MAZARS', 52, 52);
    doc.fontSize(9).font('Helvetica')
      .text('Cabinet d\'Audit & Conseil', 52, 71);
    doc.fontSize(14).font('Helvetica-Bold')
      .text('BULLETIN DE PAIE', 0, 56, { align: 'right', width: W + 40 });
    doc.fontSize(10).font('Helvetica')
      .text(`${MONTHS_FR[ps.period_month]} ${ps.period_year}`, 0, 73, { align: 'right', width: W + 40 });

    let y = 110;

    // ── INFOS EMPLOYÉ ─────────────────────────────────────
    doc.rect(40, y, W, 14).fill(light);
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold').text('INFORMATIONS COLLABORATEUR', 44, y + 3);
    y += 18;

    const col1 = 40, col2 = 240, col3 = 430;
    const infoRow = (label: string, val: string, cx: number, cy: number) => {
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(label, cx, cy);
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(val, cx, cy + 10);
    };

    infoRow('Matricule', ps.matricule || '—', col1, y);
    infoRow('Nom & Prénom', `${ps.last_name} ${ps.first_name}`, col2, y);
    infoRow('Grade', ps.grade || '—', col3, y);
    y += 26;
    infoRow('Contrat', ps.contract_type || '—', col1, y);
    infoRow('Département', ps.service_line || '—', col2, y);
    infoRow('Date d\'entrée', ps.entry_date ? new Date(ps.entry_date).toLocaleDateString('fr-FR') : '—', col3, y);
    y += 30;

    // ── TABLEAU RÉMUNÉRATIONS / RETENUES ─────────────────
    doc.rect(40, y, W, 14).fill(navy);
    const halfW = (W - 4) / 2;
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('RÉMUNÉRATIONS', 44, y + 3)
      .text('RETENUES SALARIALES', 44 + halfW + 4, y + 3);
    y += 18;

    const lineH = 16;
    let leftY = y;
    let rightY = y;

    const leftLines: [string, number][] = [
      ['Salaire de base', parseFloat(ps.base_salary)],
    ];
    if (parseFloat(ps.transport_allowance) > 0) leftLines.push(['Indemnité transport', parseFloat(ps.transport_allowance)]);
    if (parseFloat(ps.meal_allowance) > 0) leftLines.push(['Indemnité repas', parseFloat(ps.meal_allowance)]);
    if (parseFloat(ps.overtime_pay) > 0) leftLines.push(['Heures supplémentaires', parseFloat(ps.overtime_pay)]);
    if (parseFloat(ps.prime_amount) > 0) leftLines.push([ps.prime_label || 'Prime', parseFloat(ps.prime_amount)]);
    if (parseFloat(ps.other_earnings_amount) > 0) leftLines.push([ps.other_earnings_label || 'Autres gains', parseFloat(ps.other_earnings_amount)]);

    const rightLines: [string, number][] = [
      ['CNSS salarié (4,48% — plaf.)', parseFloat(ps.cnss_employee)],
      ['AMO salarié (2,26%)', parseFloat(ps.amo_employee)],
    ];
    if (parseFloat(ps.cimr_employee) > 0) rightLines.push([`CIMR salarié (${parseFloat(ps.cimr_rate)}%)`, parseFloat(ps.cimr_employee)]);
    rightLines.push(['IGR', parseFloat(ps.igr)]);
    if (parseFloat(ps.advance_amount) > 0) rightLines.push(['Avance sur salaire', parseFloat(ps.advance_amount)]);
    if (parseFloat(ps.other_deduction_amount) > 0) rightLines.push([ps.other_deduction_label || 'Autres retenues', parseFloat(ps.other_deduction_amount)]);

    const drawLine = (label: string, amount: number, cx: number, ly: number, isEven: boolean) => {
      if (isEven) doc.rect(cx, ly, halfW, lineH).fill('#f9fafb');
      doc.fillColor('#374151').fontSize(8.5).font('Helvetica').text(label, cx + 4, ly + 4, { width: halfW - 70 });
      doc.fillColor('#111827').font('Helvetica-Bold').text(`${fmt(amount)} MAD`, cx + halfW - 76, ly + 4, { width: 72, align: 'right' });
    };

    const maxLines = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (leftLines[i]) drawLine(leftLines[i][0], leftLines[i][1], col1, leftY, i % 2 === 0);
      if (rightLines[i]) drawLine(rightLines[i][0], rightLines[i][1], col1 + halfW + 4, rightY, i % 2 === 0);
      leftY += lineH;
      rightY += lineH;
    }
    y = Math.max(leftY, rightY);

    // Totaux
    doc.rect(40, y, halfW, 18).fill('#dbeafe');
    doc.rect(44 + halfW, y, halfW, 18).fill('#fee2e2');
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold')
      .text(`SALAIRE BRUT : ${fmt(ps.gross_salary)} MAD`, 44, y + 5)
      .fillColor(red)
      .text(`TOTAL RETENUES : ${fmt(
        parseFloat(ps.cnss_employee) + parseFloat(ps.amo_employee) +
        parseFloat(ps.cimr_employee) + parseFloat(ps.igr) +
        parseFloat(ps.advance_amount) + parseFloat(ps.other_deduction_amount)
      )} MAD`, 48 + halfW, y + 5);
    y += 24;

    // ── NET À PAYER ───────────────────────────────────────
    doc.rect(40, y, W, 28).fill(navy);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text(`NET À PAYER : ${fmt(ps.net_salary)} MAD`, 0, y + 8, { align: 'center', width: W + 80 });
    y += 38;

    // ── DÉTAIL IGR ────────────────────────────────────────
    doc.rect(40, y, W, 12).fill(light);
    doc.fillColor('#6b7280').fontSize(7.5).font('Helvetica')
      .text(`Base imposable mensuelle : ${fmt(ps.net_taxable_monthly)} MAD   |   ` +
        `Déduction prof. (20%) : ${fmt(ps.professional_deduction)} MAD   |   ` +
        `Charges de famille : ${ps.family_charges} (−${fmt(ps.family_charge_deduction)} MAD/mois)`, 44, y + 3);
    y += 18;

    // ── COTISATIONS PATRONALES ────────────────────────────
    doc.rect(40, y, W, 12).fill('#f0fdf4');
    const cnssEmpl = parseFloat(ps.cnss_employer);
    const amoEmpl = parseFloat(ps.amo_employer);
    const cimrEmpl = parseFloat(ps.cimr_employer);
    doc.fillColor('#15803d').fontSize(7.5).font('Helvetica')
      .text(`Cotisations patronales (informatif) — CNSS : ${fmt(cnssEmpl)} MAD  |  AMO : ${fmt(amoEmpl)} MAD  |  CIMR : ${fmt(cimrEmpl)} MAD  |  Coût total employeur : ${fmt(parseFloat(ps.gross_salary) + cnssEmpl + amoEmpl + cimrEmpl)} MAD`, 44, y + 3);
    y += 18;

    // ── CUMULS ANNUELS ────────────────────────────────────
    doc.rect(40, y, W, 12).fill(light);
    doc.fillColor('#374151').fontSize(7.5).font('Helvetica')
      .text(`Cumuls ${ps.period_year} — Brut : ${fmt(ps.annual_gross_ytd)} MAD  |  Net : ${fmt(ps.annual_net_ytd)} MAD  |  IGR : ${fmt(ps.annual_igr_ytd)} MAD`, 44, y + 3);
    y += 24;

    // ── SIGNATURES ────────────────────────────────────────
    doc.rect(40, y, halfW - 4, 50).dash(3, {}).rect(44 + halfW, y, halfW - 4, 50).stroke('#d1d5db').undash();
    doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
      .text('Signature Employeur', 44, y + 4)
      .text('Signature Employé', 48 + halfW, y + 4);

    // ── PIED DE PAGE ──────────────────────────────────────
    doc.fillColor('#d1d5db').fontSize(7)
      .text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} — Confidentiel`,
        40, doc.page.height - 30, { align: 'center', width: W }
      );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filename;
}

// ============================================================
// CRUD
// ============================================================

export const listPayslips = async (req: Request, res: Response) => {
  const user = req.user as unknown as { userId: string; role: string; email: string };
  const { year, month, employee_id, status } = req.query as Record<string, string>;

  try {
    let whereClause = '';
    const params: unknown[] = [];

    if (['DRH', 'DIRECTION_GENERALE'].includes(user.role)) {
      // Accès complet
      const conds: string[] = [];
      if (year) { params.push(parseInt(year)); conds.push(`p.period_year = $${params.length}`); }
      if (month) { params.push(parseInt(month)); conds.push(`p.period_month = $${params.length}`); }
      if (employee_id) { params.push(employee_id); conds.push(`p.employee_id = $${params.length}`); }
      if (status) { params.push(status); conds.push(`p.status = $${params.length}`); }
      if (conds.length) whereClause = 'WHERE ' + conds.join(' AND ');
    } else {
      // Employé : uniquement ses propres bulletins publiés
      params.push(user.email);
      whereClause = `
        JOIN employees emp2 ON emp2.id = p.employee_id AND emp2.email = $1
        WHERE p.status = 'PUBLIE'
      `;
      // Adjust: use a subquery instead
      whereClause = '';
      const empRes = await query(`SELECT id FROM employees WHERE email = $1 LIMIT 1`, [user.email]);
      if (!empRes.rows[0]) return res.json([]);
      params[0] = empRes.rows[0].id;
      whereClause = `WHERE p.employee_id = $1 AND p.status = 'PUBLIE'`;
      if (year) { params.push(parseInt(year)); whereClause += ` AND p.period_year = $${params.length}`; }
      if (month) { params.push(parseInt(month)); whereClause += ` AND p.period_month = $${params.length}`; }
    }

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
  const user = req.user as unknown as { userId: string; role: string; email: string };
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, e.matricule, e.first_name, e.last_name, e.grade, e.function,
        e.service_line, e.contract_type, e.entry_date, e.department, e.email as emp_email
      FROM payslips p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.id = $1
    `, [id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Bulletin introuvable' });
    const ps = result.rows[0];

    if (!['DRH', 'DIRECTION_GENERALE'].includes(user.role)) {
      if (ps.emp_email !== user.email) return res.status(403).json({ error: 'Accès refusé' });
      if (ps.status !== 'PUBLIE') return res.status(403).json({ error: 'Bulletin non publié' });
    }

    return res.json(ps);
  } catch (err) {
    logger.error('getPayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const previewPayslip = async (req: Request, res: Response) => {
  const inp = req.body as PayslipInput & { base_salary: number };
  try {
    const calc = computePayslip({
      base_salary: parseFloat(String(inp.base_salary)) || 0,
      transport_allowance: parseFloat(String(inp.transport_allowance)) || 0,
      meal_allowance: parseFloat(String(inp.meal_allowance)) || 0,
      overtime_pay: parseFloat(String(inp.overtime_pay)) || 0,
      prime_amount: parseFloat(String(inp.prime_amount)) || 0,
      other_earnings_amount: parseFloat(String(inp.other_earnings_amount)) || 0,
      cimr_rate: parseFloat(String(inp.cimr_rate)) || 0,
      family_charges: parseInt(String(inp.family_charges)) || 0,
      advance_amount: parseFloat(String(inp.advance_amount)) || 0,
      other_deduction_amount: parseFloat(String(inp.other_deduction_amount)) || 0,
    });
    return res.json(calc);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur calcul' });
  }
};

export const createPayslip = async (req: Request, res: Response) => {
  const user = req.user as unknown as { userId: string; role: string };
  const b = req.body;

  try {
    const inp: PayslipInput = {
      base_salary: parseFloat(b.base_salary) || 0,
      transport_allowance: parseFloat(b.transport_allowance) || 0,
      meal_allowance: parseFloat(b.meal_allowance) || 0,
      overtime_pay: parseFloat(b.overtime_pay) || 0,
      prime_amount: parseFloat(b.prime_amount) || 0,
      other_earnings_amount: parseFloat(b.other_earnings_amount) || 0,
      cimr_rate: parseFloat(b.cimr_rate) || 0,
      family_charges: parseInt(b.family_charges) || 0,
      advance_amount: parseFloat(b.advance_amount) || 0,
      other_deduction_amount: parseFloat(b.other_deduction_amount) || 0,
    };
    const calc = computePayslip(inp);

    // Cumuls YTD
    const ytd = await query(`
      SELECT COALESCE(SUM(gross_salary),0) as gross, COALESCE(SUM(net_salary),0) as net, COALESCE(SUM(igr),0) as igr
      FROM payslips
      WHERE employee_id = $1 AND period_year = $2 AND period_month < $3
    `, [b.employee_id, b.period_year, b.period_month]);

    const ytdGross = parseFloat(ytd.rows[0].gross) + calc.gross_salary;
    const ytdNet   = parseFloat(ytd.rows[0].net) + calc.net_salary;
    const ytdIgr   = parseFloat(ytd.rows[0].igr) + calc.igr;

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
      base_salary: parseFloat(b.base_salary) || 0,
      transport_allowance: parseFloat(b.transport_allowance) || 0,
      meal_allowance: parseFloat(b.meal_allowance) || 0,
      overtime_pay: parseFloat(b.overtime_pay) || 0,
      prime_amount: parseFloat(b.prime_amount) || 0,
      other_earnings_amount: parseFloat(b.other_earnings_amount) || 0,
      cimr_rate: parseFloat(b.cimr_rate) || 0,
      family_charges: parseInt(b.family_charges) || 0,
      advance_amount: parseFloat(b.advance_amount) || 0,
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
    // Générer le PDF si pas encore fait
    let filename: string;
    try {
      filename = await generatePDF(id);
    } catch {
      filename = '';
    }
    await query(`UPDATE payslips SET status='PUBLIE', pdf_path=$1 WHERE id=$2`, [filename, id]);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('publishPayslip error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const downloadPayslipPDF = async (req: Request, res: Response) => {
  const user = req.user as unknown as { userId: string; role: string; email: string };
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, e.email as emp_email, e.matricule
      FROM payslips p JOIN employees e ON e.id = p.employee_id
      WHERE p.id = $1
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Introuvable' });
    const ps = result.rows[0];

    if (!['DRH', 'DIRECTION_GENERALE'].includes(user.role)) {
      if (ps.emp_email !== user.email || ps.status !== 'PUBLIE') {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    // Regénérer le PDF si absent
    if (!ps.pdf_path || !fs.existsSync(path.join(PAYSLIPS_DIR, ps.pdf_path))) {
      const filename = await generatePDF(id);
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
