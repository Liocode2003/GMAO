import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const GRADE_LABELS: Record<string, string> = {
  ASSOCIE: 'Associé',
  DIRECTEUR: 'Directeur',
  SENIOR_MANAGER_3: 'Senior Manager 3',
  SENIOR_MANAGER_2: 'Senior Manager 2',
  SENIOR_MANAGER_1: 'Senior Manager 1',
  ASSISTANT_MANAGER_3: 'Manager 3',
  ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_1: 'Manager 1',
  CONSULTANT: 'Consultant',
  SENIOR_3: 'Senior 3',
  SENIOR_2: 'Senior 2',
  SENIOR_1: 'Senior 1',
  ASSISTANT_CONFIRME: 'Assistant Confirmé',
  ASSISTANT_DEBUTANT: 'Assistant Débutant',
  JUNIOR: 'Junior',
};

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
  font: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
};

const DATA_STYLE: Partial<ExcelJS.Style> = {
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  },
};

export const generateMonthlyReport = async (year: number, month: number): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SGRH Cabinet';
  workbook.created = new Date();

  const monthName = MONTH_NAMES[month - 1];
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthName = MONTH_NAMES[prevMonth - 1];

  // ====== ONGLET 1: KPI Année ======
  await buildKPISheet(workbook, year, monthName);

  // ====== ONGLET 2: Effectif par ligne de service ======
  await buildHeadcountSheet(workbook);

  // ====== ONGLET 3: Formation mois courant ======
  await buildTrainingSheet(workbook, year, month, `Formation - ${monthName} ${year}`);

  // ====== ONGLET 4: Formation mois précédent ======
  await buildTrainingSheet(workbook, prevYear, prevMonth, `Formation - ${prevMonthName} ${prevYear}`);

  // Sauvegarde
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const filename = `Données_du_mois_RH_${year}_${String(month).padStart(2, '0')}.xlsx`;
  const filePath = path.join(reportsDir, filename);
  await workbook.xlsx.writeFile(filePath);

  logger.info(`Rapport généré: ${filePath}`);
  return filePath;
};

async function buildKPISheet(workbook: ExcelJS.Workbook, year: number, monthName: string) {
  const sheet = workbook.addWorksheet('KPI Année');
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true };

  // Titre principal (ligne 1)
  sheet.mergeCells('A1:O1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `TABLEAU DE BORD RH - ANNÉE ${year}`;
  titleCell.style = {
    font: { bold: true, size: 14, color: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center' },
  };
  sheet.getRow(1).height = 30;

  // Ligne 2: espaceur
  sheet.getRow(2).height = 8;

  // Ligne 3: Titre entreprise
  sheet.mergeCells('A3:O3');
  const companyTitleCell = sheet.getCell('A3');
  companyTitleCell.value = "KPI's Ressources Humaines Forvis Mazars West And Central Africa : BURKINA FASO";
  companyTitleCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  sheet.getRow(3).height = 40;

  // En-têtes colonnes (ligne 4)
  const months = MONTH_NAMES.slice(0, 12);
  const headers = ['Indicateur', 'YTD', ...months, 'TARGET'];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => { cell.style = HEADER_STYLE; });
  sheet.getRow(4).height = 25;

  // Largeurs colonnes
  sheet.getColumn(1).width = 35;
  for (let i = 2; i <= 15; i++) sheet.getColumn(i).width = 12;

  // Données KPI
  const kpiData = await query(`
    SELECT
      EXTRACT(YEAR FROM entry_date) as year,
      EXTRACT(MONTH FROM entry_date) as month,
      COUNT(*) as entries
    FROM employees
    WHERE EXTRACT(YEAR FROM entry_date) = $1
    GROUP BY EXTRACT(YEAR FROM entry_date), EXTRACT(MONTH FROM entry_date)
    ORDER BY month
  `, [year]);

  const monthlyEntries: number[] = new Array(12).fill(0);
  kpiData.rows.forEach(r => { monthlyEntries[parseInt(r.month) - 1] = parseInt(r.entries); });
  const ytdEntries = monthlyEntries.reduce((a, b) => a + b, 0);

  const targets = await query('SELECT indicator_key, target_value FROM kpi_targets WHERE year = $1', [year]);
  const targetMap: Record<string, number> = {};
  targets.rows.forEach(t => { targetMap[t.indicator_key] = t.target_value; });

  // Ligne section
  const addSection = (title: string) => {
    const row = sheet.addRow([title, ...new Array(14).fill('')]);
    row.getCell(1).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } },
      font: { bold: true, color: { argb: 'FF1E3A5F' } },
    };
    sheet.mergeCells(`A${row.number}:P${row.number}`);
  };

  const addKPIRow = (label: string, ytd: number, monthly: number[], target: number | null) => {
    const row = sheet.addRow([label, ytd, ...monthly, target ?? '—']);
    row.eachCell((cell, colNumber) => {
      cell.style = { ...DATA_STYLE };
      if (colNumber === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    // Alterner couleur
    if (sheet.rowCount % 2 === 0) {
      row.eachCell(cell => {
        cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } };
      });
    }
  };

  addSection('EFFECTIFS GLOBAUX');
  addKPIRow('Entrées', ytdEntries, monthlyEntries, targetMap['HEADCOUNT'] || null);

  // Sorties
  const exitData = await query(`
    SELECT EXTRACT(MONTH FROM exit_date) as month, COUNT(*) as exits
    FROM employees WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $1
    GROUP BY month ORDER BY month
  `, [year]);
  const monthlyExits: number[] = new Array(12).fill(0);
  exitData.rows.forEach(r => { monthlyExits[parseInt(r.month) - 1] = parseInt(r.exits); });
  addKPIRow('Sorties', monthlyExits.reduce((a,b) => a+b, 0), monthlyExits, null);

  // Formation
  addSection('FORMATION');
  const trainingData = await query(`
    SELECT EXTRACT(MONTH FROM date) as month, type, COALESCE(SUM(duration_hours),0) as hours
    FROM trainings WHERE EXTRACT(YEAR FROM date) = $1
    GROUP BY month, type ORDER BY month
  `, [year]);

  const formationTypes = ['INTRA','INTERNE','AOC','GROUPE'];
  const formationLabels: Record<string, string> = { INTRA: 'Formation INTRA', INTERNE: 'Formation INTERNE', AOC: 'Formation AOC', GROUPE: 'Formation GROUPE' };

  for (const type of formationTypes) {
    const monthly = new Array(12).fill(0);
    trainingData.rows.filter(r => r.type === type).forEach(r => {
      monthly[parseInt(r.month) - 1] = parseFloat(r.hours);
    });
    addKPIRow(formationLabels[type], monthly.reduce((a,b) => a+b, 0), monthly, null);
  }

  const totalHoursMonthly = new Array(12).fill(0);
  trainingData.rows.forEach(r => { totalHoursMonthly[parseInt(r.month) - 1] += parseFloat(r.hours); });
  addKPIRow('Total heures formation', totalHoursMonthly.reduce((a,b) => a+b, 0), totalHoursMonthly, targetMap['TRAINING_HOURS'] || 200);
}

async function buildHeadcountSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Effectifs par Département');

  const gradeGroups = [
    { key: 'ASSOCIE', label: 'Associé' },
    { key: 'DIRECTEUR', label: 'Directeur' },
    { key: 'SENIOR_MANAGER', label: 'Senior Manager' },
    { key: 'MANAGER_AM', label: 'Manager/AM' },
    { key: 'SENIOR', label: 'Senior' },
    { key: 'ASSISTANT', label: 'Assistant' },
    { key: 'PERS_ADMIN', label: 'Pers. Admin' },
  ];

  // Titre
  sheet.mergeCells('A1:J1');
  sheet.getCell('A1').value = 'EFFECTIFS PAR LIGNE DE SERVICE ET GRADE';
  sheet.getCell('A1').style = { font: { bold: true, size: 13, color: { argb: 'FF1E3A5F' } }, alignment: { horizontal: 'center' } };

  // Headers
  const headerRow = sheet.addRow(['Ligne de Service', ...gradeGroups.map(g => g.label), 'Total']);
  headerRow.eachCell(cell => { cell.style = HEADER_STYLE; });

  sheet.getColumn(1).width = 28;
  for (let i = 2; i <= 10; i++) sheet.getColumn(i).width = 15;

  const data = await query(`
    SELECT service_line, grade, COUNT(*) as count
    FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
    GROUP BY service_line, grade
  `);

  const serviceLines = [
    { key: 'AUDIT_ASSURANCE', label: 'Audit & Assurance' },
    { key: 'CONSULTING_FA', label: 'Consulting & FA' },
    { key: 'OUTSOURCING', label: 'Outsourcing' },
    { key: 'JURIDIQUE_FISCALITE', label: 'Juridique & Fiscalité' },
    { key: 'ADMINISTRATION', label: 'Administration' },
  ];

  const gradeMapping: Record<string, string> = {
    'ASSOCIE': 'ASSOCIE',
    'DIRECTEUR': 'DIRECTEUR',
    'SENIOR_MANAGER_1': 'SENIOR_MANAGER', 'SENIOR_MANAGER_2': 'SENIOR_MANAGER', 'SENIOR_MANAGER_3': 'SENIOR_MANAGER',
    'ASSISTANT_MANAGER_1': 'MANAGER_AM', 'ASSISTANT_MANAGER_2': 'MANAGER_AM', 'ASSISTANT_MANAGER_3': 'MANAGER_AM',
    'CONSULTANT': 'MANAGER_AM',
    'SENIOR_1': 'SENIOR', 'SENIOR_2': 'SENIOR', 'SENIOR_3': 'SENIOR',
    'JUNIOR': 'ASSISTANT',
    'ASSISTANT_CONFIRME': 'ASSISTANT', 'ASSISTANT_DEBUTANT': 'ASSISTANT',
  };

  let grandTotal = new Array(gradeGroups.length).fill(0);

  serviceLines.forEach(sl => {
    const rowData = [sl.label, ...new Array(gradeGroups.length).fill(0)];
    data.rows
      .filter(r => r.service_line === sl.key)
      .forEach(r => {
        const grpKey = gradeMapping[r.grade];
        const idx = gradeGroups.findIndex(g => g.key === grpKey);
        if (idx >= 0) {
          (rowData[idx + 1] as number) += parseInt(r.count);
          grandTotal[idx] += parseInt(r.count);
        }
      });
    const total = (rowData.slice(1) as number[]).reduce((a,b) => a+b, 0);
    rowData.push(total);
    const row = sheet.addRow(rowData);
    row.eachCell((cell, ci) => {
      cell.style = DATA_STYLE;
      if (ci === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
  });

  // Total row
  const totalRow = sheet.addRow(['TOTAL', ...grandTotal, grandTotal.reduce((a,b) => a+b, 0)]);
  totalRow.eachCell(cell => {
    cell.style = {
      ...HEADER_STYLE,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } },
    };
  });
}

async function buildTrainingSheet(workbook: ExcelJS.Workbook, year: number, month: number, sheetName: string) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.mergeCells('A1:J1');
  sheet.getCell('A1').value = sheetName.toUpperCase();
  sheet.getCell('A1').style = { font: { bold: true, size: 13, color: { argb: 'FF1E3A5F' } }, alignment: { horizontal: 'center' } };

  const headers = ['Type', 'Date', 'Lieu', 'Heure début', 'Heure fin', 'Durée (h)', 'Thème', 'Formateur', 'Participants', 'Observations'];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell(cell => { cell.style = HEADER_STYLE; });

  const colWidths = [12, 12, 20, 12, 12, 10, 30, 25, 30, 30];
  colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  const trainings = await query(`
    SELECT t.*,
      ARRAY_AGG(e.first_name || ' ' || e.last_name) FILTER (WHERE e.id IS NOT NULL) as participants
    FROM trainings t
    LEFT JOIN training_participants tp ON tp.training_id = t.id
    LEFT JOIN employees e ON e.id = tp.employee_id
    WHERE EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2
    GROUP BY t.id
    ORDER BY t.date
  `, [year, month]);

  let totalHours = 0;

  trainings.rows.forEach(t => {
    const row = sheet.addRow([
      t.type,
      t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
      t.location || '',
      t.start_time || '',
      t.end_time || '',
      t.duration_hours || 0,
      t.title,
      t.trainer || '',
      Array.isArray(t.participants) ? t.participants.filter(Boolean).join(', ') : '',
      t.observations || '',
    ]);
    row.eachCell((cell, ci) => {
      cell.style = DATA_STYLE;
      if ([1,2,3,4,5,6].includes(ci)) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      else cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    });
    totalHours += parseFloat(t.duration_hours) || 0;
  });

  if (trainings.rows.length === 0) {
    sheet.addRow(['Aucune formation enregistrée pour cette période', ...new Array(9).fill('')]);
  }

  // Total
  const totalRow = sheet.addRow(['', '', '', '', 'TOTAL HEURES', totalHours, '', '', '', '']);
  totalRow.getCell(5).style = { font: { bold: true }, alignment: { horizontal: 'right' } };
  totalRow.getCell(6).style = { font: { bold: true, color: { argb: 'FF1E3A5F' } }, alignment: { horizontal: 'center' } };
}
