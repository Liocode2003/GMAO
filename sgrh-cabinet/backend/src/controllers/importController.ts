import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import multer from 'multer';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ============================================================
// IMPORT EXCEL — multer en mémoire
// ============================================================

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .xlsx sont acceptés'));
    }
  },
}).single('file');

// Colonnes attendues dans l'Excel — ordre exact défini par le cahier des charges
const EXCEL_COLUMNS: Record<string, string> = {
  'Matricule':              'matricule',
  'Nom':                    'last_name',
  'Prénoms':                'first_name',
  'Sexe':                   'gender',
  'Date de naissance':      'birth_date',
  'Situation matrimoniale': 'marital_status',
  'Nom conjoint':           'spouse_name',
  'Tél conjoint':           'spouse_phone',
  'Nb enfants':             'children_count',
  'Email':                  'email',
  'Téléphone':              'phone',
  'Fonction':               'function',
  'Grade':                  'grade',
  'Ligne de service':       'service_line',
  'Type de contrat':        'contract_type',
  "Date d'entrée":          'entry_date',
  'Date de sortie':         'exit_date',
  'Expatrié':               'is_expatriate',
  'Salaire':                'salary',
};

const REQUIRED_COLUMNS = [
  'Matricule', 'Nom', 'Prénoms', "Date d'entrée",
  'Fonction', 'Grade', 'Ligne de service', 'Type de contrat',
];

const VALID_GENDERS    = ['M', 'F'];
const VALID_FUNCTIONS  = ['AUDITEUR','JURISTE_FISCALISTE','INFORMATICIEN','MANAGER_PRINCIPAL','ASSOCIE','DIRECTEUR','ASSISTANT_DIRECTION','SECRETAIRE','CHAUFFEUR'];
const VALID_SERVICE_LINES = ['AUDIT_ASSURANCE','CONSULTING_FA','OUTSOURCING','ADMINISTRATION','JURIDIQUE_FISCALITE'];
const VALID_GRADES     = ['ASSISTANT_DEBUTANT','ASSISTANT_CONFIRME','JUNIOR','SENIOR_1','SENIOR_2','SENIOR_3','CONSULTANT','ASSISTANT_MANAGER_1','ASSISTANT_MANAGER_2','ASSISTANT_MANAGER_3','SENIOR_MANAGER_1','SENIOR_MANAGER_2','SENIOR_MANAGER_3','DIRECTEUR','ASSOCIE'];
const VALID_CONTRACTS  = ['CDI','CDD','STAGE','CONSULTANT','FREELANCE'];
const VALID_MARITAL    = ['CELIBATAIRE','MARIE','DIVORCE','VEUF'];

const MARITAL_STATUS_MAP: Record<string, string> = {
  'celibataire': 'CELIBATAIRE', 'célibataire': 'CELIBATAIRE',
  'marie': 'MARIE', 'marié': 'MARIE', 'mariée': 'MARIE', 'marié(e)': 'MARIE', 'mariee': 'MARIE',
  'divorce': 'DIVORCE', 'divorcé': 'DIVORCE', 'divorcée': 'DIVORCE', 'divorcé(e)': 'DIVORCE', 'divorcee': 'DIVORCE',
  'veuf': 'VEUF', 'veuve': 'VEUF', 'veuf/veuve': 'VEUF',
};

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function normalizeMaritalStatus(val: unknown): string | null {
  if (!val) return null;
  const key = String(val).trim().toLowerCase();
  return MARITAL_STATUS_MAP[key] || String(val).toUpperCase().trim();
}

function validateRow(row: Record<string, unknown>, rowIndex: number): { errors: string[] } {
  const errors: string[] = [];
  const req = (field: string, label: string) => {
    if (!row[field]) errors.push(`${label} manquant (ligne ${rowIndex})`);
  };
  req('matricule', 'Matricule');
  req('last_name', 'Nom');
  req('first_name', 'Prénoms');
  req('entry_date', "Date d'entrée");
  req('function', 'Fonction');
  req('service_line', 'Ligne de service');
  req('grade', 'Grade');
  req('contract_type', 'Type de contrat');

  if (row.gender && !VALID_GENDERS.includes(String(row.gender).toUpperCase()))
    errors.push(`Sexe invalide ligne ${rowIndex} (valeurs : M, F) : "${row.gender}"`);
  if (row.marital_status && !VALID_MARITAL.includes(String(row.marital_status)))
    errors.push(`Situation matrimoniale invalide ligne ${rowIndex} : "${row.marital_status}"`);
  if (row.function && !VALID_FUNCTIONS.includes(String(row.function)))
    errors.push(`Fonction invalide ligne ${rowIndex} : "${row.function}"`);
  if (row.service_line && !VALID_SERVICE_LINES.includes(String(row.service_line)))
    errors.push(`Ligne de service invalide ligne ${rowIndex} : "${row.service_line}"`);
  if (row.grade && !VALID_GRADES.includes(String(row.grade)))
    errors.push(`Grade invalide ligne ${rowIndex} : "${row.grade}"`);
  if (row.contract_type && !VALID_CONTRACTS.includes(String(row.contract_type)))
    errors.push(`Type de contrat invalide ligne ${rowIndex} (valeurs : CDI, CDD, Stage, Consultant, Freelance) : "${row.contract_type}"`);
  if (row.entry_date !== undefined && row.entry_date === null)
    errors.push(`Date d'entrée invalide ligne ${rowIndex} (format attendu : JJ/MM/AAAA)`);
  if (row.birth_date !== undefined && row.birth_date === null && row['_raw_birth_date'])
    errors.push(`Date de naissance invalide ligne ${rowIndex} (format attendu : JJ/MM/AAAA) : "${row['_raw_birth_date']}"`);

  return { errors };
}

export const parseImport = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

  try {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(req.file.buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ error: 'Fichier Excel vide ou invalide' });

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => headers.push(String(cell.value || '').trim()));

    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    const unknownColumns = headers.filter(h => h && !EXCEL_COLUMNS[h]);

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: 'Colonnes obligatoires manquantes dans le fichier',
        missingColumns,
        unknownColumns,
        expectedColumns: Object.keys(EXCEL_COLUMNS),
      });
    }

    const rows: Array<{ rowIndex: number; data: Record<string, unknown>; errors: string[]; isDuplicate: boolean }> = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      if (row.actualCellCount === 0) continue;

      const data: Record<string, unknown> = {};
      headers.forEach((header, colIdx) => {
        const field = EXCEL_COLUMNS[header];
        if (field) {
          const cell = row.getCell(colIdx + 1);
          let val = cell.value;
          if (val instanceof Object && 'result' in val) val = (val as { result: ExcelJS.CellValue }).result;
          if (['birth_date', 'entry_date', 'exit_date'].includes(field)) {
            if (val) data['_raw_' + field] = String(val);
            data[field] = parseDate(val);
          } else if (field === 'gender') {
            data[field] = val ? String(val).toUpperCase().trim() : 'M';
          } else if (['function', 'service_line', 'grade', 'contract_type'].includes(field)) {
            data[field] = val ? String(val).toUpperCase().trim() : null;
          } else if (field === 'marital_status') {
            data[field] = val ? normalizeMaritalStatus(val) : null;
          } else if (field === 'is_expatriate') {
            data[field] = ['oui', 'yes', '1', 'true'].includes(String(val || '').toLowerCase());
          } else if (['salary', 'children_count'].includes(field)) {
            data[field] = val ? parseFloat(String(val)) : null;
          } else {
            data[field] = val ? String(val).trim() : null;
          }
        }
      });

      const { errors } = validateRow(data, i);

      let isDuplicate = false;
      if (data.matricule) {
        const r = await query('SELECT id FROM employees WHERE matricule = $1', [data.matricule]);
        if (r.rows[0]) { errors.push(`Matricule "${data.matricule}" déjà existant en base`); isDuplicate = true; }
      }
      if (data.email) {
        const r = await query('SELECT id FROM employees WHERE email = $1', [data.email]);
        if (r.rows[0]) { errors.push(`Email "${data.email}" déjà utilisé en base`); isDuplicate = true; }
      }

      rows.push({ rowIndex: i, data, errors, isDuplicate });
    }

    const validCount = rows.filter(r => r.errors.length === 0).length;
    const errorCount = rows.filter(r => r.errors.length > 0).length;

    return res.json({
      rows,
      validCount,
      errorCount,
      totalRows: rows.length,
      unknownColumns: unknownColumns.length > 0 ? unknownColumns : undefined,
    });
  } catch (err) {
    logger.error('parseImport error', err);
    return res.status(500).json({ error: 'Erreur lors de la lecture du fichier Excel' });
  }
};

export const executeImport = async (req: Request, res: Response) => {
  const { rows } = req.body as { rows: Array<{ data: Record<string, unknown>; errors: string[] }> };
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Données invalides' });

  const validRows = rows.filter(r => r.errors.length === 0);
  const imported: string[] = [];
  const failed: Array<{ matricule: unknown; error: string }> = [];

  for (const row of validRows) {
    const d = row.data;
    try {
      const result = await query(
        `INSERT INTO employees (
           matricule, first_name, last_name, gender, email, phone, birth_date,
           function, service_line, grade, contract_type, entry_date, exit_date,
           salary, department, is_expatriate, marital_status, spouse_name,
           spouse_phone, children_count, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING id, matricule`,
        [
          d.matricule, d.first_name, d.last_name, d.gender || 'M',
          d.email || null, d.phone || null, d.birth_date,
          d.function, d.service_line, d.grade, d.contract_type,
          d.entry_date, d.exit_date || null,
          d.salary || null, d.department || null, d.is_expatriate || false,
          d.marital_status || 'CELIBATAIRE', d.spouse_name || null,
          d.spouse_phone || null, d.children_count || 0, req.user?.userId,
        ]
      );
      if (d.salary) {
        await query(
          `INSERT INTO salary_history (employee_id, new_salary, effective_date, notes, created_by)
           VALUES ($1, $2, $3, 'Import Excel', $4)`,
          [result.rows[0].id, d.salary, d.entry_date, req.user?.userId]
        );
      }
      imported.push(String(d.matricule));
    } catch (err) {
      failed.push({ matricule: d.matricule, error: (err as Error).message });
    }
  }

  logger.info(`Import Excel: ${imported.length} créés, ${failed.length} échecs par ${req.user?.email}`);
  return res.json({ imported: imported.length, failed: failed.length, failedRows: failed });
};

export const downloadImportTemplate = async (_req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SGRH Cabinet';

    const sheet = workbook.addWorksheet('Collaborateurs');
    const columns = Object.keys(EXCEL_COLUMNS);
    sheet.addRow(columns);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;
    columns.forEach((_, idx) => { sheet.getColumn(idx + 1).width = 22; });

    sheet.addRow(['EMP001','DUPONT','Jean','M','15/03/1990','Célibataire','','','0','jean.dupont@cabinet.bf','+226 70 01 02 03','AUDITEUR','JUNIOR','AUDIT_ASSURANCE','CDI','01/01/2024','','Non','500000']);
    sheet.addRow(['EMP002','MARTIN','Sophie','F','22/07/1985','Marié(e)','MARTIN Paul','+226 70 08 09 10','2','sophie.martin@cabinet.bf','+226 75 06 07 08','MANAGER_PRINCIPAL','SENIOR_2','CONSULTING_FA','CDI','15/06/2018','','Non','1200000']);

    [2, 3].forEach(r => {
      sheet.getRow(r).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
    });

    const refSheet = workbook.addWorksheet('Valeurs acceptées');
    refSheet.getColumn(1).width = 28;
    refSheet.getColumn(2).width = 60;

    const refData = [
      ['Colonne', 'Valeurs acceptées'],
      ['Sexe', 'M  |  F'],
      ['Situation matrimoniale', 'Célibataire  |  Marié(e)  |  Divorcé(e)  |  Veuf/Veuve'],
      ['Type de contrat', 'CDI  |  CDD  |  STAGE  |  CONSULTANT  |  FREELANCE'],
      ['Expatrié', 'Oui  |  Non'],
      ['Fonction', VALID_FUNCTIONS.join('  |  ')],
      ['Ligne de service', VALID_SERVICE_LINES.join('  |  ')],
      ['Grade', VALID_GRADES.join('  |  ')],
      ['Dates', 'Format JJ/MM/AAAA (ex: 15/03/1990)'],
      ['Salaire', 'Valeur numérique sans espace (ex: 500000)'],
    ];

    refData.forEach((rowData, idx) => {
      const row = refSheet.addRow(rowData);
      if (idx === 0) {
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      } else {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
      }
    });

    const buf = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modele_import_collaborateurs.xlsx"');
    return res.send(buf);
  } catch (err) {
    logger.error('downloadImportTemplate error', err);
    return res.status(500).json({ error: 'Erreur lors de la génération du modèle' });
  }
};
