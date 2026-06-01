import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ─── Labels ───────────────────────────────────────────────────────────────────

const GRADE_LABELS: Record<string, string> = {
  ASSISTANT_DEBUTANT:  'Assistant débutant',
  ASSISTANT_CONFIRME:  'Assistant confirmé',
  JUNIOR:              'Junior',
  SENIOR_1:            'Sénior 1',
  SENIOR_2:            'Sénior 2',
  SENIOR_3:            'Sénior 3',
  CONSULTANT:          'Sénior Consultant',
  ASSISTANT_MANAGER_1: 'Manager 1',
  ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_3: 'Manager 3',
  SENIOR_MANAGER_1:    'Sénior Manager 1',
  SENIOR_MANAGER_2:    'Sénior Manager 2',
  SENIOR_MANAGER_3:    'Sénior Manager 3',
  DIRECTEUR:           'Directeur',
  ASSOCIE:             'Associé',
};

const SL_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE:     'Audit & Assurances',
  CONSULTING_FA:       'Consulting & FA',
  OUTSOURCING:         'Outsourcing',
  ADMINISTRATION:      'Administration',
  JURIDIQUE_FISCALITE: 'Tax & Legal',
};

const SL_KEYS = ['AUDIT_ASSURANCE', 'ADMINISTRATION', 'CONSULTING_FA', 'OUTSOURCING', 'JURIDIQUE_FISCALITE'];

const DR_LABELS: Record<string, string> = {
  NOUVELLES_OPPORTUNITES: 'Nouvelles opportunités',
  RAISONS_PERSONNELLES:   'Raisons personnelles',
  REMUNERATION:           'Rémunération',
  MANAGEMENT:             'Management',
  AUTRES:                 'Autres',
};

const DR_FR = ['Nouvelles opportunités', 'Raisons personnelles', 'Rémunération', 'Management', 'Autres'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

function toContractCategory(ct: string): string {
  if (ct === 'STAGE') return 'Stagiaire';
  if (ct === 'CONSULTANT' || ct === 'FREELANCE') return 'Consultant';
  return 'Permanent';
}

function toGenderLabel(g: string): string {
  return g === 'M' ? 'Homme' : 'Dame';
}

function isVoluntary(reason: string): boolean {
  return ['NOUVELLES_OPPORTUNITES', 'RAISONS_PERSONNELLES', 'REMUNERATION', 'MANAGEMENT'].includes(reason);
}

function activeAt(r: any, ref: Date): boolean {
  const entry = new Date(r.entry_date);
  const exit  = r.exit_date ? new Date(r.exit_date) : null;
  return entry <= ref && (!exit || exit > ref);
}

function departedIn(r: any, from: Date, to: Date): boolean {
  if (!r.exit_date) return false;
  const d = new Date(r.exit_date);
  return d > from && d <= to;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const NAVY     = 'FF1E3A5F';
const WHITE    = 'FFFFFFFF';
const ALT      = 'FFF0F4FA';
const TOTAL_BG = 'FFD0DCEB';
const SECT_BG  = 'FFE5EEF5';
const BORDER_C = 'FFB8C8D6';
const DEPART_BG= 'FFFFF4E6';
const RED_TXT  = 'FFDC2626';
const BLUE_TXT = 'FF1D4ED8';
const GREY_TXT = 'FF888888';

// ─── Style helpers ────────────────────────────────────────────────────────────

const thin: ExcelJS.Border = { style: 'thin', color: { argb: BORDER_C } };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

const S = {
  title: (size = 12): Partial<ExcelJS.Style> => ({
    font:      { bold: true, size, color: { argb: WHITE } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  }),
  hdr: (): Partial<ExcelJS.Style> => ({
    font:      { bold: true, size: 10, color: { argb: WHITE } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border:    borders,
  }),
  sect: (): Partial<ExcelJS.Style> => ({
    font:      { bold: true, size: 10, color: { argb: NAVY } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: SECT_BG } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border:    borders,
  }),
  data: (alt: boolean, align: 'left'|'center' = 'center', bg?: string): Partial<ExcelJS.Style> => ({
    font:      { size: 9 },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bg ?? (alt ? ALT : WHITE) } },
    alignment: { horizontal: align, vertical: 'middle', wrapText: align === 'left' },
    border:    borders,
  }),
  pct: (alt: boolean): Partial<ExcelJS.Style> => ({ ...S.data(alt), numFmt: '0.0%' }),
  tot: (align: 'left'|'center' = 'center'): Partial<ExcelJS.Style> => ({
    font:      { bold: true, size: 10, color: { argb: NAVY } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } },
    alignment: { horizontal: align, vertical: 'middle' },
    border:    borders,
  }),
  totPct: (): Partial<ExcelJS.Style> => ({ ...S.tot(), numFmt: '0.0%' }),
  note: (): Partial<ExcelJS.Style> => ({
    font:      { italic: true, size: 9, color: { argb: GREY_TXT } },
    alignment: { horizontal: 'left' },
  }),
  param: (alt: boolean, bold = false, color = 'FF000000'): Partial<ExcelJS.Style> => ({
    font:      { size: 10, bold, color: { argb: color } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? ALT : WHITE } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border:    borders,
  }),
  paramVal: (alt: boolean, bold = false): Partial<ExcelJS.Style> => ({
    font:      { size: 10, bold, color: { argb: NAVY } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? ALT : WHITE } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border:    borders,
  }),
};

function ap(cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>) {
  cell.style = style as ExcelJS.Style;
}

// ExcelJS formulas: no leading '='
function f(cell: ExcelJS.Cell, formula: string, result?: ExcelJS.CellValue) {
  cell.value = (result !== undefined
    ? { formula, result } as ExcelJS.CellFormulaValue
    : { formula }       as ExcelJS.CellFormulaValue);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateMonthlyReport = async (year: number, _month: number): Promise<string> => {
  // Forvis Mazars fiscal year: June 1 (year-1) → May 31 (year)
  const endN  = new Date(year,     4, 31); // 31 Mai N
  const endN1 = new Date(year - 1, 4, 31); // 31 Mai N-1
  const endN2 = new Date(year - 2, 4, 31); // 31 Mai N-2

  const rows = (await query(`
    SELECT id, matricule, first_name, last_name,
      entry_date, birth_date, gender, grade,
      service_line, contract_type, exit_date, departure_reason
    FROM employees ORDER BY last_name, first_name
  `)).rows;

  const departures = rows
    .filter(r => departedIn(r, endN2, endN1) || departedIn(r, endN1, endN))
    .sort((a, b) => new Date(b.exit_date).getTime() - new Date(a.exit_date).getTime());

  // Pre-compute cached values for formula results
  const empN   = rows.filter(r => activeAt(r, endN));
  const empN1  = rows.filter(r => activeAt(r, endN1));
  const empN2  = rows.filter(r => activeAt(r, endN2));
  const depN   = rows.filter(r => departedIn(r, endN1, endN));
  const depN1  = rows.filter(r => departedIn(r, endN2, endN1));

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'SGRH Cabinet – Forvis Mazars BF';
  wb.created  = new Date();
  wb.modified = new Date();

  sheetParametres(wb, year);
  sheetListePersonnel(wb, rows, endN);
  sheetEffectifs(wb, year, empN, empN1);
  sheetMouvements(wb, departures);
  sheetParDepartement(wb, year, empN, empN1);
  sheetTranchesAge(wb, empN, endN);
  sheetTurnOver(wb, year, empN, empN1, empN2, depN, depN1);
  sheetMotifsDépart(wb, year, depN, depN1);

  const dir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `Reporting_RH_ForvisMazars_BF_${year}.xlsx`;
  const filePath = path.join(dir, filename);
  await wb.xlsx.writeFile(filePath);
  logger.info(`Rapport RH Forvis Mazars généré : ${filePath}`);
  return filePath;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 1 — Paramètres
// ─────────────────────────────────────────────────────────────────────────────
function sheetParametres(wb: ExcelJS.Workbook, year: number) {
  const sh = wb.addWorksheet('Paramètres');
  sh.getColumn('A').width = 44;
  sh.getColumn('B').width = 24;

  sh.mergeCells('A1:B1');
  ap(sh.getCell('A1'), S.title(13));
  sh.getCell('A1').value = 'PARAMÈTRES – REPORTING RH';
  sh.getRow(1).height = 32;

  sh.getRow(2).height = 8;

  sh.mergeCells('A3:B3');
  sh.getCell('A3').value = '⚙  Seule cellule à modifier chaque année :';
  ap(sh.getCell('A3'), S.note());
  sh.getRow(3).height = 16;

  // B4 = seul paramètre manuel
  sh.getCell('A4').value = 'Année de référence';
  sh.getCell('B4').value = year;
  ap(sh.getCell('A4'), S.param(false, true));
  ap(sh.getCell('B4'), S.paramVal(false, true));
  sh.getRow(4).height = 20;

  // B5-B11 : formules (référence exacte)
  const fmtDate = 'DD/MM/YYYY';
  const items: [number, string, string, boolean][] = [
    [5,  'Date fin période N  (31/05/N)',     'DATE(B4,5,31)',    true],
    [6,  'Date fin période N-1 (31/05/N-1)', 'DATE(B4-1,5,31)', true],
    [7,  'Date début période N  (01/06/N-1)','DATE(B4-1,6,1)',  true],
    [8,  'Date début période N-1 (01/06/N-2)','DATE(B4-2,6,1)', true],
    [9,  'Date fin période N-2 (31/05/N-2)', 'DATE(B4-2,5,31)', true],
    [10, 'Libellé période N',                '"Mai "&B4',        false],
    [11, 'Libellé période N-1',              '"Mai "&(B4-1)',    false],
  ];

  // Pre-compute cached results for date/label formulas so static viewers show values
  const cachedResults: Record<number, ExcelJS.CellValue> = {
    5:  new Date(year,     4, 31),  // DATE(B4,5,31)
    6:  new Date(year - 1, 4, 31),  // DATE(B4-1,5,31)
    7:  new Date(year - 1, 5,  1),  // DATE(B4-1,6,1)
    8:  new Date(year - 2, 5,  1),  // DATE(B4-2,6,1)
    9:  new Date(year - 2, 4, 31),  // DATE(B4-2,5,31)
    10: `Mai ${year}`,              // "Mai "&B4
    11: `Mai ${year - 1}`,          // "Mai "&(B4-1)
  };

  items.forEach(([rn, label, formula, isDate], i) => {
    const alt = i % 2 === 0;
    sh.getCell(`A${rn}`).value = label;
    ap(sh.getCell(`A${rn}`), S.param(alt));
    f(sh.getCell(`B${rn}`), formula, cachedResults[rn]);
    const vs = { ...S.paramVal(alt) } as ExcelJS.Style;
    if (isDate) (vs as any).numFmt = fmtDate;
    ap(sh.getCell(`B${rn}`), vs);
    sh.getRow(rn).height = 20;
  });

  sh.getRow(12).height = 16;
  sh.mergeCells('A12:B12');
  sh.getCell('A12').value = '→ Changer uniquement B4 pour basculer le reporting sur une nouvelle année.';
  ap(sh.getCell('A12'), S.note());
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 2 — Liste Personnel  (données DB + formule âge colonne K)
// ─────────────────────────────────────────────────────────────────────────────
function sheetListePersonnel(wb: ExcelJS.Workbook, rows: any[], endN: Date) {
  const sh = wb.addWorksheet('Liste Personnel');
  [5, 32, 13, 14, 8, 22, 22, 13, 14, 36, 6].forEach((w, i) => sh.getColumn(i + 1).width = w);

  // A1 : formule référençant Paramètres
  sh.mergeCells('A1:K1');
  ap(sh.getCell('A1'), S.title(12));
  f(sh.getCell('A1'), '"LISTE DU PERSONNEL – FIN "&Paramètres!$B$10', `LISTE DU PERSONNEL – FIN Mai ${endN.getFullYear()}`);
  sh.getRow(1).height = 28;

  const HEADERS = ['N°','Nom et Prénoms',"Date d'Entrée",'Date de Naissance',
    'Genre','Grade','Département','Catégorie','Date de sortie','Motif','Âge'];
  const hRow = sh.addRow(HEADERS);
  hRow.eachCell(c => ap(c, S.hdr()));
  sh.getRow(2).height = 22;

  rows.forEach((emp, idx) => {
    const birth  = emp.birth_date ? new Date(emp.birth_date) : null;
    const exit   = emp.exit_date  ? new Date(emp.exit_date)  : null;
    const entry  = emp.entry_date ? new Date(emp.entry_date) : null;
    const age    = birth ? calcAge(birth, endN) : null;
    const isGone = exit && exit <= endN;
    const bg     = isGone ? DEPART_BG : (idx % 2 === 1 ? ALT : WHITE);
    const dr     = emp.departure_reason ? (DR_LABELS[emp.departure_reason] ?? emp.departure_reason) : '';
    const rn     = idx + 3;

    const row = sh.addRow([
      idx + 1,
      `${emp.last_name} ${emp.first_name}`,
      entry  ?? '',
      birth  ?? '',
      toGenderLabel(emp.gender || ''),
      GRADE_LABELS[emp.grade] ?? emp.grade ?? '',
      SL_LABELS[emp.service_line] ?? emp.service_line ?? '',
      toContractCategory(emp.contract_type || ''),
      exit   ?? '',
      dr,
      '', // placeholder — formula set below
    ]);

    const base: Partial<ExcelJS.Style> = {
      font:   { size: 9, italic: !!isGone },
      fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: borders,
    };
    [1, 5, 8].forEach(ci => {
      row.getCell(ci).style = { ...base, alignment: { horizontal: 'center', vertical: 'middle' } } as ExcelJS.Style;
    });
    [2, 6, 7, 10].forEach(ci => {
      row.getCell(ci).style = { ...base, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } } as ExcelJS.Style;
    });
    [3, 4, 9].forEach(ci => {
      row.getCell(ci).style = { ...base, alignment: { horizontal: 'center', vertical: 'middle' }, numFmt: 'DD/MM/YYYY' } as ExcelJS.Style;
    });
    // Colonne K : formule âge (DATEDIF) — IFERROR gère les dates vides ou invalides
    const kCell = sh.getRow(rn).getCell(11);
    f(kCell, `IFERROR(DATEDIF(D${rn},Paramètres!$B$5,"Y"),"")`, age !== null ? age : '');
    kCell.style = { ...base, alignment: { horizontal: 'center', vertical: 'middle' } } as ExcelJS.Style;

    sh.getRow(rn).height = 16;
  });

  sh.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3' }];
  sh.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 11 } };
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 3 — Effectifs  (COUNTIFS dynamiques)
// ─────────────────────────────────────────────────────────────────────────────
function sheetEffectifs(wb: ExcelJS.Workbook, year: number, empN: any[], empN1: any[]) {
  const sh = wb.addWorksheet('Effectifs');
  [30, 16, 16, 13, 13].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  ap(sh.getCell('A1'), S.title(12));
  sh.getCell('A1').value = 'EFFECTIFS – FORVIS MAZARS BURKINA FASO';
  sh.getRow(1).height = 28;

  // ── Section 1 : Effectif total ──────────────────────────────────────────
  sh.getRow(2).height = 8;

  sh.mergeCells('A3:E3');
  ap(sh.getCell('A3'), S.sect());
  sh.getCell('A3').value = '1. EFFECTIF TOTAL (HORS STAGIAIRES ÉCOLE)';
  sh.getRow(3).height = 20;

  // Row 4 : headers avec formules sur les libellés colonnes
  sh.getCell('A4').value = 'Catégorie';
  ap(sh.getCell('A4'), S.hdr());
  f(sh.getCell('B4'), '"Fin "&Paramètres!$B$10', `Fin Mai ${year}`);
  ap(sh.getCell('B4'), S.hdr());
  f(sh.getCell('C4'), '"Fin "&Paramètres!$B$11', `Fin Mai ${year - 1}`);
  ap(sh.getCell('C4'), S.hdr());
  sh.getCell('D4').value = 'Variation';
  ap(sh.getCell('D4'), S.hdr());
  sh.getCell('E4').value = '% Variation';
  ap(sh.getCell('E4'), S.hdr());
  sh.getRow(4).height = 20;

  const LP = "'Liste Personnel'";
  const PR = 'Paramètres';

  // Permanents (row 5)
  const permN  = empN.filter(r => ['CDI','CDD'].includes(r.contract_type)).length;
  const permN1 = empN1.filter(r => ['CDI','CDD'].includes(r.contract_type)).length;
  sh.getCell('A5').value = 'Permanents';
  ap(sh.getCell('A5'), S.data(false, 'left'));
  f(sh.getCell('B5'), `COUNTIFS(${LP}!H3:H200,"Permanent",${LP}!I3:I200,"")`, permN);
  ap(sh.getCell('B5'), S.data(false));
  f(sh.getCell('C5'),
    `COUNTIFS(${LP}!H3:H200,"Permanent",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!H3:H200,"Permanent",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
    permN1);
  ap(sh.getCell('C5'), S.data(false));
  f(sh.getCell('D5'), 'B5-C5', permN - permN1);
  ap(sh.getCell('D5'), {
    ...S.data(false),
    font: { size: 9, color: { argb: (permN - permN1) >= 0 ? BLUE_TXT : RED_TXT }, bold: true },
  } as ExcelJS.Style);
  f(sh.getCell('E5'), 'IFERROR((B5-C5)/C5,0)', permN1 > 0 ? (permN - permN1) / permN1 : 0);
  ap(sh.getCell('E5'), S.pct(false));
  sh.getRow(5).height = 18;

  // Consultants (row 6)
  const consN  = empN.filter(r => ['CONSULTANT','FREELANCE'].includes(r.contract_type)).length;
  const consN1 = empN1.filter(r => ['CONSULTANT','FREELANCE'].includes(r.contract_type)).length;
  sh.getCell('A6').value = 'Consultants';
  ap(sh.getCell('A6'), S.data(true, 'left'));
  f(sh.getCell('B6'), `COUNTIFS(${LP}!H3:H200,"Consultant",${LP}!I3:I200,"")`, consN);
  ap(sh.getCell('B6'), S.data(true));
  f(sh.getCell('C6'),
    `COUNTIFS(${LP}!H3:H200,"Consultant",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!H3:H200,"Consultant",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
    consN1);
  ap(sh.getCell('C6'), S.data(true));
  f(sh.getCell('D6'), 'B6-C6', consN - consN1);
  ap(sh.getCell('D6'), {
    ...S.data(true),
    font: { size: 9, color: { argb: (consN - consN1) >= 0 ? BLUE_TXT : RED_TXT }, bold: true },
  } as ExcelJS.Style);
  f(sh.getCell('E6'), 'IFERROR((B6-C6)/C6,0)', consN1 > 0 ? (consN - consN1) / consN1 : 0);
  ap(sh.getCell('E6'), S.pct(true));
  sh.getRow(6).height = 18;

  // Total (row 7)
  const totN  = permN  + consN;
  const totN1 = permN1 + consN1;
  sh.getCell('A7').value = 'TOTAL GÉNÉRAL';
  ap(sh.getCell('A7'), S.tot('left'));
  f(sh.getCell('B7'), 'B5+B6', totN);
  ap(sh.getCell('B7'), S.tot());
  f(sh.getCell('C7'), 'C5+C6', totN1);
  ap(sh.getCell('C7'), S.tot());
  f(sh.getCell('D7'), 'B7-C7', totN - totN1);
  ap(sh.getCell('D7'), S.tot());
  f(sh.getCell('E7'), 'IFERROR((B7-C7)/C7,0)', totN1 > 0 ? (totN - totN1) / totN1 : 0);
  ap(sh.getCell('E7'), S.totPct());
  sh.getRow(7).height = 18;

  // ── Section 2 : Répartition H/F ────────────────────────────────────────
  sh.getRow(8).height = 8;

  sh.mergeCells('A9:E9');
  ap(sh.getCell('A9'), S.sect());
  sh.getCell('A9').value = '2. RÉPARTITION HOMMES / FEMMES';
  sh.getRow(9).height = 20;

  sh.getCell('A10').value = 'Genre';
  ap(sh.getCell('A10'), S.hdr());
  f(sh.getCell('B10'), '"Fin "&Paramètres!$B$10', `Fin Mai ${year}`);
  ap(sh.getCell('B10'), S.hdr());
  f(sh.getCell('C10'), '"% "&Paramètres!$B$10', `% Mai ${year}`);
  ap(sh.getCell('C10'), S.hdr());
  f(sh.getCell('D10'), '"Fin "&Paramètres!$B$11', `Fin Mai ${year - 1}`);
  ap(sh.getCell('D10'), S.hdr());
  f(sh.getCell('E10'), '"% "&Paramètres!$B$11', `% Mai ${year - 1}`);
  ap(sh.getCell('E10'), S.hdr());
  sh.getRow(10).height = 20;

  const nonStage = (r: any) => r.contract_type !== 'STAGE';
  const hN  = empN.filter(nonStage).filter(r => r.gender === 'M').length;
  const hN1 = empN1.filter(nonStage).filter(r => r.gender === 'M').length;
  const fN  = empN.filter(nonStage).filter(r => r.gender === 'F').length;
  const fN1 = empN1.filter(nonStage).filter(r => r.gender === 'F').length;
  const gTotN  = hN  + fN  || 1;
  const gTotN1 = hN1 + fN1 || 1;

  // Hommes row 11
  sh.getCell('A11').value = 'Hommes';
  ap(sh.getCell('A11'), S.data(false, 'left'));
  f(sh.getCell('B11'), `COUNTIFS(${LP}!E3:E200,"Homme",${LP}!I3:I200,"")`, hN);
  ap(sh.getCell('B11'), S.data(false));
  f(sh.getCell('C11'), 'IFERROR(B11/B$13,0)', hN / gTotN);
  ap(sh.getCell('C11'), S.pct(false));
  f(sh.getCell('D11'),
    `COUNTIFS(${LP}!E3:E200,"Homme",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!E3:E200,"Homme",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
    hN1);
  ap(sh.getCell('D11'), S.data(false));
  f(sh.getCell('E11'), 'IFERROR(D11/D$13,0)', hN1 / gTotN1);
  ap(sh.getCell('E11'), S.pct(false));
  sh.getRow(11).height = 18;

  // Femmes row 12
  sh.getCell('A12').value = 'Femmes';
  ap(sh.getCell('A12'), S.data(true, 'left'));
  f(sh.getCell('B12'), `COUNTIFS(${LP}!E3:E200,"Dame",${LP}!I3:I200,"")`, fN);
  ap(sh.getCell('B12'), S.data(true));
  f(sh.getCell('C12'), 'IFERROR(B12/B$13,0)', fN / gTotN);
  ap(sh.getCell('C12'), S.pct(true));
  f(sh.getCell('D12'),
    `COUNTIFS(${LP}!E3:E200,"Dame",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!E3:E200,"Dame",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
    fN1);
  ap(sh.getCell('D12'), S.data(true));
  f(sh.getCell('E12'), 'IFERROR(D12/D$13,0)', fN1 / gTotN1);
  ap(sh.getCell('E12'), S.pct(true));
  sh.getRow(12).height = 18;

  // Total row 13
  sh.getCell('A13').value = 'TOTAL';
  ap(sh.getCell('A13'), S.tot('left'));
  f(sh.getCell('B13'), 'B11+B12', hN + fN);
  ap(sh.getCell('B13'), S.tot());
  f(sh.getCell('C13'), 'IFERROR(B13/B$13,0)', 1);
  ap(sh.getCell('C13'), S.totPct());
  f(sh.getCell('D13'), 'D11+D12', hN1 + fN1);
  ap(sh.getCell('D13'), S.tot());
  f(sh.getCell('E13'), 'IFERROR(D13/D$13,0)', 1);
  ap(sh.getCell('E13'), S.totPct());
  sh.getRow(13).height = 18;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 4 — Mouvements  (colonne G = formule période dynamique)
// ─────────────────────────────────────────────────────────────────────────────
function sheetMouvements(wb: ExcelJS.Workbook, departures: any[]) {
  const sh = wb.addWorksheet('Mouvements');
  [5, 32, 14, 30, 14, 13, 20].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:G1');
  ap(sh.getCell('A1'), S.title(12));
  sh.getCell('A1').value = 'MOUVEMENTS DU PERSONNEL – DÉPARTS';
  sh.getRow(1).height = 28;

  const hRow = sh.addRow(['N°','Nom et Prénoms','Date de Départ','Motif de Départ','Type de Départ','Remplacé (O/N)','Période']);
  hRow.eachCell(c => ap(c, S.hdr()));
  sh.getRow(2).height = 22;

  departures.forEach((dep, idx) => {
    const rn  = idx + 3;
    const alt = idx % 2 === 1;
    const vol = isVoluntary(dep.departure_reason || '');
    const dr  = dep.departure_reason ? (DR_LABELS[dep.departure_reason] ?? dep.departure_reason) : '—';

    sh.getCell(`A${rn}`).value = idx + 1;
    ap(sh.getCell(`A${rn}`), S.data(alt));

    sh.getCell(`B${rn}`).value = `${dep.last_name} ${dep.first_name}`;
    ap(sh.getCell(`B${rn}`), S.data(alt, 'left'));

    sh.getCell(`C${rn}`).value = dep.exit_date ? new Date(dep.exit_date) : '';
    sh.getCell(`C${rn}`).style = { ...S.data(alt), numFmt: 'DD/MM/YYYY' } as ExcelJS.Style;

    sh.getCell(`D${rn}`).value = dr;
    ap(sh.getCell(`D${rn}`), S.data(alt, 'left'));

    sh.getCell(`E${rn}`).value = dep.departure_reason ? (vol ? 'Volontaire' : 'Involontaire') : '—';
    sh.getCell(`E${rn}`).style = {
      ...S.data(alt),
      font: { size: 9, bold: true, color: { argb: vol ? BLUE_TXT : RED_TXT } },
    } as ExcelJS.Style;

    sh.getCell(`F${rn}`).value = '—';
    ap(sh.getCell(`F${rn}`), S.data(alt));

    // Colonne G : formule dynamique — rattache la période selon la date de départ
    f(sh.getCell(`G${rn}`),
      `IF(C${rn}="","",IF(AND(C${rn}>=Paramètres!$B$8,C${rn}<=Paramètres!$B$6),Paramètres!$B$11,`+
      `IF(AND(C${rn}>=Paramètres!$B$7,C${rn}<=Paramètres!$B$5),Paramètres!$B$10,"Autre")))`
    );
    ap(sh.getCell(`G${rn}`), S.data(alt));

    sh.getRow(rn).height = 16;
  });

  if (departures.length === 0) {
    const er = sh.addRow(['','Aucun départ enregistré.','','','','','']);
    ap(er.getCell(2), S.data(false, 'left'));
  }

  const noteRn = Math.max(departures.length, 1) + 4;
  sh.getRow(noteRn).height = 10;
  sh.mergeCells(`A${noteRn + 1}:G${noteRn + 1}`);
  sh.getCell(`A${noteRn + 1}`).value =
    "Saisir : Date | Motif | Type (Volontaire/Involontaire) | Remplacé (O/N). La colonne Période se calcule automatiquement.";
  ap(sh.getCell(`A${noteRn + 1}`), S.note());
  sh.getRow(noteRn + 1).height = 20;

  sh.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3' }];
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 5 — Par Département  (COUNTIFS dynamiques)
// ─────────────────────────────────────────────────────────────────────────────
function sheetParDepartement(wb: ExcelJS.Workbook, year: number, empN: any[], empN1: any[]) {
  const sh = wb.addWorksheet('Par Département');
  [28, 14, 18, 14, 18].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  ap(sh.getCell('A1'), S.title(12));
  sh.getCell('A1').value = 'EFFECTIFS PAR DÉPARTEMENT';
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  // Row 3 : headers avec formules
  sh.getCell('A3').value = 'Département';
  ap(sh.getCell('A3'), S.hdr());
  f(sh.getCell('B3'), '"Fin "&Paramètres!$B$10', `Fin Mai ${year}`);
  ap(sh.getCell('B3'), S.hdr());
  f(sh.getCell('C3'), '"% Total "&Paramètres!$B$4', `% Total ${year}`);
  ap(sh.getCell('C3'), S.hdr());
  f(sh.getCell('D3'), '"Fin "&Paramètres!$B$11', `Fin Mai ${year - 1}`);
  ap(sh.getCell('D3'), S.hdr());
  f(sh.getCell('E3'), '"% Total "&(Paramètres!$B$4-1)', `% Total ${year - 1}`);
  ap(sh.getCell('E3'), S.hdr());
  sh.getRow(3).height = 22;

  // Total row = row 9 (3 header + 5 depts = rows 4-8 + total row 9)
  const LP = "'Liste Personnel'";
  const PR = 'Paramètres';

  SL_KEYS.forEach((sl, idx) => {
    const rn    = idx + 4; // rows 4-8
    const label = SL_LABELS[sl] ?? sl;
    const alt   = idx % 2 === 1;
    const n     = empN.filter(r => r.service_line === sl).length;
    const n1    = empN1.filter(r => r.service_line === sl).length;

    sh.getCell(`A${rn}`).value = label;
    ap(sh.getCell(`A${rn}`), S.data(alt, 'left'));

    f(sh.getCell(`B${rn}`), `COUNTIFS(${LP}!G3:G200,"${label}",${LP}!I3:I200,"")`, n);
    ap(sh.getCell(`B${rn}`), S.data(alt));

    f(sh.getCell(`C${rn}`), `IFERROR(B${rn}/B$9,0)`, 0);
    ap(sh.getCell(`C${rn}`), S.pct(alt));

    f(sh.getCell(`D${rn}`),
      `COUNTIFS(${LP}!G3:G200,"${label}",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
      `+COUNTIFS(${LP}!G3:G200,"${label}",${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
      n1);
    ap(sh.getCell(`D${rn}`), S.data(alt));

    f(sh.getCell(`E${rn}`), `IFERROR(D${rn}/D$9,0)`, 0);
    ap(sh.getCell(`E${rn}`), S.pct(alt));

    sh.getRow(rn).height = 18;
  });

  // Total row 9
  const totN  = empN.length;
  const totN1 = empN1.length;
  sh.getCell('A9').value = 'TOTAL';
  ap(sh.getCell('A9'), S.tot('left'));
  f(sh.getCell('B9'), 'SUM(B4:B8)', totN);
  ap(sh.getCell('B9'), S.tot());
  f(sh.getCell('C9'), 'IFERROR(B9/B$9,0)', 1);
  ap(sh.getCell('C9'), S.totPct());
  f(sh.getCell('D9'), 'SUM(D4:D8)', totN1);
  ap(sh.getCell('D9'), S.tot());
  f(sh.getCell('E9'), 'IFERROR(D9/D$9,0)', 1);
  ap(sh.getCell('E9'), S.totPct());
  sh.getRow(9).height = 18;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 6 — Tranches d'Âge  (SUMPRODUCT + DATEDIF dynamiques)
// ─────────────────────────────────────────────────────────────────────────────
function sheetTranchesAge(wb: ExcelJS.Workbook, empN: any[], endN: Date) {
  const sh = wb.addWorksheet("Tranches d'Âge");
  [24, 13, 16].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:C1');
  ap(sh.getCell('A1'), S.title(12));
  f(sh.getCell('A1'), '"RÉPARTITION PAR TRANCHES D\'ÂGE – FIN "&Paramètres!$B$10',
    `RÉPARTITION PAR TRANCHES D'ÂGE – FIN Mai ${endN.getFullYear()}`);
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  sh.getCell('A3').value = "Tranche d'âge";
  ap(sh.getCell('A3'), S.hdr());
  sh.getCell('B3').value = 'Effectif';
  ap(sh.getCell('B3'), S.hdr());
  sh.getCell('C3').value = '% du Total';
  ap(sh.getCell('C3'), S.hdr());
  sh.getRow(3).height = 22;

  const LP = "'Liste Personnel'";
  const PR = 'Paramètres';
  const base = `(${LP}!D3:D200<>"")*` +
               `(${LP}!D3:D200<>0)*` +
               `(${LP}!I3:I200="")`;

  const BRACKETS = [
    { label: 'Moins de 25 ans', formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<25))`,
      fn: (a: number) => a < 25 },
    { label: '25 – 29 ans',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=25)*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<=29))`,
      fn: (a: number) => a >= 25 && a <= 29 },
    { label: '30 – 34 ans',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=30)*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<=34))`,
      fn: (a: number) => a >= 30 && a <= 34 },
    { label: '35 – 39 ans',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=35)*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<=39))`,
      fn: (a: number) => a >= 35 && a <= 39 },
    { label: '40 – 44 ans',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=40)*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<=44))`,
      fn: (a: number) => a >= 40 && a <= 44 },
    { label: '45 – 49 ans',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=45)*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")<=49))`,
      fn: (a: number) => a >= 45 && a <= 49 },
    { label: '50 ans et plus',
      formula: `SUMPRODUCT(${base}*(DATEDIF(${LP}!D3:D200,${PR}!$B$5,"Y")>=50))`,
      fn: (a: number) => a >= 50 },
  ];

  const withBirth = empN.filter(r => r.birth_date);
  let total = 0;

  BRACKETS.forEach(({ label, formula, fn }, idx) => {
    const rn  = idx + 4; // rows 4-10
    const alt = idx % 2 === 1;
    const count = withBirth.filter(r => fn(calcAge(new Date(r.birth_date), endN))).length;
    total += count;

    sh.getCell(`A${rn}`).value = label;
    ap(sh.getCell(`A${rn}`), S.data(alt, 'left'));
    f(sh.getCell(`B${rn}`), formula, count);
    ap(sh.getCell(`B${rn}`), S.data(alt));
    f(sh.getCell(`C${rn}`), `IFERROR(B${rn}/B$11,0)`, 0);
    ap(sh.getCell(`C${rn}`), S.pct(alt));
    sh.getRow(rn).height = 18;
  });

  // Total row 11
  sh.getCell('A11').value = 'TOTAL';
  ap(sh.getCell('A11'), S.tot('left'));
  f(sh.getCell('B11'), 'SUM(B4:B10)', total);
  ap(sh.getCell('B11'), S.tot());
  f(sh.getCell('C11'), 'IFERROR(B11/B$11,0)', 1);
  ap(sh.getCell('C11'), S.totPct());
  sh.getRow(11).height = 18;

  sh.getRow(12).height = 10;
  sh.mergeCells('A13:C13');
  sh.getCell('A13').value =
    "Les effectifs se calculent automatiquement dès que les dates de naissance sont saisies dans l'onglet 'Liste Personnel' (colonne D).";
  ap(sh.getCell('A13'), S.note());
  sh.getRow(13).height = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 7 — Turn-Over  (formules inter-onglets)
// ─────────────────────────────────────────────────────────────────────────────
function sheetTurnOver(
  wb: ExcelJS.Workbook, year: number,
  empN: any[], empN1: any[], empN2: any[],
  depN: any[], depN1: any[],
) {
  const sh = wb.addWorksheet('Turn-Over');
  [40, 20, 20].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:C1');
  ap(sh.getCell('A1'), S.title(12));
  sh.getCell('A1').value = 'ANALYSE DU TURN-OVER';
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  // Section RAPPEL (rows 3-6)
  sh.mergeCells('A3:C3');
  ap(sh.getCell('A3'), S.sect());
  sh.getCell('A3').value = 'RAPPEL DES FORMULES';
  sh.getRow(3).height = 20;

  [
    ['Turn-Over Global',      'Départs totaux / Effectif moyen × 100'],
    ['Turn-Over Fonctionnel', 'Départs remplacés / Effectif moyen × 100'],
    ['Effectif moyen',        '(Effectif début de période + Effectif fin de période) / 2'],
  ].forEach(([l, v], i) => {
    const rn = i + 4;
    sh.mergeCells(`B${rn}:C${rn}`);
    sh.getCell(`A${rn}`).value = l;
    ap(sh.getCell(`A${rn}`), S.data(i % 2 === 1, 'left'));
    sh.getCell(`B${rn}`).value = v;
    ap(sh.getCell(`B${rn}`), S.data(i % 2 === 1, 'left'));
    sh.getRow(rn).height = 18;
  });

  sh.getRow(7).height = 8;

  // Section DONNÉES (rows 8-17)
  sh.mergeCells('A8:C8');
  ap(sh.getCell('A8'), S.sect());
  sh.getCell('A8').value = 'DONNÉES DE CALCUL';
  sh.getRow(8).height = 20;

  // Headers row 9
  sh.getCell('A9').value = 'Indicateur';
  ap(sh.getCell('A9'), S.hdr());
  f(sh.getCell('B9'), '"Fin "&Paramètres!$B$10', `Fin Mai ${year}`);
  ap(sh.getCell('B9'), S.hdr());
  f(sh.getCell('C9'), '"Fin "&Paramètres!$B$11', `Fin Mai ${year - 1}`);
  ap(sh.getCell('C9'), S.hdr());
  sh.getRow(9).height = 20;

  const LP = "'Liste Personnel'";
  const PR = 'Paramètres';
  const MV = 'Mouvements';

  // Cached values
  const effFinN   = empN.length;
  const effFinN1  = empN1.length;
  const effFinN2  = empN2.length;
  const effDebN   = effFinN1;
  const effDebN1  = effFinN2;
  const effMoyN   = (effDebN + effFinN) / 2;
  const effMoyN1  = (effDebN1 + effFinN1) / 2;
  const depNtot   = depN.length;
  const depN1tot  = depN1.length;
  const depNvol   = depN.filter(r => isVoluntary(r.departure_reason || '')).length;
  const depN1vol  = depN1.filter(r => isVoluntary(r.departure_reason || '')).length;
  const depNinv   = depNtot - depNvol;
  const depN1inv  = depN1tot - depN1vol;

  // Row 10 : Effectif début de période
  sh.getCell('A10').value = 'Effectif début de période (01/06)';
  ap(sh.getCell('A10'), S.data(false, 'left'));
  f(sh.getCell('B10'), 'C11', effDebN);
  ap(sh.getCell('B10'), S.data(false));
  f(sh.getCell('C10'),
    `COUNTIFS(${LP}!C3:C200,"<="&${PR}!$B$9,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!C3:C200,"<="&${PR}!$B$9,${LP}!I3:I200,">"&${PR}!$B$9)`,
    effDebN1);
  ap(sh.getCell('C10'), S.data(false));
  sh.getRow(10).height = 18;

  // Row 11 : Effectif fin de période
  sh.getCell('A11').value = 'Effectif fin de période (31/05)';
  ap(sh.getCell('A11'), S.data(true, 'left'));
  f(sh.getCell('B11'), 'Effectifs!B7', effFinN);
  ap(sh.getCell('B11'), S.data(true));
  f(sh.getCell('C11'),
    `COUNTIFS(${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,"")`+
    `+COUNTIFS(${LP}!C3:C200,"<="&${PR}!$B$6,${LP}!I3:I200,">"&${PR}!$B$6)`,
    effFinN1);
  ap(sh.getCell('C11'), S.data(true));
  sh.getRow(11).height = 18;

  // Row 12 : Effectif moyen
  sh.getCell('A12').value = 'Effectif moyen';
  ap(sh.getCell('A12'), S.data(false, 'left'));
  f(sh.getCell('B12'), '(B10+B11)/2', effMoyN);
  ap(sh.getCell('B12'), S.data(false));
  f(sh.getCell('C12'), '(C10+C11)/2', effMoyN1);
  ap(sh.getCell('C12'), S.data(false));
  sh.getRow(12).height = 18;

  // Row 13 : Départs totaux
  sh.getCell('A13').value = 'Départs totaux (auto)';
  ap(sh.getCell('A13'), S.data(true, 'left'));
  f(sh.getCell('B13'), `COUNTIF(${MV}!G3:G500,${PR}!$B$10)`, depNtot);
  ap(sh.getCell('B13'), S.data(true));
  f(sh.getCell('C13'), `COUNTIF(${MV}!G3:G500,${PR}!$B$11)`, depN1tot);
  ap(sh.getCell('C13'), S.data(true));
  sh.getRow(13).height = 18;

  // Row 14 : Volontaires
  sh.getCell('A14').value = 'Dont : départs volontaires (auto)';
  ap(sh.getCell('A14'), S.data(false, 'left'));
  f(sh.getCell('B14'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$10,${MV}!E3:E500,"Volontaire")`, depNvol);
  ap(sh.getCell('B14'), S.data(false));
  f(sh.getCell('C14'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$11,${MV}!E3:E500,"Volontaire")`, depN1vol);
  ap(sh.getCell('C14'), S.data(false));
  sh.getRow(14).height = 18;

  // Row 15 : Involontaires
  sh.getCell('A15').value = 'Dont : départs involontaires (auto)';
  ap(sh.getCell('A15'), S.data(true, 'left'));
  f(sh.getCell('B15'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$10,${MV}!E3:E500,"Involontaire")`, depNinv);
  ap(sh.getCell('B15'), S.data(true));
  f(sh.getCell('C15'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$11,${MV}!E3:E500,"Involontaire")`, depN1inv);
  ap(sh.getCell('C15'), S.data(true));
  sh.getRow(15).height = 18;

  // Row 16 : Remplacés
  sh.getCell('A16').value = 'Départs remplacés (auto)';
  ap(sh.getCell('A16'), S.data(false, 'left'));
  f(sh.getCell('B16'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$10,${MV}!F3:F500,"O")`, 0);
  ap(sh.getCell('B16'), S.data(false));
  f(sh.getCell('C16'), `COUNTIFS(${MV}!G3:G500,${PR}!$B$11,${MV}!F3:F500,"O")`, 0);
  ap(sh.getCell('C16'), S.data(false));
  sh.getRow(16).height = 18;

  // Row 17 : Nouvelles entrées
  sh.getCell('A17').value = 'Nouvelles entrées';
  ap(sh.getCell('A17'), S.data(true, 'left'));
  f(sh.getCell('B17'),
    `COUNTIFS(${LP}!C3:C200,">="&${PR}!$B$7,${LP}!C3:C200,"<="&${PR}!$B$5)`,
    empN.filter(r => {
      const e = new Date(r.entry_date);
      return e >= new Date(year - 1, 5, 1) && e <= new Date(year, 4, 31);
    }).length);
  ap(sh.getCell('B17'), S.data(true));
  f(sh.getCell('C17'),
    `COUNTIFS(${LP}!C3:C200,">="&${PR}!$B$8,${LP}!C3:C200,"<="&${PR}!$B$6)`,
    empN1.filter(r => {
      const e = new Date(r.entry_date);
      return e >= new Date(year - 2, 5, 1) && e <= new Date(year - 1, 4, 31);
    }).length);
  ap(sh.getCell('C17'), S.data(true));
  sh.getRow(17).height = 18;

  sh.getRow(18).height = 8;

  // Section RÉSULTATS (rows 19-22)
  sh.mergeCells('A19:C19');
  ap(sh.getCell('A19'), S.sect());
  sh.getCell('A19').value = 'RÉSULTATS';
  sh.getRow(19).height = 20;

  sh.getCell('A20').value = 'Indicateur';
  ap(sh.getCell('A20'), S.hdr());
  f(sh.getCell('B20'), '"Fin "&Paramètres!$B$10', `Fin Mai ${year}`);
  ap(sh.getCell('B20'), S.hdr());
  f(sh.getCell('C20'), '"Fin "&Paramètres!$B$11', `Fin Mai ${year - 1}`);
  ap(sh.getCell('C20'), S.hdr());
  sh.getRow(20).height = 20;

  // Row 21 : Turn-Over Global
  sh.getCell('A21').value = 'Turn-Over Global (%)';
  ap(sh.getCell('A21'), S.tot('left'));
  f(sh.getCell('B21'), 'IFERROR(B13/B12,0)', effMoyN > 0 ? depNtot / effMoyN : 0);
  ap(sh.getCell('B21'), S.totPct());
  f(sh.getCell('C21'), 'IFERROR(C13/C12,0)', effMoyN1 > 0 ? depN1tot / effMoyN1 : 0);
  ap(sh.getCell('C21'), S.totPct());
  sh.getRow(21).height = 20;

  // Row 22 : Turn-Over Fonctionnel
  sh.getCell('A22').value = 'Turn-Over Fonctionnel (%)';
  ap(sh.getCell('A22'), S.tot('left'));
  f(sh.getCell('B22'), 'IFERROR(B16/B12,0)', 0);
  ap(sh.getCell('B22'), S.totPct());
  f(sh.getCell('C22'), 'IFERROR(C16/C12,0)', 0);
  ap(sh.getCell('C22'), S.totPct());
  sh.getRow(22).height = 20;

  sh.getRow(23).height = 8;
  sh.mergeCells('A24:C24');
  sh.getCell('A24').value =
    "Les départs sont comptés depuis l'onglet Mouvements. Saisir la colonne F (Remplacé O/N) pour le Turn-Over Fonctionnel.";
  ap(sh.getCell('A24'), S.note());
  sh.getRow(24).height = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 8 — Motifs de Départ  (COUNTIFS sur Mouvements)
// ─────────────────────────────────────────────────────────────────────────────
function sheetMotifsDépart(wb: ExcelJS.Workbook, year: number, depN: any[], depN1: any[]) {
  const sh = wb.addWorksheet('Motifs de Départ');
  [30, 16, 14, 16, 14].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  ap(sh.getCell('A1'), S.title(12));
  sh.getCell('A1').value = 'MOTIFS DE DÉPART';
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  // Row 3 : headers avec formules
  sh.getCell('A3').value = 'Motif';
  ap(sh.getCell('A3'), S.hdr());
  f(sh.getCell('B3'), '"Départs "&Paramètres!$B$10', `Départs Mai ${year}`);
  ap(sh.getCell('B3'), S.hdr());
  f(sh.getCell('C3'), '"% "&Paramètres!$B$4', `% ${year}`);
  ap(sh.getCell('C3'), S.hdr());
  f(sh.getCell('D3'), '"Départs "&Paramètres!$B$11', `Départs Mai ${year - 1}`);
  ap(sh.getCell('D3'), S.hdr());
  f(sh.getCell('E3'), '"% "&(Paramètres!$B$4-1)', `% ${year - 1}`);
  ap(sh.getCell('E3'), S.hdr());
  sh.getRow(3).height = 22;

  const MV = 'Mouvements';
  const PR = 'Paramètres';

  DR_FR.forEach((label, idx) => {
    const rn  = idx + 4; // rows 4-8
    const alt = idx % 2 === 1;
    const n   = depN.filter(r => DR_LABELS[r.departure_reason] === label).length;
    const n1  = depN1.filter(r => DR_LABELS[r.departure_reason] === label).length;

    sh.getCell(`A${rn}`).value = label;
    ap(sh.getCell(`A${rn}`), S.data(alt, 'left'));

    f(sh.getCell(`B${rn}`),
      `COUNTIFS(${MV}!D3:D500,"${label}",${MV}!G3:G500,${PR}!$B$10)`, n);
    ap(sh.getCell(`B${rn}`), S.data(alt));

    f(sh.getCell(`C${rn}`), `IFERROR(B${rn}/B$9,0)`, 0);
    ap(sh.getCell(`C${rn}`), S.pct(alt));

    f(sh.getCell(`D${rn}`),
      `COUNTIFS(${MV}!D3:D500,"${label}",${MV}!G3:G500,${PR}!$B$11)`, n1);
    ap(sh.getCell(`D${rn}`), S.data(alt));

    f(sh.getCell(`E${rn}`), `IFERROR(D${rn}/D$9,0)`, 0);
    ap(sh.getCell(`E${rn}`), S.pct(alt));

    sh.getRow(rn).height = 18;
  });

  // Total row 9
  const totN  = depN.length;
  const totN1 = depN1.length;
  sh.getCell('A9').value = 'TOTAL';
  ap(sh.getCell('A9'), S.tot('left'));
  f(sh.getCell('B9'), 'SUM(B4:B8)', totN);
  ap(sh.getCell('B9'), S.tot());
  f(sh.getCell('C9'), 'IFERROR(B9/B9,0)', totN > 0 ? 1 : 0);
  ap(sh.getCell('C9'), S.totPct());
  f(sh.getCell('D9'), 'SUM(D4:D8)', totN1);
  ap(sh.getCell('D9'), S.tot());
  f(sh.getCell('E9'), 'IFERROR(D9/D9,0)', totN1 > 0 ? 1 : 0);
  ap(sh.getCell('E9'), S.totPct());
  sh.getRow(9).height = 18;

  sh.getRow(10).height = 10;
  sh.mergeCells('A11:E11');
  sh.getCell('A11').value =
    "Les motifs sont comptés automatiquement depuis l'onglet 'Mouvements' (colonne D). Respecter l'orthographe exacte.";
  ap(sh.getCell('A11'), S.note());
  sh.getRow(11).height = 20;
}
