import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

const SALARY_ROLES: UserRole[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];
const canViewSalary = (role?: UserRole) => role && SALARY_ROLES.includes(role);

// ============================================================
// IMPORT EXCEL — multer en mémoire
// ============================================================

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .xlsx sont acceptés'));
    }
  },
}).single('file');

// Colonnes attendues dans l'Excel (ordre ou nom de colonne)
const EXCEL_COLUMNS: Record<string, string> = {
  'Matricule': 'matricule',
  'Nom': 'last_name',
  'Prénoms': 'first_name',
  'Sexe': 'gender',
  'Date de naissance': 'birth_date',
  'Email': 'email',
  'Téléphone': 'phone',
  'Fonction': 'function',
  'Ligne de service': 'service_line',
  'Grade': 'grade',
  'Type de contrat': 'contract_type',
  "Date d'entrée": 'entry_date',
  'Date de sortie': 'exit_date',
  'Salaire': 'salary',
  'Département': 'department',
  'Expatrié': 'is_expatriate',
  'Situation matrimoniale': 'marital_status',
  'Nom conjoint': 'spouse_name',
  'Tél conjoint': 'spouse_phone',
  'Nb enfants': 'children_count',
};

const VALID_GENDERS = ['M', 'F'];
const VALID_FUNCTIONS = ['AUDITEUR','JURISTE_FISCALISTE','INFORMATICIEN','MANAGER_PRINCIPAL','ASSOCIE','DIRECTEUR','ASSISTANT_DIRECTION','SECRETAIRE','CHAUFFEUR'];
const VALID_SERVICE_LINES = ['AUDIT_ASSURANCE','CONSULTING_FA','OUTSOURCING','ADMINISTRATION','JURIDIQUE_FISCALITE'];
const VALID_GRADES = ['ASSISTANT_DEBUTANT','ASSISTANT_CONFIRME','JUNIOR','SENIOR_1','SENIOR_2','SENIOR_3','CONSULTANT','ASSISTANT_MANAGER_1','ASSISTANT_MANAGER_2','ASSISTANT_MANAGER_3','SENIOR_MANAGER_1','SENIOR_MANAGER_2','SENIOR_MANAGER_3','DIRECTEUR','ASSOCIE'];
const VALID_CONTRACTS = ['CDI','CDD','STAGE','CONSULTANT','FREELANCE'];

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const s = String(val).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function validateRow(row: Record<string, unknown>, rowIndex: number): { errors: string[] } {
  const errors: string[] = [];
  const req = (field: string, label: string) => {
    if (!row[field]) errors.push(`${label} manquant (ligne ${rowIndex})`);
  };
  req('matricule', 'Matricule');
  req('last_name', 'Nom');
  req('first_name', 'Prénoms');
  req('birth_date', 'Date de naissance');
  req('entry_date', "Date d'entrée");
  req('function', 'Fonction');
  req('service_line', 'Ligne de service');
  req('grade', 'Grade');
  req('contract_type', 'Type de contrat');

  if (row.gender && !VALID_GENDERS.includes(String(row.gender).toUpperCase())) errors.push(`Sexe invalide (ligne ${rowIndex}): ${row.gender}`);
  if (row.function && !VALID_FUNCTIONS.includes(String(row.function).toUpperCase())) errors.push(`Fonction invalide (ligne ${rowIndex}): ${row.function}`);
  if (row.service_line && !VALID_SERVICE_LINES.includes(String(row.service_line).toUpperCase())) errors.push(`Ligne de service invalide (ligne ${rowIndex}): ${row.service_line}`);
  if (row.grade && !VALID_GRADES.includes(String(row.grade).toUpperCase())) errors.push(`Grade invalide (ligne ${rowIndex}): ${row.grade}`);
  if (row.contract_type && !VALID_CONTRACTS.includes(String(row.contract_type).toUpperCase())) errors.push(`Type contrat invalide (ligne ${rowIndex}): ${row.contract_type}`);

  return { errors };
}

export const parseImport = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(req.file.buffer));
    const sheet = workbook.worksheets[0];

    if (!sheet) return res.status(400).json({ error: 'Fichier Excel vide ou invalide' });

    // Lire l'en-tête
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => headers.push(String(cell.value || '').trim()));

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
            data[field] = parseDate(val);
          } else if (field === 'gender') {
            data[field] = val ? String(val).toUpperCase().trim() : 'M';
          } else if (['function', 'service_line', 'grade', 'contract_type', 'marital_status'].includes(field)) {
            data[field] = val ? String(val).toUpperCase().trim() : null;
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

      // Vérifier doublons en DB
      let isDuplicate = false;
      if (data.matricule) {
        const r = await query('SELECT id FROM employees WHERE matricule = $1', [data.matricule]);
        if (r.rows[0]) {
          errors.push(`Matricule ${data.matricule} déjà existant`);
          isDuplicate = true;
        }
      }
      if (data.email) {
        const r = await query('SELECT id FROM employees WHERE email = $1', [data.email]);
        if (r.rows[0]) {
          errors.push(`Email ${data.email} déjà utilisé`);
          isDuplicate = true;
        }
      }

      rows.push({ rowIndex: i, data, errors, isDuplicate });
    }

    const validCount = rows.filter(r => r.errors.length === 0).length;
    const errorCount = rows.filter(r => r.errors.length > 0).length;

    return res.json({ rows, validCount, errorCount, totalRows: rows.length });
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

// ============================================================
// EXPORT EXCEL — liste
// ============================================================

export const exportEmployeesExcel = async (req: Request, res: Response) => {
  try {
    const { data } = await fetchEmployeesForExport(req);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SGRH Cabinet';
    const sheet = workbook.addWorksheet('Collaborateurs');

    const showSalary = canViewSalary(req.user?.role);

    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'Matricule', key: 'matricule', width: 16 },
      { header: 'Nom', key: 'last_name', width: 20 },
      { header: 'Prénoms', key: 'first_name', width: 20 },
      { header: 'Sexe', key: 'gender', width: 10 },
      { header: 'Fonction', key: 'function', width: 22 },
      { header: 'Ligne de service', key: 'service_line', width: 22 },
      { header: 'Grade', key: 'grade', width: 22 },
      { header: 'Contrat', key: 'contract_type', width: 14 },
      { header: "Date d'entrée", key: 'entry_date', width: 14 },
      { header: 'Date de sortie', key: 'exit_date', width: 14 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Département', key: 'department', width: 18 },
      { header: 'Ancienneté', key: 'seniority', width: 18 },
    ];
    if (showSalary) columns.push({ header: 'Salaire (FCFA)', key: 'salary', width: 18 });
    if (canViewSalary(req.user?.role) || ['DRH','DIRECTION_GENERALE','MANAGER'].includes(req.user?.role || '')) {
      columns.push({ header: 'Date de naissance', key: 'birth_date', width: 16 });
    }

    sheet.columns = columns as ExcelJS.Column[];

    // Style en-tête
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C2B4A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    sheet.getRow(1).height = 28;

    for (const emp of data) {
      const row: Record<string, unknown> = {
        matricule: emp.matricule,
        last_name: emp.last_name,
        first_name: emp.first_name,
        gender: emp.gender === 'M' ? 'Masculin' : 'Féminin',
        function: emp.function,
        service_line: emp.service_line,
        grade: emp.grade,
        contract_type: emp.contract_type,
        entry_date: emp.entry_date ? new Date(emp.entry_date).toLocaleDateString('fr-FR') : '',
        exit_date: emp.exit_date ? new Date(emp.exit_date).toLocaleDateString('fr-FR') : '',
        status: (emp.exit_date && new Date(emp.exit_date) <= new Date()) ? 'INACTIF' : 'ACTIF',
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.department || '',
        seniority: emp.seniority?.label || '',
      };
      if (showSalary) row.salary = emp.salary || 0;
      if (emp.birth_date) row.birth_date = new Date(emp.birth_date).toLocaleDateString('fr-FR');
      const addedRow = sheet.addRow(row);
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    }

    // Alternance de couleurs
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="collaborateurs_${new Date().toISOString().split('T')[0]}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('exportEmployeesExcel error', err);
    return res.status(500).json({ error: 'Erreur lors de la génération Excel' });
  }
};

// ============================================================
// EXPORT PDF — liste
// ============================================================

export const exportEmployeesPDF = async (req: Request, res: Response) => {
  try {
    const { data } = await fetchEmployeesForExport(req);
    const showSalary = canViewSalary(req.user?.role);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="collaborateurs_${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // En-tête
    doc.rect(0, 0, doc.page.width, 60).fill('#1C2B4A');
    doc.fontSize(18).fillColor('#FFFFFF').text('Liste des Collaborateurs', 40, 18, { align: 'center' });
    doc.fontSize(9).fillColor('#93C5FD').text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — ${data.length} collaborateur(s)`, 40, 40, { align: 'center' });

    let y = 75;
    const colW = showSalary ? [80, 90, 90, 55, 80, 80, 80, 75, 80, 80] : [80, 95, 95, 60, 90, 90, 90, 80, 90, 90];
    const headers = ['Matricule', 'Nom', 'Prénoms', 'Sexe', 'Ligne service', 'Grade', 'Contrat', 'Entrée', 'Statut', ...(showSalary ? ['Salaire'] : [])];

    // En-tête tableau
    doc.rect(40, y, doc.page.width - 80, 20).fill('#E5E7EB');
    doc.fillColor('#374151').fontSize(8);
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x + 3, y + 5, { width: colW[i] - 3, lineBreak: false });
      x += colW[i];
    });
    y += 22;

    doc.fillColor('#111827').fontSize(8);
    for (const emp of data) {
      if (y > doc.page.height - 60) {
        doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
        y = 40;
      }
      const status = (emp.exit_date && new Date(emp.exit_date) <= new Date()) ? 'INACTIF' : 'ACTIF';
      const cols = [
        emp.matricule,
        emp.last_name,
        emp.first_name,
        emp.gender === 'M' ? 'H' : 'F',
        emp.service_line,
        emp.grade,
        emp.contract_type,
        emp.entry_date ? new Date(emp.entry_date).toLocaleDateString('fr-FR') : '',
        status,
        ...(showSalary ? [emp.salary ? new Intl.NumberFormat('fr-FR').format(emp.salary) : '—'] : []),
      ];

      x = 40;
      cols.forEach((val, i) => {
        doc.text(String(val || ''), x + 3, y + 2, { width: colW[i] - 6, lineBreak: false });
        x += colW[i];
      });
      y += 18;
      doc.rect(40, y - 1, doc.page.width - 80, 0.5).fillColor('#E5E7EB').fill();
      doc.fillColor('#111827');
    }

    doc.end();
  } catch (err) {
    logger.error('exportEmployeesPDF error', err);
    return res.status(500).json({ error: 'Erreur lors de la génération PDF' });
  }
};

// ============================================================
// EXPORT PDF — fiche individuelle
// ============================================================

export const exportEmployeePDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  const showSalary = canViewSalary(req.user?.role);

  try {
    const result = await query(
      `SELECT e.*,
         CASE WHEN e.exit_date IS NULL OR e.exit_date > CURRENT_DATE THEN 'ACTIF' ELSE 'INACTIF' END as status,
         DATE_PART('year', AGE(e.birth_date)) as age,
         m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });
    const emp = result.rows[0];

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fiche_${emp.matricule}.pdf"`);
    doc.pipe(res);

    // En-tête
    doc.rect(0, 0, doc.page.width, 80).fill('#1C2B4A');
    doc.fontSize(20).fillColor('#FFFFFF').text('Fiche Collaborateur', 50, 20);
    doc.fontSize(10).fillColor('#93C5FD').text('SGRH Cabinet — Confidentiel', 50, 48);

    // Avatar initiales
    const avatarX = doc.page.width - 120;
    doc.circle(avatarX, 40, 28).fill('#C8102E');
    doc.fillColor('#FFFFFF').fontSize(16).text(
      `${emp.first_name[0]}${emp.last_name[0]}`,
      avatarX - 14, 29
    );

    let y = 100;
    const lineH = 22;
    const labelX = 50;
    const valueX = 200;

    const section = (title: string) => {
      y += 10;
      doc.rect(50, y, doc.page.width - 100, 22).fill('#F3F4F6');
      doc.fillColor('#1C2B4A').fontSize(11).font('Helvetica-Bold').text(title, 58, y + 5);
      doc.font('Helvetica');
      y += 28;
    };

    const field = (label: string, value: string | null | undefined) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
      doc.fillColor('#6B7280').fontSize(9).text(label, labelX, y);
      doc.fillColor('#111827').fontSize(10).text(value || '—', valueX, y);
      y += lineH;
    };

    section('Identité');
    field('Nom complet', `${emp.last_name} ${emp.first_name}`);
    field('Matricule', emp.matricule);
    field('Sexe', emp.gender === 'M' ? 'Masculin' : 'Féminin');
    field('Date de naissance', emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('fr-FR') : null);
    field('Âge', emp.age ? `${emp.age} ans` : null);
    field('Email', emp.email);
    field('Téléphone', emp.phone);
    field('Situation matrimoniale', emp.marital_status || 'CELIBATAIRE');
    if (emp.marital_status === 'MARIE') {
      field('Conjoint(e)', emp.spouse_name);
      field('Tél. conjoint(e)', emp.spouse_phone);
    }
    field('Nombre d\'enfants', emp.children_count != null ? String(emp.children_count) : '0');

    section('Poste & Contrat');
    field('Fonction', emp.function);
    field('Ligne de service', emp.service_line);
    field('Grade', emp.grade);
    field('Type de contrat', emp.contract_type);
    field('Département', emp.department);
    field("Date d'entrée", emp.entry_date ? new Date(emp.entry_date).toLocaleDateString('fr-FR') : null);
    if (emp.exit_date) field('Date de sortie', new Date(emp.exit_date).toLocaleDateString('fr-FR'));
    field('Statut', emp.status);
    if (emp.manager_name) field('Supérieur hiérarchique', emp.manager_name);
    field('Expatrié', emp.is_expatriate ? 'Oui' : 'Non');
    if (showSalary && emp.salary) {
      field('Salaire', new Intl.NumberFormat('fr-FR').format(emp.salary) + ' FCFA');
    }

    section('Diplômes professionnels');
    const diplomas = [
      emp.has_dec_french && 'DEC Français',
      emp.has_decofi && 'DECOFI',
      emp.has_other_dec && 'Autre DEC',
      emp.has_cisa && 'CISA',
      emp.has_cfa && 'CFA',
    ].filter(Boolean).join(', ');
    field('Certifications', diplomas || 'Aucune');

    if (emp.notes) {
      section('Notes');
      doc.fillColor('#374151').fontSize(10).text(emp.notes, 50, y, { width: doc.page.width - 100 });
    }

    // Pied de page
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY - 10, doc.page.width, 50).fill('#F9FAFB');
    doc.fillColor('#9CA3AF').fontSize(8).text(
      `Généré le ${new Date().toLocaleString('fr-FR')} — Document confidentiel`,
      50, footerY, { align: 'center', width: doc.page.width - 100 }
    );

    doc.end();
  } catch (err) {
    logger.error('exportEmployeePDF error', err);
    return res.status(500).json({ error: 'Erreur lors de la génération PDF' });
  }
};

// ============================================================
// Utilitaire: récupérer les employés pour export
// ============================================================

async function fetchEmployeesForExport(req: Request) {
  const { search, service_line, grade, contract_type, status, gender } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (search) { conditions.push(`(e.first_name ILIKE $${pi} OR e.last_name ILIKE $${pi} OR e.matricule ILIKE $${pi})`); params.push(`%${search}%`); pi++; }
  if (service_line) { conditions.push(`e.service_line = $${pi++}`); params.push(service_line); }
  if (grade) { conditions.push(`e.grade = $${pi++}`); params.push(grade); }
  if (contract_type) { conditions.push(`e.contract_type = $${pi++}`); params.push(contract_type); }
  if (status === 'ACTIF') { conditions.push('(e.exit_date IS NULL OR e.exit_date > CURRENT_DATE)'); }
  else if (status === 'INACTIF') { conditions.push('(e.exit_date IS NOT NULL AND e.exit_date <= CURRENT_DATE)'); }
  if (gender) { conditions.push(`e.gender = $${pi++}`); params.push(gender); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const dataRes = await query(
    `SELECT e.*,
       DATE_PART('year', AGE(e.birth_date)) as age,
       EXTRACT(YEAR FROM e.entry_date) as season
     FROM employees e
     ${where}
     ORDER BY e.last_name ASC
     LIMIT 2000`,
    params
  );

  const rows = dataRes.rows.map(emp => {
    const diff = Date.now() - new Date(emp.entry_date).getTime();
    const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
    return { ...emp, seniority: { years, months, label: `${years} an(s) ${months} mois` } };
  });

  return { data: rows };
}
