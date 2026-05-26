import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ─── Labels ───────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

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

const DR_KEYS = ['NOUVELLES_OPPORTUNITES', 'RAISONS_PERSONNELLES', 'REMUNERATION', 'MANAGEMENT', 'AUTRES'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

function calcAge(birth: Date, ref: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d as string);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

// ─── Colors ───────────────────────────────────────────────────────────────────

const NAVY      = 'FF1E3A5F';  // Forvis Mazars navy
const NAVY_MID  = 'FF2D5F8A';  // Section sub-header
const WHITE     = 'FFFFFFFF';
const ALT       = 'FFF0F4FA';  // Alternating row light blue
const TOTAL_BG  = 'FFD0DCEB';  // Total row blue-gray
const SECT_BG   = 'FFE5EEF5';  // Section title background
const BORDER_C  = 'FFB8C8D6';  // Cell border color
const DEPART_BG = 'FFFFF4E6';  // Departed employee row (light orange)
const RED_TXT   = 'FFDC2626';
const BLUE_TXT  = 'FF1D4ED8';
const GREY_TXT  = 'FF888888';

// ─── Style builders ───────────────────────────────────────────────────────────

const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: BORDER_C } };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function mkTitle(size = 12): Partial<ExcelJS.Style> {
  return {
    font:      { bold: true, size, color: { argb: WHITE } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
}

function mkColHeader(): Partial<ExcelJS.Style> {
  return {
    font:      { bold: true, size: 10, color: { argb: WHITE } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border:    allBorders,
  };
}

function mkSection(): Partial<ExcelJS.Style> {
  return {
    font:      { bold: true, size: 10, color: { argb: NAVY } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: SECT_BG } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border:    allBorders,
  };
}

function mkData(alt: boolean, align: 'left' | 'center' = 'center', bgOverride?: string): Partial<ExcelJS.Style> {
  return {
    font:      { size: 9 },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bgOverride ?? (alt ? ALT : WHITE) } },
    alignment: { horizontal: align, vertical: 'middle', wrapText: align === 'left' },
    border:    allBorders,
  };
}

function mkDataPct(alt: boolean): Partial<ExcelJS.Style> {
  return { ...mkData(alt), numFmt: '0.0%' };
}

function mkTotal(align: 'left' | 'center' = 'center'): Partial<ExcelJS.Style> {
  return {
    font:      { bold: true, size: 10, color: { argb: NAVY } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } },
    alignment: { horizontal: align, vertical: 'middle' },
    border:    allBorders,
  };
}

function mkTotalPct(): Partial<ExcelJS.Style> {
  return { ...mkTotal(), numFmt: '0.0%' };
}

function mkNote(): Partial<ExcelJS.Style> {
  return { font: { italic: true, size: 9, color: { argb: GREY_TXT } }, alignment: { horizontal: 'left' } };
}

function applyStyle(cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>) {
  cell.style = style as ExcelJS.Style;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateMonthlyReport = async (year: number, month: number): Promise<string> => {

  // ── Period reference dates ──────────────────────────────────────────────────
  const endN   = lastDayOfMonth(year,     month);
  const endN1  = lastDayOfMonth(year - 1, month);
  const endN2  = lastDayOfMonth(year - 2, month);
  const startN  = new Date(endN1.getTime() + 86_400_000);
  const startN1 = new Date(endN2.getTime() + 86_400_000);

  const labelN  = `Fin ${MONTHS_FR[month - 1]} ${year}`;
  const labelN1 = `Fin ${MONTHS_FR[month - 1]} ${year - 1}`;
  const shortN  = `${MONTHS_FR[month - 1]} ${year}`;

  // ── Fetch all employees ─────────────────────────────────────────────────────
  const rows = (await query(`
    SELECT
      id, matricule, first_name, last_name,
      entry_date, birth_date, gender, grade,
      service_line, contract_type,
      exit_date, departure_reason
    FROM employees
    ORDER BY last_name, first_name
  `)).rows;

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const activeAt = (r: any, ref: Date): boolean => {
    const entry = new Date(r.entry_date);
    const exit  = r.exit_date ? new Date(r.exit_date) : null;
    return entry <= ref && (!exit || exit > ref);
  };

  const departedIn = (r: any, from: Date, to: Date): boolean => {
    if (!r.exit_date) return false;
    const d = new Date(r.exit_date);
    return d > from && d <= to;
  };

  const joinedIn = (r: any, from: Date, to: Date): boolean => {
    const e = new Date(r.entry_date);
    return e >= from && e <= to;
  };

  const empN   = rows.filter(r => activeAt(r, endN));
  const empN1  = rows.filter(r => activeAt(r, endN1));
  const depN   = rows.filter(r => departedIn(r, endN1, endN));
  const depN1  = rows.filter(r => departedIn(r, endN2, endN1));
  const newN   = rows.filter(r => joinedIn(r, startN, endN));
  const newN1  = rows.filter(r => joinedIn(r, startN1, endN1));

  // ── Build workbook ──────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator   = 'SGRH Cabinet – Forvis Mazars BF';
  wb.created   = new Date();
  wb.modified  = new Date();

  sheetParametres(wb, year, month, endN, endN1, labelN, labelN1);
  sheetListePersonnel(wb, rows, endN, labelN);
  sheetEffectifs(wb, empN, empN1, labelN, labelN1);
  sheetMouvements(wb, depN, depN1, labelN, labelN1);
  sheetParDepartement(wb, empN, empN1, labelN, labelN1, year);
  sheetTranchesAge(wb, empN, endN, labelN);
  sheetTurnOver(wb, empN, empN1, depN, depN1, newN, newN1, labelN, labelN1);
  sheetMotifsDépart(wb, depN, depN1, labelN, labelN1, year);

  // ── Save ────────────────────────────────────────────────────────────────────
  const dir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename  = `Reporting_RH_ForvisMazars_BF_${MONTHS_FR[month - 1]}_${year}.xlsx`;
  const filePath  = path.join(dir, filename);
  await wb.xlsx.writeFile(filePath);
  logger.info(`Rapport RH Forvis Mazars généré : ${filePath}`);
  return filePath;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 1 — Paramètres
// ─────────────────────────────────────────────────────────────────────────────
function sheetParametres(
  wb: ExcelJS.Workbook, year: number, month: number,
  endN: Date, endN1: Date, labelN: string, labelN1: string,
) {
  const sh = wb.addWorksheet('Paramètres');
  sh.getColumn('A').width = 44;
  sh.getColumn('B').width = 24;

  // Titre principal
  sh.mergeCells('A1:B1');
  applyStyle(sh.getCell('A1'), mkTitle(13));
  sh.getCell('A1').value = 'PARAMÈTRES – REPORTING RH FORVIS MAZARS BURKINA FASO';
  sh.getRow(1).height = 32;

  sh.getRow(2).height = 8;

  // Instruction
  sh.mergeCells('A3:B3');
  sh.getCell('A3').value = '⚙  Seule la cellule B4 (Année) détermine l\'ensemble du rapport.';
  sh.getCell('A3').style = { font: { italic: true, size: 9, color: { argb: GREY_TXT } } } as ExcelJS.Style;
  sh.getRow(3).height = 16;

  const paramData: [string, string | number][] = [
    ['Année de référence',                    year],
    [`Date fin période N  (${fmtDate(endN)})`,  fmtDate(endN)],
    [`Date fin période N-1 (${fmtDate(endN1)})`, fmtDate(endN1)],
    ['Libellé période N',                     labelN],
    ['Libellé période N-1',                   labelN1],
    ['Rapport généré le',                     fmtDate(new Date())],
  ];

  paramData.forEach(([label, val], i) => {
    const rn = i + 4;
    const alt = i % 2 === 1;
    sh.getCell(`A${rn}`).value = label;
    sh.getCell(`B${rn}`).value = val;
    sh.getCell(`A${rn}`).style = {
      font: { size: 10, bold: i === 0 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? ALT : WHITE } },
      alignment: { horizontal: 'left', vertical: 'middle' },
      border: allBorders,
    } as ExcelJS.Style;
    sh.getCell(`B${rn}`).style = {
      font: { size: 10, bold: i === 0, color: { argb: NAVY } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? ALT : WHITE } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: allBorders,
    } as ExcelJS.Style;
    sh.getRow(rn).height = 20;
  });

  sh.getRow(11).height = 10;
  sh.mergeCells('A12:B12');
  sh.getCell('A12').value = '→ Changer uniquement l\'année de référence pour basculer sur une nouvelle période de reporting.';
  sh.getCell('A12').style = mkNote() as ExcelJS.Style;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 2 — Liste Personnel
// ─────────────────────────────────────────────────────────────────────────────
function sheetListePersonnel(
  wb: ExcelJS.Workbook, rows: any[], endN: Date, labelN: string,
) {
  const sh = wb.addWorksheet('Liste Personnel');
  const colW = [5, 32, 13, 14, 8, 22, 22, 13, 14, 36, 6];
  colW.forEach((w, i) => sh.getColumn(i + 1).width = w);

  // Titre
  sh.mergeCells('A1:K1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = `LISTE DU PERSONNEL – FIN ${labelN}`;
  sh.getRow(1).height = 28;

  // En-têtes
  const HEADERS = [
    'N°', 'Nom et Prénoms', "Date d'Entrée", 'Date de Naissance',
    'Genre', 'Grade', 'Département', 'Catégorie',
    'Date de sortie', 'Motif de Départ', 'Âge',
  ];
  const hRow = sh.addRow(HEADERS);
  hRow.eachCell(c => applyStyle(c, mkColHeader()));
  sh.getRow(2).height = 22;

  // Données
  rows.forEach((emp, idx) => {
    const birth   = emp.birth_date ? new Date(emp.birth_date)  : null;
    const exit    = emp.exit_date  ? new Date(emp.exit_date)   : null;
    const entry   = emp.entry_date ? new Date(emp.entry_date)  : null;
    const age     = birth ? calcAge(birth, endN) : null;
    const isGone  = exit && exit <= endN;
    const bg      = isGone ? DEPART_BG : (idx % 2 === 1 ? ALT : WHITE);
    const dr      = emp.departure_reason ? (DR_LABELS[emp.departure_reason] ?? emp.departure_reason) : '';

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
      age ?? '',
    ]);

    const baseStyle: Partial<ExcelJS.Style> = {
      font:   { size: 9, italic: !!isGone, color: { argb: isGone ? '88333333' : '00000000' } },
      fill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: allBorders,
    };

    // N° / Âge — centered
    [1, 5, 8, 11].forEach(ci => {
      sh.getRow(idx + 3).getCell(ci).style = {
        ...baseStyle, alignment: { horizontal: 'center', vertical: 'middle' },
      } as ExcelJS.Style;
    });
    // Nom, Grade, Département, Motif — left
    [2, 6, 7, 10].forEach(ci => {
      sh.getRow(idx + 3).getCell(ci).style = {
        ...baseStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
      } as ExcelJS.Style;
    });
    // Dates — center + date format
    [3, 4, 9].forEach(ci => {
      sh.getRow(idx + 3).getCell(ci).style = {
        ...baseStyle,
        alignment: { horizontal: 'center', vertical: 'middle' },
        numFmt: 'DD/MM/YYYY',
      } as ExcelJS.Style;
    });
    sh.getRow(idx + 3).height = 16;
  });

  sh.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3' }];
  sh.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 11 } };
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 3 — Effectifs
// ─────────────────────────────────────────────────────────────────────────────
function sheetEffectifs(
  wb: ExcelJS.Workbook, empN: any[], empN1: any[], labelN: string, labelN1: string,
) {
  const sh = wb.addWorksheet('Effectifs');
  [30, 16, 16, 13, 13].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = 'EFFECTIFS – FORVIS MAZARS BURKINA FASO';
  sh.getRow(1).height = 28;

  let rn = 2;

  const addGap = () => { sh.getRow(rn).height = 8; rn++; };
  const addSect = (title: string) => {
    sh.mergeCells(`A${rn}:E${rn}`);
    applyStyle(sh.getCell(`A${rn}`), mkSection());
    sh.getCell(`A${rn}`).value = title;
    sh.getRow(rn).height = 20;
    rn++;
  };
  const addHeader = (cols: string[]) => {
    const row = sh.addRow(cols);
    row.eachCell(c => applyStyle(c, mkColHeader()));
    sh.getRow(rn).height = 20;
    rn++;
  };

  // ── Section 1 : Effectif total ──
  addGap();
  addSect('1. EFFECTIF TOTAL (HORS STAGIAIRES ÉCOLE)');
  addHeader(['Catégorie', labelN, labelN1, 'Variation', '% Variation']);

  const CAT_FILTERS: { label: string; fn: (r: any) => boolean }[] = [
    { label: 'Permanents',  fn: r => ['CDI','CDD'].includes(r.contract_type) },
    { label: 'Consultants', fn: r => ['CONSULTANT','FREELANCE'].includes(r.contract_type) },
  ];

  const nonStage = (r: any) => r.contract_type !== 'STAGE';
  let sumN = 0, sumN1 = 0;

  CAT_FILTERS.forEach(({ label, fn }, i) => {
    const n  = empN.filter(nonStage).filter(fn).length;
    const n1 = empN1.filter(nonStage).filter(fn).length;
    const d  = n - n1;
    const p  = n1 > 0 ? d / n1 : 0;
    sumN += n; sumN1 += n1;
    const row = sh.addRow([label, n, n1, d, p]);
    applyStyle(row.getCell(1), mkData(i % 2 === 1, 'left'));
    applyStyle(row.getCell(2), mkData(i % 2 === 1));
    applyStyle(row.getCell(3), mkData(i % 2 === 1));
    applyStyle(row.getCell(4), {
      ...mkData(i % 2 === 1),
      font: { size: 9, color: { argb: d >= 0 ? BLUE_TXT : RED_TXT }, bold: true },
    } as ExcelJS.Style);
    applyStyle(row.getCell(5), mkDataPct(i % 2 === 1));
    sh.getRow(rn).height = 18; rn++;
  });

  const tRow1 = sh.addRow(['TOTAL GÉNÉRAL', sumN, sumN1, sumN - sumN1, sumN1 > 0 ? (sumN - sumN1) / sumN1 : 0]);
  applyStyle(tRow1.getCell(1), mkTotal('left'));
  [2,3,4].forEach(ci => applyStyle(tRow1.getCell(ci), mkTotal()));
  applyStyle(tRow1.getCell(5), mkTotalPct());
  sh.getRow(rn).height = 18; rn++;

  // ── Section 2 : Répartition H/F ──
  addGap();
  addSect('2. RÉPARTITION HOMMES / FEMMES');
  addHeader(['Genre', labelN, `% ${labelN}`, labelN1, `% ${labelN1}`]);

  const totN  = empN.filter(nonStage).length  || 1;
  const totN1 = empN1.filter(nonStage).length || 1;

  [{ label: 'Hommes', g: 'M' }, { label: 'Femmes', g: 'F' }].forEach(({ label, g }, i) => {
    const n  = empN.filter(nonStage).filter(r => r.gender === g).length;
    const n1 = empN1.filter(nonStage).filter(r => r.gender === g).length;
    const row = sh.addRow([label, n, n / totN, n1, n1 / totN1]);
    applyStyle(row.getCell(1), mkData(i % 2 === 1, 'left'));
    applyStyle(row.getCell(2), mkData(i % 2 === 1));
    applyStyle(row.getCell(3), mkDataPct(i % 2 === 1));
    applyStyle(row.getCell(4), mkData(i % 2 === 1));
    applyStyle(row.getCell(5), mkDataPct(i % 2 === 1));
    sh.getRow(rn).height = 18; rn++;
  });

  const tRow2 = sh.addRow([
    'TOTAL',
    empN.filter(nonStage).length, 1,
    empN1.filter(nonStage).length, 1,
  ]);
  applyStyle(tRow2.getCell(1), mkTotal('left'));
  applyStyle(tRow2.getCell(2), mkTotal());
  applyStyle(tRow2.getCell(3), mkTotalPct());
  applyStyle(tRow2.getCell(4), mkTotal());
  applyStyle(tRow2.getCell(5), mkTotalPct());
  sh.getRow(rn).height = 18;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 4 — Mouvements
// ─────────────────────────────────────────────────────────────────────────────
function sheetMouvements(
  wb: ExcelJS.Workbook, depN: any[], depN1: any[], labelN: string, labelN1: string,
) {
  const sh = wb.addWorksheet('Mouvements');
  [5, 32, 14, 30, 14, 13, 20].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:G1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = 'MOUVEMENTS DU PERSONNEL – DÉPARTS';
  sh.getRow(1).height = 28;

  const hRow = sh.addRow(['N°', 'Nom et Prénoms', 'Date de Départ', 'Motif de Départ', 'Type de Départ', 'Remplacé', 'Période']);
  hRow.eachCell(c => applyStyle(c, mkColHeader()));
  sh.getRow(2).height = 22;

  const all = [
    ...depN.map(r => ({ ...r, _period: labelN })),
    ...depN1.map(r => ({ ...r, _period: labelN1 })),
  ].sort((a, b) => new Date(b.exit_date).getTime() - new Date(a.exit_date).getTime());

  all.forEach((dep, idx) => {
    const vol = isVoluntary(dep.departure_reason || '');
    const dr  = dep.departure_reason ? (DR_LABELS[dep.departure_reason] ?? dep.departure_reason) : '—';
    const alt = idx % 2 === 1;

    const row = sh.addRow([
      idx + 1,
      `${dep.last_name} ${dep.first_name}`,
      dep.exit_date ? new Date(dep.exit_date) : '',
      dr,
      dep.departure_reason ? (vol ? 'Volontaire' : 'Involontaire') : '—',
      '—',
      dep._period,
    ]);

    applyStyle(row.getCell(1), mkData(alt));
    applyStyle(row.getCell(2), mkData(alt, 'left'));
    row.getCell(3).style = { ...mkData(alt), numFmt: 'DD/MM/YYYY' } as ExcelJS.Style;
    applyStyle(row.getCell(4), mkData(alt, 'left'));
    row.getCell(5).style = {
      ...mkData(alt),
      font: { size: 9, bold: true, color: { argb: vol ? BLUE_TXT : RED_TXT } },
    } as ExcelJS.Style;
    applyStyle(row.getCell(6), mkData(alt));
    applyStyle(row.getCell(7), mkData(alt));
    sh.getRow(idx + 3).height = 16;
  });

  if (all.length === 0) {
    const empty = sh.addRow(['', 'Aucun départ enregistré sur ces deux périodes.', '', '', '', '', '']);
    applyStyle(empty.getCell(2), mkData(false, 'left'));
  }

  const noteRn = all.length + 4;
  sh.getRow(noteRn).height = 10;
  sh.mergeCells(`A${noteRn + 1}:G${noteRn + 1}`);
  sh.getCell(`A${noteRn + 1}`).value =
    "Saisir chaque départ : Date | Motif : Nouvelles opportunités / Raisons personnelles / Rémunération / Management / Autres | Type : Volontaire / Involontaire | Remplacé : O / N. La période se calcule automatiquement.";
  sh.getCell(`A${noteRn + 1}`).style = mkNote() as ExcelJS.Style;
  sh.getRow(noteRn + 1).height = 26;

  sh.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3' }];
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 5 — Par Département
// ─────────────────────────────────────────────────────────────────────────────
function sheetParDepartement(
  wb: ExcelJS.Workbook, empN: any[], empN1: any[],
  labelN: string, labelN1: string, year: number,
) {
  const sh = wb.addWorksheet('Par Département');
  [28, 14, 18, 14, 18].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = 'EFFECTIFS PAR DÉPARTEMENT';
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  const hRow = sh.addRow(['Département', labelN, `% Total ${year}`, labelN1, `% Total ${year - 1}`]);
  hRow.eachCell(c => applyStyle(c, mkColHeader()));
  sh.getRow(3).height = 22;

  const totN  = empN.length  || 1;
  const totN1 = empN1.length || 1;

  SL_KEYS.forEach((sl, idx) => {
    const n  = empN.filter(r => r.service_line === sl).length;
    const n1 = empN1.filter(r => r.service_line === sl).length;
    const alt = idx % 2 === 1;
    const row = sh.addRow([SL_LABELS[sl] ?? sl, n, n / totN, n1, n1 / totN1]);
    applyStyle(row.getCell(1), mkData(alt, 'left'));
    applyStyle(row.getCell(2), mkData(alt));
    applyStyle(row.getCell(3), mkDataPct(alt));
    applyStyle(row.getCell(4), mkData(alt));
    applyStyle(row.getCell(5), mkDataPct(alt));
    sh.getRow(idx + 4).height = 18;
  });

  const tRow = sh.addRow(['TOTAL', empN.length, 1, empN1.length, 1]);
  applyStyle(tRow.getCell(1), mkTotal('left'));
  applyStyle(tRow.getCell(2), mkTotal());
  applyStyle(tRow.getCell(3), mkTotalPct());
  applyStyle(tRow.getCell(4), mkTotal());
  applyStyle(tRow.getCell(5), mkTotalPct());
  sh.getRow(SL_KEYS.length + 4).height = 18;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 6 — Tranches d'Âge
// ─────────────────────────────────────────────────────────────────────────────
function sheetTranchesAge(
  wb: ExcelJS.Workbook, empN: any[], endN: Date, labelN: string,
) {
  const sh = wb.addWorksheet("Tranches d'Âge");
  [24, 13, 16].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:C1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = `RÉPARTITION PAR TRANCHES D'ÂGE – ${labelN}`;
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  const hRow = sh.addRow(["Tranche d'âge", 'Effectif', '% du Total']);
  hRow.eachCell(c => applyStyle(c, mkColHeader()));
  sh.getRow(3).height = 22;

  const BRACKETS = [
    { label: 'Moins de 25 ans', min: 0,  max: 24  },
    { label: '25 – 29 ans',     min: 25, max: 29  },
    { label: '30 – 34 ans',     min: 30, max: 34  },
    { label: '35 – 39 ans',     min: 35, max: 39  },
    { label: '40 – 44 ans',     min: 40, max: 44  },
    { label: '45 – 49 ans',     min: 45, max: 49  },
    { label: '50 ans et plus',  min: 50, max: 999 },
  ];

  const withBirth = empN.filter(r => r.birth_date);
  const total     = withBirth.length || 1;

  BRACKETS.forEach(({ label, min, max }, idx) => {
    const count = withBirth.filter(r => {
      const age = calcAge(new Date(r.birth_date), endN);
      return age >= min && age <= max;
    }).length;
    const alt = idx % 2 === 1;
    const row = sh.addRow([label, count, count / total]);
    applyStyle(row.getCell(1), mkData(alt, 'left'));
    applyStyle(row.getCell(2), mkData(alt));
    applyStyle(row.getCell(3), mkDataPct(alt));
    sh.getRow(idx + 4).height = 18;
  });

  const tRow = sh.addRow(['TOTAL', withBirth.length, 1]);
  applyStyle(tRow.getCell(1), mkTotal('left'));
  applyStyle(tRow.getCell(2), mkTotal());
  applyStyle(tRow.getCell(3), mkTotalPct());
  sh.getRow(BRACKETS.length + 4).height = 18;

  sh.getRow(BRACKETS.length + 6).height = 16;
  sh.mergeCells(`A${BRACKETS.length + 6}:C${BRACKETS.length + 6}`);
  sh.getCell(`A${BRACKETS.length + 6}`).value =
    "Les effectifs se calculent automatiquement dès que les dates de naissance sont saisies dans l'onglet 'Liste Personnel'.";
  sh.getCell(`A${BRACKETS.length + 6}`).style = mkNote() as ExcelJS.Style;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 7 — Turn-Over
// ─────────────────────────────────────────────────────────────────────────────
function sheetTurnOver(
  wb: ExcelJS.Workbook,
  empN: any[], empN1: any[],
  depN: any[], depN1: any[],
  newN: any[], newN1: any[],
  labelN: string, labelN1: string,
) {
  const sh = wb.addWorksheet('Turn-Over');
  [40, 20, 20].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:C1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = 'ANALYSE DU TURN-OVER';
  sh.getRow(1).height = 28;

  let rn = 2;
  const gap  = () => { sh.getRow(rn).height = 8; rn++; };
  const sect = (t: string) => {
    sh.mergeCells(`A${rn}:C${rn}`);
    applyStyle(sh.getCell(`A${rn}`), mkSection());
    sh.getCell(`A${rn}`).value = t;
    sh.getRow(rn).height = 20; rn++;
  };
  const hdr  = (cols: string[]) => {
    const row = sh.addRow(cols);
    row.eachCell(c => applyStyle(c, mkColHeader()));
    sh.getRow(rn).height = 20; rn++;
  };
  const dataRow = (label: string, vN: number | string, vN1: number | string, alt: boolean, pct = false) => {
    const row = sh.addRow([label, vN, vN1]);
    applyStyle(row.getCell(1), mkData(alt, 'left'));
    if (pct) {
      applyStyle(row.getCell(2), typeof vN === 'number' ? mkDataPct(alt) : mkData(alt));
      applyStyle(row.getCell(3), typeof vN1 === 'number' ? mkDataPct(alt) : mkData(alt));
    } else {
      applyStyle(row.getCell(2), mkData(alt));
      applyStyle(row.getCell(3), mkData(alt));
    }
    sh.getRow(rn).height = 18; rn++;
  };
  const totRow = (label: string, vN: number | string, vN1: number | string, pct = false) => {
    const row = sh.addRow([label, vN, vN1]);
    applyStyle(row.getCell(1), mkTotal('left'));
    applyStyle(row.getCell(2), pct && typeof vN === 'number' ? mkTotalPct() : mkTotal());
    applyStyle(row.getCell(3), pct && typeof vN1 === 'number' ? mkTotalPct() : mkTotal());
    sh.getRow(rn).height = 20; rn++;
  };

  // ── Rappel formules ──
  gap();
  sect('RAPPEL DES FORMULES');
  [
    ['Turn-Over Global',      'Départs totaux ÷ Effectif moyen × 100'],
    ['Turn-Over Fonctionnel', 'Départs remplacés ÷ Effectif moyen × 100'],
    ['Effectif moyen',        '(Effectif début de période + Effectif fin de période) ÷ 2'],
  ].forEach(([l, f], i) => {
    sh.mergeCells(`B${rn}:C${rn}`);
    const row = sh.addRow([l, f, '']);
    applyStyle(row.getCell(1), mkData(i % 2 === 1, 'left'));
    applyStyle(row.getCell(2), mkData(i % 2 === 1, 'left'));
    sh.getRow(rn).height = 18; rn++;
  });

  // ── Données ──
  gap();
  sect('DONNÉES DE CALCUL');
  hdr(['Indicateur', labelN, labelN1]);

  // effectif début période N = fin N-1 ; début N-1 = fin N-2 (non dispo directement)
  const effFinN   = empN.length;
  const effFinN1  = empN1.length;
  const effDebN   = effFinN1;     // début N = fin N-1
  const effMoyN   = (effDebN + effFinN) / 2;
  const effMoyN1  = '—';         // début N-1 non calculable sans empN2

  const depNtot  = depN.length;
  const depN1tot = depN1.length;
  const depNvol  = depN.filter(r => isVoluntary(r.departure_reason || '')).length;
  const depN1vol = depN1.filter(r => isVoluntary(r.departure_reason || '')).length;
  const depNinv  = depNtot - depNvol;
  const depN1inv = depN1tot - depN1vol;

  const DATA: [string, number | string, number | string][] = [
    ['Effectif début de période (01/06)',  effDebN,  '—'],
    ['Effectif fin de période (31/05)',    effFinN,  effFinN1],
    ['Effectif moyen',                    Math.round(effMoyN * 10) / 10, effMoyN1],
    ['Départs totaux (auto)',              depNtot,  depN1tot],
    ['dont : départs volontaires (auto)',  depNvol,  depN1vol],
    ['dont : départs involontaires (auto)',depNinv, depN1inv],
    ['Départs remplacés (auto)',           '—',      '—'],
    ['Nouvelles entrées',                  newN.length, newN1.length],
  ];
  DATA.forEach(([l, n, n1], i) => dataRow(l, n, n1, i % 2 === 1));

  // ── Résultats ──
  gap();
  sect('RÉSULTATS');
  hdr(['Indicateur', labelN, labelN1]);

  const toGlobal = effMoyN > 0 ? depNtot / effMoyN : 0;

  totRow('Turn-Over Global (%)',      toGlobal, '—', true);
  totRow('Turn-Over Fonctionnel (%)', '—',      '—', false);

  gap();
  sh.mergeCells(`A${rn}:C${rn}`);
  sh.getCell(`A${rn}`).value =
    "Les départs sont comptés automatiquement. Saisir chaque départ avec sa date, son type et si la personne a été remplacée.";
  sh.getCell(`A${rn}`).style = mkNote() as ExcelJS.Style;
  sh.getRow(rn).height = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET 8 — Motifs de Départ
// ─────────────────────────────────────────────────────────────────────────────
function sheetMotifsDépart(
  wb: ExcelJS.Workbook, depN: any[], depN1: any[],
  labelN: string, labelN1: string, year: number,
) {
  const sh = wb.addWorksheet('Motifs de Départ');
  [30, 16, 14, 16, 14].forEach((w, i) => sh.getColumn(i + 1).width = w);

  sh.mergeCells('A1:E1');
  applyStyle(sh.getCell('A1'), mkTitle(12));
  sh.getCell('A1').value = 'MOTIFS DE DÉPART';
  sh.getRow(1).height = 28;

  sh.getRow(2).height = 8;

  const hRow = sh.addRow([
    'Motif',
    `Départs ${labelN}`, `% ${year}`,
    `Départs ${labelN1}`, `% ${year - 1}`,
  ]);
  hRow.eachCell(c => applyStyle(c, mkColHeader()));
  sh.getRow(3).height = 22;

  const totN  = depN.length  || 1;
  const totN1 = depN1.length || 1;

  DR_KEYS.forEach((dr, idx) => {
    const n  = depN.filter(r => r.departure_reason === dr).length;
    const n1 = depN1.filter(r => r.departure_reason === dr).length;
    const alt = idx % 2 === 1;
    const row = sh.addRow([DR_LABELS[dr], n, n / totN, n1, n1 / totN1]);
    applyStyle(row.getCell(1), mkData(alt, 'left'));
    applyStyle(row.getCell(2), mkData(alt));
    applyStyle(row.getCell(3), mkDataPct(alt));
    applyStyle(row.getCell(4), mkData(alt));
    applyStyle(row.getCell(5), mkDataPct(alt));
    sh.getRow(idx + 4).height = 18;
  });

  const realTotN  = depN.length;
  const realTotN1 = depN1.length;
  const tRow = sh.addRow(['TOTAL', realTotN, realTotN > 0 ? 1 : 0, realTotN1, realTotN1 > 0 ? 1 : 0]);
  applyStyle(tRow.getCell(1), mkTotal('left'));
  applyStyle(tRow.getCell(2), mkTotal());
  applyStyle(tRow.getCell(3), mkTotalPct());
  applyStyle(tRow.getCell(4), mkTotal());
  applyStyle(tRow.getCell(5), mkTotalPct());
  sh.getRow(DR_KEYS.length + 4).height = 18;

  const noteRn = DR_KEYS.length + 6;
  sh.getRow(noteRn).height = 10;
  sh.mergeCells(`A${noteRn + 1}:E${noteRn + 1}`);
  sh.getCell(`A${noteRn + 1}`).value =
    "Les motifs sont comptés automatiquement depuis l'onglet 'Mouvements' (colonne D). Respecter l'orthographe exacte des motifs lors de la saisie.";
  sh.getCell(`A${noteRn + 1}`).style = mkNote() as ExcelJS.Style;
  sh.getRow(noteRn + 1).height = 20;
}
