import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

// ============================================================
// MOTEUR DE PAIE MAROCAIN 2024
// ============================================================

const CNSS_RATE_EMPLOYEE = 0.0448;
const CNSS_CEILING = 6000;           // plafond mensuel FCFA
const CNSS_RATE_EMPLOYER_SOCIAL = 0.0898;  // plafonné
const CNSS_RATE_EMPLOYER_FAMILY = 0.0640;  // non plafonné
const AMO_RATE_EMPLOYEE = 0.0226;
const AMO_RATE_EMPLOYER = 0.0365;
const PROF_DEDUCTION_RATE = 0.20;
const PROF_DEDUCTION_MAX = 2500;     // FCFA/mois (30 000/an)
const FAMILY_DEDUCTION_PER_CHARGE = 30; // FCFA/mois par ayant droit

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

  // CNSS salarié (plafonné à 6 000 FCFA)
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

  // Déduction charges de famille (30 FCFA/mois par ayant droit, max 6)
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

function fmt(n: number | string): string {
  const num = Number(n);
  if (isNaN(num)) return '0,00';
  const [intPart, decPart] = num.toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decPart}`;
}

const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

async function generatePDF(payslipId: string): Promise<string> {
  const res = await query(`
    SELECT p.*,
      e.matricule, e.first_name, e.last_name, e.grade, e.function,
      e.service_line, e.contract_type, e.entry_date
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
      doc.fillColor('#111827').font('Helvetica-Bold').text(`${fmt(amount)} FCFA`, cx + halfW - 76, ly + 4, { width: 72, align: 'right' });
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
      .text(`SALAIRE BRUT : ${fmt(ps.gross_salary)} FCFA`, 44, y + 5)
      .fillColor(red)
      .text(`TOTAL RETENUES : ${fmt(
        parseFloat(ps.cnss_employee) + parseFloat(ps.amo_employee) +
        parseFloat(ps.cimr_employee) + parseFloat(ps.igr) +
        parseFloat(ps.advance_amount) + parseFloat(ps.other_deduction_amount)
      )} FCFA`, 48 + halfW, y + 5);
    y += 24;

    // ── NET À PAYER ───────────────────────────────────────
    doc.rect(40, y, W, 28).fill(navy);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text(`NET À PAYER : ${fmt(ps.net_salary)} FCFA`, 0, y + 8, { align: 'center', width: W + 80 });
    y += 38;

    // ── DÉTAIL IGR ────────────────────────────────────────
    doc.rect(40, y, W, 12).fill(light);
    doc.fillColor('#6b7280').fontSize(7.5).font('Helvetica')
      .text(`Base imposable mensuelle : ${fmt(ps.net_taxable_monthly)} FCFA   |   ` +
        `Déduction prof. (20%) : ${fmt(ps.professional_deduction)} FCFA   |   ` +
        `Charges de famille : ${ps.family_charges} (−${fmt(ps.family_charge_deduction)} FCFA/mois)`, 44, y + 3);
    y += 18;

    // ── COTISATIONS PATRONALES ────────────────────────────
    doc.rect(40, y, W, 12).fill('#f0fdf4');
    const cnssEmpl = parseFloat(ps.cnss_employer);
    const amoEmpl = parseFloat(ps.amo_employer);
    const cimrEmpl = parseFloat(ps.cimr_employer);
    doc.fillColor('#15803d').fontSize(7.5).font('Helvetica')
      .text(`Cotisations patronales (informatif) — CNSS : ${fmt(cnssEmpl)} FCFA  |  AMO : ${fmt(amoEmpl)} FCFA  |  CIMR : ${fmt(cimrEmpl)} FCFA  |  Coût total employeur : ${fmt(parseFloat(ps.gross_salary) + cnssEmpl + amoEmpl + cimrEmpl)} FCFA`, 44, y + 3);
    y += 18;

    // ── CUMULS ANNUELS ────────────────────────────────────
    doc.rect(40, y, W, 12).fill(light);
    doc.fillColor('#374151').fontSize(7.5).font('Helvetica')
      .text(`Cumuls ${ps.period_year} — Brut : ${fmt(ps.annual_gross_ytd)} FCFA  |  Net : ${fmt(ps.annual_net_ytd)} FCFA  |  IGR : ${fmt(ps.annual_igr_ytd)} FCFA`, 44, y + 3);
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
  const { year, month, employee_id, status } = req.query as Record<string, string>;

  try {
    const conds: string[] = [];
    const params: unknown[] = [];

    if (year) { params.push(parseInt(year)); conds.push(`p.period_year = $${params.length}`); }
    if (month) { params.push(parseInt(month)); conds.push(`p.period_month = $${params.length}`); }
    if (employee_id) { params.push(employee_id); conds.push(`p.employee_id = $${params.length}`); }
    if (status) { params.push(status); conds.push(`p.status = $${params.length}`); }
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
  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, e.matricule
      FROM payslips p JOIN employees e ON e.id = p.employee_id
      WHERE p.id = $1
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Introuvable' });
    const ps = result.rows[0];

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

// ============================================================
// MASSE SALARIALE MENSUELLE — GET /payslips/masse-salariale?year=
// ============================================================

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
      month: parseInt(r.month),
      monthLabel: MONTHS_FR[parseInt(r.month)],
      count: parseInt(r.count),
      totalBrut: parseFloat(r.total_brut) || 0,
      totalNet: parseFloat(r.total_net) || 0,
      totalIgr: parseFloat(r.total_igr) || 0,
      totalCnss: parseFloat(r.total_cnss) || 0,
      totalAmo: parseFloat(r.total_amo) || 0,
      totalCnssPatronal: parseFloat(r.total_cnss_patronal) || 0,
    }));

    const totals = {
      totalBrut: months.reduce((s, m) => s + m.totalBrut, 0),
      totalNet: months.reduce((s, m) => s + m.totalNet, 0),
      totalIgr: months.reduce((s, m) => s + m.totalIgr, 0),
      totalCnss: months.reduce((s, m) => s + m.totalCnss, 0),
    };

    return res.json({ year, months, totals });
  } catch (err) {
    logger.error('getMasseSalariale error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// CUMUL ANNUEL PAR EMPLOYÉ — GET /payslips/employee/:id/annual?year=
// ============================================================

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
      month: parseInt(r.period_month),
      monthLabel: MONTHS_FR[parseInt(r.period_month)],
      grossSalary: parseFloat(r.gross_salary) || 0,
      netSalary: parseFloat(r.net_salary) || 0,
      igr: parseFloat(r.igr) || 0,
      cnss: parseFloat(r.cnss_employee) || 0,
      amo: parseFloat(r.amo_employee) || 0,
      cimr: parseFloat(r.cimr_employee) || 0,
    }));

    const cumul = {
      grossSalary: slips.reduce((s, r) => s + r.grossSalary, 0),
      netSalary: slips.reduce((s, r) => s + r.netSalary, 0),
      igr: slips.reduce((s, r) => s + r.igr, 0),
      cnss: slips.reduce((s, r) => s + r.cnss, 0),
      amo: slips.reduce((s, r) => s + r.amo, 0),
      cimr: slips.reduce((s, r) => s + r.cimr, 0),
    };

    return res.json({ employee: emp, year, slips, cumul });
  } catch (err) {
    logger.error('getAnnualSummary error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// ATTESTATION FISCALE (modèle 9421) — GET /payslips/employee/:id/attestation?year=
// ============================================================

async function generateAttestation9421(employeeId: string, year: number): Promise<Buffer> {
  const empResult = await query(`
    SELECT id, matricule, first_name, last_name, grade, function, service_line, entry_date
    FROM employees WHERE id = $1
  `, [employeeId]);
  if (!empResult.rows[0]) throw new Error('Employé introuvable');
  const emp = empResult.rows[0];

  const cumResult = await query(`
    SELECT
      COALESCE(SUM(gross_salary),0)  as total_brut,
      COALESCE(SUM(cnss_employee),0) as total_cnss,
      COALESCE(SUM(amo_employee),0)  as total_amo,
      COALESCE(SUM(cimr_employee),0) as total_cimr,
      COALESCE(SUM(igr),0)           as total_igr,
      COALESCE(SUM(net_salary),0)    as total_net,
      COUNT(*)                       as nb_bulletins
    FROM payslips
    WHERE employee_id = $1 AND period_year = $2
  `, [employeeId, year]);
  const cumul = cumResult.rows[0];

  const profDed = Math.min(parseFloat(cumul.total_brut) * 0.20, 30000);
  const igrBase = Math.max(0, parseFloat(cumul.total_brut) - parseFloat(cumul.total_cnss) - parseFloat(cumul.total_amo) - parseFloat(cumul.total_cimr) - profDed);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pass = new PassThrough();
    const chunks: Buffer[] = [];
    pass.on('data', (c: Buffer) => chunks.push(c));
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);
    doc.on('error', reject);
    doc.pipe(pass);

    const navy = '#1e3a5f';
    const W = doc.page.width - 100;

    // ── En-tête ──
    doc.rect(50, 40, W, 60).fill(navy);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text('FORVIS MAZARS', 62, 52);
    doc.fontSize(9).font('Helvetica')
      .text('Cabinet d\'Audit & Conseil — SGRH', 62, 69);
    doc.fontSize(12).font('Helvetica-Bold')
      .text('ATTESTATION FISCALE', 0, 58, { align: 'right', width: W + 50 });
    doc.fontSize(9).font('Helvetica')
      .text(`Exercice ${year}`, 0, 74, { align: 'right', width: W + 50 });

    // ── Titre modèle ──
    doc.fillColor(navy).fontSize(11).font('Helvetica-Bold')
      .text('Modèle 9421 — Attestation de Revenu Salarial', 50, 120, { align: 'center', width: W });
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
      .text('(Article 79 et 81 du Code Général des Impôts)', 50, 136, { align: 'center', width: W });

    let y = 162;

    // ── Employeur ──
    doc.rect(50, y, W, 14).fill('#e5e7eb');
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold').text('EMPLOYEUR', 56, y + 3);
    y += 18;

    const row = (label: string, val: string, ly: number) => {
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(label, 56, ly);
      doc.fillColor('#111827').fontSize(9).font('Helvetica').text(val, 200, ly);
    };
    row('Raison sociale :', 'FORVIS MAZARS', y); y += 14;
    row('Identifiant fiscal :', 'IF-00000000', y); y += 14;
    row('CNSS employeur :', '0000000', y); y += 20;

    // ── Employé ──
    doc.rect(50, y, W, 14).fill('#e5e7eb');
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold').text('BÉNÉFICIAIRE', 56, y + 3);
    y += 18;

    row('Nom & Prénom :', `${emp.last_name} ${emp.first_name}`, y); y += 14;
    row('Matricule :', emp.matricule || '—', y); y += 14;
    row('CIN :', '—', y); y += 14;
    row('Fonction :', emp.function || '—', y); y += 20;

    // ── Tableau récapitulatif ──
    doc.rect(50, y, W, 14).fill(navy);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('RÉCAPITULATIF DES RÉMUNÉRATIONS', 56, y + 3);
    y += 18;

    const tableLines: [string, number][] = [
      ['Salaire brut imposable', parseFloat(cumul.total_brut)],
      ['Cotisations CNSS salarié', parseFloat(cumul.total_cnss)],
      ['Cotisations AMO salarié', parseFloat(cumul.total_amo)],
      ['Cotisations CIMR salarié', parseFloat(cumul.total_cimr)],
      ['Déduction frais professionnels (20%)', profDed],
      ['Base imposable (revenu net taxable)', igrBase],
      ['Impôt sur le Revenu (IGR) retenu à la source', parseFloat(cumul.total_igr)],
      ['Net total versé', parseFloat(cumul.total_net)],
    ];

    tableLines.forEach(([label, amount], i) => {
      const isHighlight = i === tableLines.length - 1 || i === tableLines.length - 2;
      if (isHighlight) doc.rect(50, y, W, 16).fill('#dbeafe');
      else if (i % 2 === 0) doc.rect(50, y, W, 16).fill('#f9fafb');
      doc.fillColor('#374151').fontSize(9).font('Helvetica').text(label, 56, y + 4, { width: W - 120 });
      doc.fillColor(isHighlight ? navy : '#111827').font('Helvetica-Bold')
        .text(`${fmt(amount)} FCFA`, 50, y + 4, { align: 'right', width: W });
      y += 16;
    });

    y += 20;
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
      .text(`Nombre de bulletins émis : ${cumul.nb_bulletins} — Exercice ${year}`, 50, y, { align: 'center', width: W });

    // ── Signature ──
    y += 30;
    doc.rect(50, y, W / 2 - 10, 60).stroke('#e5e7eb');
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold').text('CACHET ET SIGNATURE DU RESPONSABLE RH', 56, y + 4);
    doc.rect(50 + W / 2 + 10, y, W / 2 - 10, 60).stroke('#e5e7eb');
    doc.fillColor(navy).fontSize(9).font('Helvetica-Bold').text('ATTESTATION REÇUE PAR LE BÉNÉFICIAIRE', 56 + W / 2 + 10, y + 4);

    y += 75;
    doc.fillColor('#9ca3af').fontSize(7.5).font('Helvetica')
      .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — SGRH Forvis Mazars`, 50, y, { align: 'center', width: W });

    doc.end();
  });
}

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
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('downloadAttestation error — ' + msg, err);
    return res.status(500).json({ error: `Erreur génération attestation: ${msg}` });
  }
};

// ============================================================
// EXPORT EXCEL MASSE SALARIALE — GET /payslips/masse-salariale/export?year=
// ============================================================

export const exportMasseSalarialeExcel = async (req: Request, res: Response) => {
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
        SUM(cimr_employee) as total_cimr,
        SUM(cnss_employer) as total_cnss_patronal,
        SUM(amo_employer)  as total_amo_patronal
      FROM payslips
      WHERE period_year = $1
      GROUP BY period_month
      ORDER BY period_month
    `, [year]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SGRH Cabinet';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Masse salariale ${year}`);
    sheet.properties.defaultRowHeight = 18;

    // Colonnes
    sheet.columns = [
      { header: 'Mois',              key: 'month',     width: 16 },
      { header: 'Bulletins',         key: 'count',     width: 12 },
      { header: 'Total brut (FCFA)',  key: 'brut',      width: 20 },
      { header: 'Total net (FCFA)',   key: 'net',       width: 20 },
      { header: 'IGR total (FCFA)',   key: 'igr',       width: 18 },
      { header: 'CNSS salarié',      key: 'cnss',      width: 16 },
      { header: 'AMO salarié',       key: 'amo',       width: 16 },
      { header: 'CIMR salarié',      key: 'cimr',      width: 16 },
      { header: 'CNSS patronal',     key: 'cnss_pat',  width: 16 },
      { header: 'AMO patronal',      key: 'amo_pat',   width: 16 },
    ];

    // Style en-tête
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    const numFmt = '#,##0.00';
    let totalBrut = 0, totalNet = 0, totalIgr = 0, totalCnss = 0, totalAmo = 0;

    result.rows.forEach((r, i) => {
      const brut  = parseFloat(r.total_brut) || 0;
      const net   = parseFloat(r.total_net) || 0;
      const igr   = parseFloat(r.total_igr) || 0;
      const cnss  = parseFloat(r.total_cnss) || 0;
      const amo   = parseFloat(r.total_amo) || 0;
      const cimr  = parseFloat(r.total_cimr) || 0;
      const cPat  = parseFloat(r.total_cnss_patronal) || 0;
      const aPat  = parseFloat(r.total_amo_patronal) || 0;
      totalBrut += brut; totalNet += net; totalIgr += igr; totalCnss += cnss; totalAmo += amo;

      const row = sheet.addRow({
        month: MONTHS_FR[parseInt(r.month)],
        count: parseInt(r.count),
        brut, net, igr, cnss, amo, cimr, cnss_pat: cPat, amo_pat: aPat,
      });
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } };
      }
      ['brut','net','igr','cnss','amo','cimr','cnss_pat','amo_pat'].forEach(k => {
        const cell = row.getCell(k);
        cell.numFmt = numFmt;
        cell.alignment = { horizontal: 'right' };
      });
    });

    // Ligne de total
    const totalRow = sheet.addRow({
      month: `TOTAL ${year}`,
      count: result.rows.reduce((s, r) => s + parseInt(r.count), 0),
      brut: totalBrut, net: totalNet, igr: totalIgr, cnss: totalCnss, amo: totalAmo,
      cimr: 0, cnss_pat: 0, amo_pat: 0,
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    ['brut','net','igr','cnss','amo','cimr','cnss_pat','amo_pat'].forEach(k => {
      totalRow.getCell(k).numFmt = numFmt;
    });

    // Feuille détail par employé
    const detailSheet = workbook.addWorksheet('Détail par collaborateur');
    const detailRes = await query(`
      SELECT
        e.matricule, e.last_name, e.first_name, e.grade, e.service_line,
        p.period_month,
        p.gross_salary, p.net_salary, p.igr, p.cnss_employee, p.amo_employee, p.cimr_employee
      FROM payslips p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.period_year = $1
      ORDER BY e.last_name, e.first_name, p.period_month
    `, [year]);

    detailSheet.columns = [
      { header: 'Matricule',    key: 'mat',   width: 14 },
      { header: 'Nom',          key: 'ln',    width: 18 },
      { header: 'Prénom',       key: 'fn',    width: 18 },
      { header: 'Grade',        key: 'gr',    width: 22 },
      { header: 'Ligne service',key: 'sl',    width: 22 },
      { header: 'Mois',         key: 'mo',    width: 12 },
      { header: 'Brut',         key: 'brut',  width: 16 },
      { header: 'Net',          key: 'net',   width: 16 },
      { header: 'IGR',          key: 'igr',   width: 14 },
      { header: 'CNSS',         key: 'cnss',  width: 14 },
      { header: 'AMO',          key: 'amo',   width: 14 },
      { header: 'CIMR',         key: 'cimr',  width: 14 },
    ];
    const dh = detailSheet.getRow(1);
    dh.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    dh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    dh.height = 20;

    detailRes.rows.forEach((r, i) => {
      const row = detailSheet.addRow({
        mat: r.matricule, ln: r.last_name, fn: r.first_name, gr: r.grade, sl: r.service_line,
        mo: MONTHS_FR[parseInt(r.period_month)],
        brut: parseFloat(r.gross_salary), net: parseFloat(r.net_salary),
        igr: parseFloat(r.igr), cnss: parseFloat(r.cnss_employee),
        amo: parseFloat(r.amo_employee), cimr: parseFloat(r.cimr_employee),
      });
      if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } };
      ['brut','net','igr','cnss','amo','cimr'].forEach(k => {
        row.getCell(k).numFmt = numFmt;
        row.getCell(k).alignment = { horizontal: 'right' };
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="masse_salariale_${year}.xlsx"`);
    return res.send(buf);
  } catch (err) {
    logger.error('exportMasseSalarialeExcel error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
