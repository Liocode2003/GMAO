import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const GRADE_LABELS: Record<string, string> = {
  ASSOCIE: 'Associé',
  DIRECTEUR: 'Directeur',
  SENIOR_MANAGER_3: 'Sénior Manager 3',
  SENIOR_MANAGER_2: 'Sénior Manager 2',
  SENIOR_MANAGER_1: 'Sénior Manager 1',
  ASSISTANT_MANAGER_3: 'Manager 3',
  ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_1: 'Manager 1',
  CONSULTANT: 'Sénior Consultant',
  SENIOR_3: 'Senior 3',
  SENIOR_2: 'Senior 2',
  SENIOR_1: 'Senior 1',
  ASSISTANT_CONFIRME: 'Assistant confirmé',
  ASSISTANT_DEBUTANT: 'Assistant débutant',
  JUNIOR: 'Junior',
};

const DEPT_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE: 'Audit & Assurances',
  CONSULTING_FA: 'Consulting & FA',
  OUTSOURCING: 'Outsourcing',
  JURIDIQUE_FISCALITE: 'Tax & Legal',
  ADMINISTRATION: 'Administration',
};

const REASON_LABELS: Record<string, string> = {
  NOUVELLES_OPPORTUNITES: 'Nouvelles opportunités',
  RAISONS_PERSONNELLES: 'Raisons personnelles',
  REMUNERATION: 'Rémunération',
  MANAGEMENT: 'Management',
  AUTRES: 'Autres',
};

// ─── Couleurs & styles ────────────────────────────────────────────────────────

const C = {
  NAVY:       'FF1B3A5C',
  NAVY_LIGHT: 'FF2C5282',
  SECTION_BG: 'FFD6E4F0',
  TOTAL_BG:   'FFE8F0F8',
  ALT_ROW:    'FFF7FAFC',
  WHITE:      'FFFFFFFF',
  TEXT_DARK:  'FF1A202C',
  TEXT_MUTED: 'FF718096',
  GREEN:      'FF276749',
  GREEN_BG:   'FFC6F6D5',
  RED:        'FF9B2335',
  RED_BG:     'FFFED7D7',
};

const borders = (color = 'FFD1D5DB'): ExcelJS.Borders => ({
  top:      { style: 'thin', color: { argb: color } },
  bottom:   { style: 'thin', color: { argb: color } },
  left:     { style: 'thin', color: { argb: color } },
  right:    { style: 'thin', color: { argb: color } },
  diagonal: { style: 'thin', color: { argb: color } },
});

const styleHeader = (cell: ExcelJS.Cell) => {
  cell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY } },
    font: { bold: true, color: { argb: C.WHITE }, size: 10 },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: borders('FF4A5568'),
  };
};

const styleSection = (cell: ExcelJS.Cell) => {
  cell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SECTION_BG } },
    font: { bold: true, color: { argb: C.NAVY }, size: 10 },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: borders(),
  };
};

const styleTotal = (cell: ExcelJS.Cell, alignRight = false) => {
  cell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.TOTAL_BG } },
    font: { bold: true, color: { argb: C.NAVY }, size: 10 },
    alignment: { horizontal: alignRight ? 'right' : 'center', vertical: 'middle' },
    border: borders('FF4A5568'),
  };
};

const styleData = (cell: ExcelJS.Cell, align: ExcelJS.Alignment['horizontal'] = 'center', alt = false) => {
  cell.style = {
    fill: alt ? { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ALT_ROW } } : { type: 'pattern', pattern: 'none' },
    font: { size: 10, color: { argb: C.TEXT_DARK } },
    alignment: { horizontal: align, vertical: 'middle', wrapText: true },
    border: borders(),
  };
};

const styleTitle = (cell: ExcelJS.Cell) => {
  cell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY } },
    font: { bold: true, color: { argb: C.WHITE }, size: 13 },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: unknown): string => {
  if (!d) return '';
  return new Date(d as string).toLocaleDateString('fr-FR');
};

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

const calcAge = (birthDate: unknown): number | string => {
  if (!birthDate) return '';
  const birth = new Date(birthDate as string);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const departureType = (reason: string | null): string => {
  if (!reason) return '—';
  if (['NOUVELLES_OPPORTUNITES', 'RAISONS_PERSONNELLES', 'REMUNERATION', 'MANAGEMENT'].includes(reason))
    return 'Volontaire';
  return '—';
};

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export const generateMonthlyReport = async (year: number, month: number): Promise<string> => {
  const monthName   = MONTH_NAMES[month - 1];
  const endDate     = new Date(year, month, 0).toISOString().split('T')[0];   // dernier jour du mois
  const prevEndDate = new Date(year - 1, month, 0).toISOString().split('T')[0];
  const startYear   = `${year}-01-01`;
  const prevStartYear = `${year - 1}-01-01`;

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'SGRH Forvis Mazars';
  wb.created  = new Date();

  await buildListePersonnel(wb, monthName, year, endDate);
  await buildEffectifs(wb, monthName, year, endDate, prevEndDate);
  await buildMouvements(wb, year, startYear, endDate, prevStartYear, prevEndDate);
  await buildParDepartement(wb, monthName, year, endDate, prevEndDate);
  await buildTranchesAge(wb, monthName, year, endDate);
  await buildTurnOver(wb, monthName, year, endDate, prevEndDate, startYear, prevStartYear);
  await buildMotifsDeparture(wb, monthName, year, startYear, endDate, prevStartYear, prevEndDate);

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const filename = `Reporting_RH_ForvisMazars_BF_${monthName}${year}.xlsx`;
  const filePath = path.join(reportsDir, filename);
  await wb.xlsx.writeFile(filePath);
  logger.info(`Rapport généré : ${filePath}`);
  return filePath;
};

// ─── Feuille 1 : Liste Personnel ─────────────────────────────────────────────

async function buildListePersonnel(wb: ExcelJS.Workbook, monthName: string, year: number, endDate: string) {
  const ws = wb.addWorksheet('Liste Personnel');
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

  // Titre
  ws.mergeCells('A1:K1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = `LISTE DU PERSONNEL – FIN ${monthName.toUpperCase()} ${year}`;
  ws.getRow(1).height = 28;

  // En-têtes
  const hdrs = [
    'N°', 'Nom et Prénoms', "Date d'Entrée", 'Date de Naissance',
    'Genre', 'Grade', 'Département', 'Catégorie', 'Date de sortie', 'Motif', 'Âge',
  ];
  const hRow = ws.addRow(hdrs);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  // Largeurs colonnes
  const widths = [5, 34, 13, 15, 8, 22, 20, 12, 14, 36, 6];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Données : actifs d'abord, puis sortants
  const rows = await query(
    `SELECT matricule, first_name, last_name, entry_date, birth_date, gender,
            grade, service_line, contract_type, exit_date, departure_reason
     FROM employees
     ORDER BY
       CASE WHEN exit_date IS NULL OR exit_date > $1 THEN 0 ELSE 1 END,
       last_name, first_name`,
    [endDate]
  );

  rows.rows.forEach((r, i) => {
    const alt = i % 2 === 1;
    const isActive = !r.exit_date || new Date(r.exit_date) > new Date(endDate);
    const genre   = r.gender === 'M' ? 'Homme' : 'Dame';
    const cat     = r.contract_type === 'CONSULTANT' ? 'Consultant' : 'Permanent';
    const motif   = r.departure_reason ? REASON_LABELS[r.departure_reason] ?? r.departure_reason : '';
    const age     = isActive ? calcAge(r.birth_date) : '';

    const dataRow = ws.addRow([
      i + 1,
      `${r.last_name} ${r.first_name}`,
      r.entry_date ? new Date(r.entry_date) : '',
      r.birth_date ? new Date(r.birth_date) : '',
      genre,
      GRADE_LABELS[r.grade] ?? r.grade,
      DEPT_LABELS[r.service_line] ?? r.service_line,
      cat,
      r.exit_date ? new Date(r.exit_date) : '',
      motif,
      age,
    ]);

    dataRow.eachCell((cell, ci) => {
      styleData(cell, ci === 2 || ci === 10 ? 'left' : 'center', alt);
    });

    // Formatage dates
    [3, 4, 9].forEach(ci => {
      const cell = dataRow.getCell(ci);
      if (cell.value instanceof Date) cell.numFmt = 'dd/mm/yyyy';
    });

    // Surlignage rouge pour les sortants
    if (!isActive) {
      dataRow.eachCell(cell => {
        cell.font = { ...cell.font, color: { argb: C.RED } };
      });
    }

    dataRow.height = 18;
  });
}

// ─── Feuille 2 : Effectifs ────────────────────────────────────────────────────

async function buildEffectifs(
  wb: ExcelJS.Workbook, monthName: string, year: number, endDate: string, prevEndDate: string
) {
  const ws = wb.addWorksheet('Effectifs');

  const colLabel = `Fin ${monthName} ${year}`;
  const colPrev  = `Fin ${monthName} ${year - 1}`;

  // Titre
  ws.mergeCells('A1:E1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = 'EFFECTIFS – FORVIS MAZARS BURKINA FASO';
  ws.getRow(1).height = 28;

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;

  const addBlank = () => { ws.addRow([]); };

  // ── Section 1 : Effectif total ──
  addBlank();
  ws.mergeCells(`A${ws.rowCount}:E${ws.rowCount}`);
  styleSection(ws.getCell(`A${ws.rowCount}`));
  ws.getCell(`A${ws.rowCount}`).value = '1. EFFECTIF TOTAL (HORS STAGIAIRES ÉCOLE)';

  const hRow1 = ws.addRow(['Catégorie', colLabel, colPrev, 'Variation', '% Variation']);
  hRow1.eachCell(styleHeader);
  hRow1.height = 22;

  const permCur = await headcount(endDate, 'CDI', 'CDD');
  const permPrv = await headcount(prevEndDate, 'CDI', 'CDD');
  const consCur = await headcount(endDate, 'CONSULTANT');
  const consPrv = await headcount(prevEndDate, 'CONSULTANT');
  const totCur  = permCur + consCur;
  const totPrv  = permPrv + consPrv;

  const addEff = (label: string, cur: number, prv: number, idx: number) => {
    const delta = cur - prv;
    const pct   = prv > 0 ? delta / prv : 0;
    const alt   = idx % 2 === 1;
    const row = ws.addRow([label, cur, prv, delta, fmtPct(pct)]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', alt));
    row.height = 18;
  };

  addEff('Permanents',  permCur, permPrv, 0);
  addEff('Consultants', consCur, consPrv, 1);

  const totRow = ws.addRow(['TOTAL GÉNÉRAL', totCur, totPrv, totCur - totPrv, fmtPct(totPrv > 0 ? (totCur - totPrv) / totPrv : 0)]);
  totRow.eachCell((c, ci) => styleTotal(c, ci !== 1));
  if (ci1(totRow, 4) > 0) totRow.getCell(4).font = { ...totRow.getCell(4).font, color: { argb: C.GREEN } };
  totRow.height = 20;

  // ── Section 2 : H/F ──
  addBlank();
  ws.mergeCells(`A${ws.rowCount}:E${ws.rowCount}`);
  styleSection(ws.getCell(`A${ws.rowCount}`));
  ws.getCell(`A${ws.rowCount}`).value = '2. RÉPARTITION HOMMES / FEMMES';

  const hRow2 = ws.addRow([
    'Genre',
    colLabel, `% ${monthName} ${year}`,
    colPrev,  `% ${monthName} ${year - 1}`,
  ]);
  hRow2.eachCell(styleHeader);
  hRow2.height = 22;

  const gcur = await genderCount(endDate);
  const gprv = await genderCount(prevEndDate);
  const gtotCur = (gcur.M || 0) + (gcur.F || 0);
  const gtotPrv = (gprv.M || 0) + (gprv.F || 0);

  const addGender = (label: string, cur: number, prv: number, idx: number) => {
    const row = ws.addRow([
      label, cur,
      fmtPct(gtotCur > 0 ? cur / gtotCur : 0),
      prv,
      fmtPct(gtotPrv > 0 ? prv / gtotPrv : 0),
    ]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', idx % 2 === 1));
    row.height = 18;
  };

  addGender('Hommes', gcur.M || 0, gprv.M || 0, 0);
  addGender('Femmes', gcur.F || 0, gprv.F || 0, 1);

  const totGRow = ws.addRow(['TOTAL', gtotCur, '100%', gtotPrv, '100%']);
  totGRow.eachCell((c, ci) => styleTotal(c, ci !== 1));
  totGRow.height = 20;
}

// helper: cellule numérique d'une ligne
function ci1(row: ExcelJS.Row, colIndex: number): number {
  return Number(row.getCell(colIndex).value) || 0;
}

async function headcount(date: string, ...contractTypes: string[]): Promise<number> {
  let sql: string;
  let params: unknown[];

  if (contractTypes.length === 0) {
    sql = `SELECT COUNT(*) as n FROM employees
           WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
             AND contract_type::text != 'STAGE'`;
    params = [date];
  } else {
    const ph = contractTypes.map((_, i) => `$${i + 2}`).join(', ');
    sql = `SELECT COUNT(*) as n FROM employees
           WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
             AND contract_type::text IN (${ph})`;
    params = [date, ...contractTypes];
  }

  const res = await query(sql, params);
  return parseInt(res.rows[0].n) || 0;
}

async function genderCount(date: string): Promise<Record<string, number>> {
  const res = await query(
    `SELECT gender, COUNT(*) as n FROM employees
     WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
       AND contract_type NOT IN ('STAGE')
     GROUP BY gender`,
    [date]
  );
  const m: Record<string, number> = {};
  res.rows.forEach((r: { gender: string; n: string }) => { m[r.gender] = parseInt(r.n) || 0; });
  return m;
}

// ─── Feuille 3 : Mouvements ───────────────────────────────────────────────────

async function buildMouvements(
  wb: ExcelJS.Workbook, year: number,
  startCur: string, endCur: string, startPrv: string, endPrv: string
) {
  const ws = wb.addWorksheet('Mouvements');

  ws.mergeCells('A1:G1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = 'MOUVEMENTS DU PERSONNEL – DÉPARTS';
  ws.getRow(1).height = 28;

  const hdrs = [
    'N°', 'Nom et Prénoms', 'Date de Départ',
    'Motif de Départ', 'Type de Départ', 'Remplacé (O/N)', 'Période',
  ];
  const hRow = ws.addRow(hdrs);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  const widths = [5, 34, 14, 24, 16, 14, 14];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Départs N-1 puis N
  const rows = await query(
    `SELECT last_name, first_name, exit_date, departure_reason
     FROM employees
     WHERE exit_date BETWEEN $1 AND $2 OR exit_date BETWEEN $3 AND $4
     ORDER BY exit_date`,
    [startPrv, endPrv, startCur, endCur]
  );

  rows.rows.forEach((r, i) => {
    const alt = i % 2 === 1;
    const exitDt  = new Date(r.exit_date);
    const periode = `${MONTH_NAMES[exitDt.getMonth()]} ${exitDt.getFullYear()}`;
    const motifLabel = r.departure_reason ? REASON_LABELS[r.departure_reason] ?? r.departure_reason : '—';
    const typeDepart = departureType(r.departure_reason);

    const row = ws.addRow([
      i + 1,
      `${r.last_name} ${r.first_name}`,
      exitDt,
      motifLabel,
      typeDepart,
      '—',
      periode,
    ]);

    row.eachCell((c, ci) => styleData(c, ci === 2 || ci === 4 ? 'left' : 'center', alt));
    row.getCell(3).numFmt = 'dd/mm/yyyy';
    row.height = 18;
  });

  if (rows.rows.length === 0) {
    const r = ws.addRow(['—', 'Aucun départ enregistré', '', '', '', '', '']);
    r.eachCell(c => styleData(c, 'center'));
  }
}

// ─── Feuille 4 : Par Département ─────────────────────────────────────────────

async function buildParDepartement(
  wb: ExcelJS.Workbook, monthName: string, year: number, endDate: string, prevEndDate: string
) {
  const ws = wb.addWorksheet('Par Département');

  ws.mergeCells('A1:E1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = 'EFFECTIFS PAR DÉPARTEMENT';
  ws.getRow(1).height = 28;

  ws.addRow([]);

  const hRow = ws.addRow([
    'Département',
    `Fin ${monthName} ${year}`, `% Total ${year}`,
    `Fin ${monthName} ${year - 1}`, `% Total ${year - 1}`,
  ]);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  ws.getColumn(1).width = 28;
  [2, 3, 4, 5].forEach(i => { ws.getColumn(i).width = 16; });

  const depts = [
    'AUDIT_ASSURANCE', 'ADMINISTRATION', 'CONSULTING_FA', 'OUTSOURCING', 'JURIDIQUE_FISCALITE',
  ];

  const [curRes, prvRes] = await Promise.all([
    query(
      `SELECT service_line, COUNT(*) as n FROM employees
       WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
         AND contract_type NOT IN ('STAGE')
       GROUP BY service_line`,
      [endDate]
    ),
    query(
      `SELECT service_line, COUNT(*) as n FROM employees
       WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
         AND contract_type NOT IN ('STAGE')
       GROUP BY service_line`,
      [prevEndDate]
    ),
  ]);

  const curMap: Record<string, number> = {};
  const prvMap: Record<string, number> = {};
  curRes.rows.forEach((r: { service_line: string; n: string }) => { curMap[r.service_line] = parseInt(r.n) || 0; });
  prvRes.rows.forEach((r: { service_line: string; n: string }) => { prvMap[r.service_line] = parseInt(r.n) || 0; });

  const totCur = Object.values(curMap).reduce((a, b) => a + b, 0);
  const totPrv = Object.values(prvMap).reduce((a, b) => a + b, 0);

  depts.forEach((dept, i) => {
    const cur = curMap[dept] || 0;
    const prv = prvMap[dept] || 0;
    const row = ws.addRow([
      DEPT_LABELS[dept] ?? dept,
      cur, fmtPct(totCur > 0 ? cur / totCur : 0),
      prv, fmtPct(totPrv > 0 ? prv / totPrv : 0),
    ]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', i % 2 === 1));
    row.height = 18;
  });

  const totRow = ws.addRow(['TOTAL', totCur, '100%', totPrv, '100%']);
  totRow.eachCell((c, ci) => styleTotal(c, ci !== 1));
  totRow.height = 20;
}

// ─── Feuille 5 : Tranches d'Âge ──────────────────────────────────────────────

async function buildTranchesAge(wb: ExcelJS.Workbook, monthName: string, year: number, endDate: string) {
  const ws = wb.addWorksheet("Tranches d'Âge");

  ws.mergeCells('A1:C1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = `RÉPARTITION PAR TRANCHES D'ÂGE – FIN ${monthName.toUpperCase()} ${year}`;
  ws.getRow(1).height = 28;

  ws.addRow([]);

  const hRow = ws.addRow(["Tranche d'âge", 'Effectif', '% du Total']);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 14;

  const tranches = [
    { label: 'Moins de 25 ans', min: 0,  max: 24  },
    { label: '25 – 29 ans',     min: 25, max: 29  },
    { label: '30 – 34 ans',     min: 30, max: 34  },
    { label: '35 – 39 ans',     min: 35, max: 39  },
    { label: '40 – 44 ans',     min: 40, max: 44  },
    { label: '45 – 49 ans',     min: 45, max: 49  },
    { label: '50 ans et plus',  min: 50, max: 999 },
  ];

  const res = await query(
    `SELECT
       DATE_PART('year', AGE($1::date, birth_date))::int as age,
       COUNT(*) as n
     FROM employees
     WHERE entry_date <= $1
       AND (exit_date IS NULL OR exit_date > $1)
       AND birth_date IS NOT NULL
       AND contract_type NOT IN ('STAGE')
     GROUP BY age`,
    [endDate]
  );

  const ageCounts: Record<number, number> = {};
  res.rows.forEach((r: { age: number; n: string }) => { ageCounts[r.age] = parseInt(r.n) || 0; });
  const total = Object.values(ageCounts).reduce((a, b) => a + b, 0);

  tranches.forEach((t, i) => {
    const count = Object.entries(ageCounts)
      .filter(([age]) => parseInt(age) >= t.min && parseInt(age) <= t.max)
      .reduce((a, [, v]) => a + v, 0);
    const row = ws.addRow([t.label, count, fmtPct(total > 0 ? count / total : 0)]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', i % 2 === 1));
    row.height = 18;
  });

  const totRow = ws.addRow(['TOTAL', total, '100%']);
  totRow.eachCell((c, ci) => styleTotal(c, ci !== 1));
  totRow.height = 20;
}

// ─── Feuille 6 : Turn-Over ────────────────────────────────────────────────────

async function buildTurnOver(
  wb: ExcelJS.Workbook, monthName: string, year: number,
  endCur: string, endPrv: string, startCur: string, startPrv: string
) {
  const ws = wb.addWorksheet('Turn-Over');

  const colCur = `Fin ${monthName} ${year}`;
  const colPrv = `Fin ${monthName} ${year - 1}`;

  ws.getColumn(1).width = 40;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 18;

  // ── Titre ──
  ws.mergeCells('A1:C1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = 'ANALYSE DU TURN-OVER';
  ws.getRow(1).height = 28;

  // ── Rappel formules ──
  ws.addRow([]);
  const addFormuleSection = () => {
    ws.mergeCells(`A${ws.rowCount}:C${ws.rowCount}`);
    styleSection(ws.getCell(`A${ws.rowCount}`));
    ws.getCell(`A${ws.rowCount}`).value = 'RAPPEL DES FORMULES';
  };
  addFormuleSection();

  const formules = [
    ['Turn-Over Global',      'Départs totaux / Effectif moyen x 100'],
    ['Turn-Over Fonctionnel', 'Départs remplacés / Effectif moyen x 100'],
    ['Effectif moyen',        '(Effectif début de période + Effectif fin de période) / 2'],
  ];
  formules.forEach(([label, formula]) => {
    const r = ws.addRow([label, formula, '']);
    r.getCell(1).style = { font: { bold: true, size: 10 }, alignment: { horizontal: 'left', vertical: 'middle' }, border: borders() };
    r.getCell(2).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.ALT_ROW } },
      font: { size: 10, color: { argb: C.TEXT_MUTED } },
      alignment: { horizontal: 'left', vertical: 'middle' }, border: borders(),
    };
    ws.mergeCells(`B${r.number}:C${r.number}`);
    r.height = 18;
  });

  // ── Données de calcul ──
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:C${ws.rowCount}`);
  styleSection(ws.getCell(`A${ws.rowCount}`));
  ws.getCell(`A${ws.rowCount}`).value = 'DONNÉES DE CALCUL';

  const hRow = ws.addRow(['Indicateur', colCur, colPrv]);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  const headStartCur = await headcount(startCur);
  const headEndCur   = await headcount(endCur);
  const headStartPrv = await headcount(startPrv);
  const headEndPrv   = await headcount(endPrv);
  const avgCur = Math.round((headStartCur + headEndCur) / 2);
  const avgPrv = Math.round((headStartPrv + headEndPrv) / 2);

  const depTotCur = await departuresCount(startCur, endCur);
  const depTotPrv = await departuresCount(startPrv, endPrv);
  const depVolCur = await departuresCount(startCur, endCur, 'voluntary');
  const depVolPrv = await departuresCount(startPrv, endPrv, 'voluntary');
  const depInvCur = depTotCur - depVolCur;
  const depInvPrv = depTotPrv - depVolPrv;
  const entriesCur = await entriesCount(startCur, endCur);
  const entriesPrv = await entriesCount(startPrv, endPrv);

  const calcLines: [string, number | string, number | string][] = [
    [`Effectif début de période (01/${String(new Date(startCur).getMonth() + 1).padStart(2,'0')})`, headStartCur, headStartPrv],
    [`Effectif fin de période (${endCur.slice(8)}/${String(month0(endCur))})`, headEndCur, headEndPrv],
    ['Effectif moyen',                headEndCur > 0 ? avgCur : '—', headEndPrv > 0 ? avgPrv : '—'],
    ['Départs totaux',                depTotCur, depTotPrv],
    ['Dont : départs volontaires',    depVolCur, depVolPrv],
    ['Dont : départs involontaires',  depInvCur, depInvPrv],
    ['Départs remplacés',             '—',       '—'],
    ['Nouvelles entrées',             entriesCur, entriesPrv],
  ];

  calcLines.forEach(([label, cur, prv], i) => {
    const row = ws.addRow([label, cur, prv]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', i % 2 === 1));
    row.height = 18;
  });

  // ── Résultats ──
  ws.addRow([]);
  ws.mergeCells(`A${ws.rowCount}:C${ws.rowCount}`);
  styleSection(ws.getCell(`A${ws.rowCount}`));
  ws.getCell(`A${ws.rowCount}`).value = 'RÉSULTATS';

  const hRow2 = ws.addRow(['Indicateur', colCur, colPrv]);
  hRow2.eachCell(styleHeader);
  hRow2.height = 22;

  const toGloCur = avgCur > 0 ? ((depTotCur / avgCur) * 100).toFixed(1) + '%' : '—';
  const toGloPrv = avgPrv > 0 ? ((depTotPrv / avgPrv) * 100).toFixed(1) + '%' : '—';

  const resultLines: [string, string, string][] = [
    ['Turn-Over Global (%)',      toGloCur, toGloPrv],
    ['Turn-Over Fonctionnel (%)', '—',      '—'],
  ];

  resultLines.forEach(([label, cur, prv], i) => {
    const row = ws.addRow([label, cur, prv]);
    row.eachCell((c, ci) => styleTotal(c, ci !== 1));
    row.getCell(1).style = { ...row.getCell(1).style, alignment: { horizontal: 'left' } };
    row.height = 20;
  });
}

// ─── Feuille 7 : Motifs de Départ ────────────────────────────────────────────

async function buildMotifsDeparture(
  wb: ExcelJS.Workbook, monthName: string, year: number,
  startCur: string, endCur: string, startPrv: string, endPrv: string
) {
  const ws = wb.addWorksheet('Motifs de Départ');

  ws.mergeCells('A1:E1');
  styleTitle(ws.getCell('A1'));
  ws.getCell('A1').value = 'MOTIFS DE DÉPART';
  ws.getRow(1).height = 28;

  ws.addRow([]);

  const hRow = ws.addRow([
    'Motif',
    `Départs ${monthName} ${year}`, `% ${year}`,
    `Départs ${monthName} ${year - 1}`, `% ${year - 1}`,
  ]);
  hRow.eachCell(styleHeader);
  hRow.height = 22;

  ws.getColumn(1).width = 28;
  [2, 3, 4, 5].forEach(i => { ws.getColumn(i).width = 16; });

  const MOTIFS = ['NOUVELLES_OPPORTUNITES', 'RAISONS_PERSONNELLES', 'REMUNERATION', 'MANAGEMENT', 'AUTRES'];

  const [resCur, resPrv] = await Promise.all([
    query(
      `SELECT COALESCE(departure_reason, 'AUTRES') as reason, COUNT(*) as n
       FROM employees WHERE exit_date BETWEEN $1 AND $2
         AND contract_type NOT IN ('STAGE')
       GROUP BY reason`,
      [startCur, endCur]
    ),
    query(
      `SELECT COALESCE(departure_reason, 'AUTRES') as reason, COUNT(*) as n
       FROM employees WHERE exit_date BETWEEN $1 AND $2
         AND contract_type NOT IN ('STAGE')
       GROUP BY reason`,
      [startPrv, endPrv]
    ),
  ]);

  const curMap: Record<string, number> = {};
  const prvMap: Record<string, number> = {};
  resCur.rows.forEach((r: { reason: string; n: string }) => { curMap[r.reason] = parseInt(r.n) || 0; });
  resPrv.rows.forEach((r: { reason: string; n: string }) => { prvMap[r.reason] = parseInt(r.n) || 0; });

  const totCur = Object.values(curMap).reduce((a, b) => a + b, 0);
  const totPrv = Object.values(prvMap).reduce((a, b) => a + b, 0);

  MOTIFS.forEach((motif, i) => {
    const cur = curMap[motif] || 0;
    const prv = prvMap[motif] || 0;
    const row = ws.addRow([
      REASON_LABELS[motif],
      cur, fmtPct(totCur > 0 ? cur / totCur : 0),
      prv, fmtPct(totPrv > 0 ? prv / totPrv : 0),
    ]);
    row.eachCell((c, ci) => styleData(c, ci === 1 ? 'left' : 'center', i % 2 === 1));
    row.height = 18;
  });

  const totRow = ws.addRow(['TOTAL', totCur, '100%', totPrv, '100%']);
  totRow.eachCell((c, ci) => styleTotal(c, ci !== 1));
  totRow.height = 20;
}

// ─── Helpers supplémentaires ──────────────────────────────────────────────────

async function departuresCount(from: string, to: string, type?: 'voluntary'): Promise<number> {
  const voluntaryReasons = "('NOUVELLES_OPPORTUNITES','RAISONS_PERSONNELLES','REMUNERATION','MANAGEMENT')";
  const filter = type === 'voluntary'
    ? `AND departure_reason IN ${voluntaryReasons}`
    : '';
  const res = await query(
    `SELECT COUNT(*) as n FROM employees
     WHERE exit_date BETWEEN $1 AND $2
       AND contract_type NOT IN ('STAGE') ${filter}`,
    [from, to]
  );
  return parseInt(res.rows[0].n) || 0;
}

async function entriesCount(from: string, to: string): Promise<number> {
  const res = await query(
    `SELECT COUNT(*) as n FROM employees
     WHERE entry_date BETWEEN $1 AND $2
       AND contract_type NOT IN ('STAGE')`,
    [from, to]
  );
  return parseInt(res.rows[0].n) || 0;
}

function month0(dateStr: string): number {
  return new Date(dateStr).getMonth() + 1;
}
