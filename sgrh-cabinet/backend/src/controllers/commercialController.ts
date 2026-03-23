import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Rôles autorisés à voir les montants des contrats gagnés
const CAN_VIEW_AMOUNTS: string[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];
// Rôles autorisés à créer/modifier
const CAN_WRITE: string[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER'];

const SERVICE_LINE_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE: 'Audit & Assurance',
  CONSULTING_FA: 'Consulting & FA',
  OUTSOURCING: 'Outsourcing',
  ADMINISTRATION: 'Administration',
  JURIDIQUE_FISCALITE: 'Juridique & Fiscalité',
};

function buildFilters(query_params: Record<string, string>) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (query_params.type) {
    conditions.push(`cs.type = $${idx++}`);
    values.push(query_params.type);
  }
  if (query_params.status) {
    conditions.push(`cs.status = $${idx++}`);
    values.push(query_params.status);
  }
  if (query_params.service_line) {
    conditions.push(`cs.service_line = $${idx++}`);
    values.push(query_params.service_line);
  }
  // Filtres période
  if (query_params.year) {
    conditions.push(`EXTRACT(YEAR FROM cs.submission_date) = $${idx++}`);
    values.push(parseInt(query_params.year));
  }
  if (query_params.month) {
    conditions.push(`EXTRACT(MONTH FROM cs.submission_date) = $${idx++}`);
    values.push(parseInt(query_params.month));
  }
  if (query_params.quarter) {
    conditions.push(`EXTRACT(QUARTER FROM cs.submission_date) = $${idx++}`);
    values.push(parseInt(query_params.quarter));
  }

  return { conditions, values };
}

export const listSubmissions = async (req: Request, res: Response) => {
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(req.user!.role);
  const params = req.query as Record<string, string>;
  const { conditions, values } = buildFilters(params);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT
        cs.id,
        cs.type,
        cs.reference,
        cs.title,
        cs.client,
        cs.submission_date,
        cs.service_line,
        cs.responsible_employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS responsible_name,
        cs.status,
        ${canViewAmounts ? 'cs.contract_amount,' : 'NULL::DECIMAL AS contract_amount,'}
        ${canViewAmounts ? 'cs.contract_start_date,' : 'NULL::DATE AS contract_start_date,'}
        ${canViewAmounts ? 'cs.contract_end_date,' : 'NULL::DATE AS contract_end_date,'}
        cs.created_at,
        cs.updated_at
       FROM commercial_submissions cs
       LEFT JOIN employees e ON e.id = cs.responsible_employee_id
       ${whereClause}
       ORDER BY cs.submission_date DESC`,
      values
    );

    return res.json(result.rows);
  } catch (err) {
    logger.error('listSubmissions error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(req.user!.role);
  const params = req.query as Record<string, string>;
  const { conditions, values } = buildFilters(params);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT
        cs.type,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE cs.status = 'GAGNE') AS wins,
        COUNT(*) FILTER (WHERE cs.status = 'PERDU') AS losses,
        COUNT(*) FILTER (WHERE cs.status = 'EN_COURS') AS en_cours,
        ${canViewAmounts
          ? `COALESCE(SUM(cs.contract_amount) FILTER (WHERE cs.status = 'GAGNE'), 0) AS total_amount`
          : `0 AS total_amount`}
       FROM commercial_submissions cs
       ${whereClause}
       GROUP BY cs.type`,
      values
    );

    const stats: Record<string, {
      total: number; wins: number; losses: number; en_cours: number;
      success_rate: number; total_amount: number;
    }> = {};

    for (const row of result.rows) {
      const total = parseInt(row.total);
      const wins = parseInt(row.wins);
      stats[row.type] = {
        total,
        wins,
        losses: parseInt(row.losses),
        en_cours: parseInt(row.en_cours),
        success_rate: total > 0 ? Math.round((wins / total) * 100) : 0,
        total_amount: parseFloat(row.total_amount),
      };
    }

    return res.json(stats);
  } catch (err) {
    logger.error('getStats error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getDashboardWidget = async (req: Request, res: Response) => {
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(req.user!.role);
  try {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE type = 'AMI'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS ami_this_month,
        COUNT(*) FILTER (WHERE type = 'APPEL_OFFRE'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS ao_this_month,
        COUNT(*) FILTER (WHERE status = 'GAGNE'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS wins_this_month,
        ${canViewAmounts
          ? `COALESCE(SUM(contract_amount) FILTER (WHERE status = 'GAGNE'
              AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) AS amount_this_month`
          : `0 AS amount_this_month`}
       FROM commercial_submissions`
    );

    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('getDashboardWidget error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSubmission = async (req: Request, res: Response) => {
  if (!CAN_WRITE.includes(req.user!.role)) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  const {
    type, reference, title, client, submission_date,
    service_line, responsible_employee_id, status,
    contract_amount, contract_start_date, contract_end_date,
  } = req.body;

  // Validation champs obligatoires si GAGNE
  if (status === 'GAGNE') {
    if (!contract_amount || !contract_start_date || !contract_end_date) {
      return res.status(400).json({
        error: 'Les champs Montant, Date de début et Date de fin sont obligatoires pour un statut Gagné',
      });
    }
  }

  try {
    const result = await query(
      `INSERT INTO commercial_submissions
        (type, reference, title, client, submission_date, service_line,
         responsible_employee_id, status, contract_amount, contract_start_date,
         contract_end_date, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
       RETURNING *`,
      [
        type, reference, title, client, submission_date, service_line,
        responsible_employee_id || null,
        status || 'EN_COURS',
        status === 'GAGNE' ? contract_amount : null,
        status === 'GAGNE' ? contract_start_date : null,
        status === 'GAGNE' ? contract_end_date : null,
        req.user!.userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('createSubmission error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSubmission = async (req: Request, res: Response) => {
  if (!CAN_WRITE.includes(req.user!.role)) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  const { id } = req.params;
  const {
    type, reference, title, client, submission_date,
    service_line, responsible_employee_id, status,
    contract_amount, contract_start_date, contract_end_date,
  } = req.body;

  if (status === 'GAGNE') {
    if (!contract_amount || !contract_start_date || !contract_end_date) {
      return res.status(400).json({
        error: 'Les champs Montant, Date de début et Date de fin sont obligatoires pour un statut Gagné',
      });
    }
  }

  try {
    const result = await query(
      `UPDATE commercial_submissions SET
        type=$1, reference=$2, title=$3, client=$4, submission_date=$5,
        service_line=$6, responsible_employee_id=$7, status=$8,
        contract_amount=$9, contract_start_date=$10, contract_end_date=$11,
        updated_by=$12
       WHERE id=$13
       RETURNING *`,
      [
        type, reference, title, client, submission_date, service_line,
        responsible_employee_id || null,
        status,
        status === 'GAGNE' ? contract_amount : null,
        status === 'GAGNE' ? contract_start_date : null,
        status === 'GAGNE' ? contract_end_date : null,
        req.user!.userId,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Soumission introuvable' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('updateSubmission error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteSubmission = async (req: Request, res: Response) => {
  if (!CAN_WRITE.includes(req.user!.role)) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  const { id } = req.params;
  try {
    const result = await query(
      `DELETE FROM commercial_submissions WHERE id=$1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Soumission introuvable' });
    }
    return res.json({ message: 'Soumission supprimée' });
  } catch (err) {
    logger.error('deleteSubmission error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(req.user!.role);
  const params = req.query as Record<string, string>;
  const { conditions, values } = buildFilters(params);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT
        cs.type, cs.reference, cs.title, cs.client, cs.submission_date,
        cs.service_line, CONCAT(e.first_name, ' ', e.last_name) AS responsible_name,
        cs.status,
        ${canViewAmounts ? 'cs.contract_amount, cs.contract_start_date, cs.contract_end_date' : `NULL AS contract_amount, NULL AS contract_start_date, NULL AS contract_end_date`}
       FROM commercial_submissions cs
       LEFT JOIN employees e ON e.id = cs.responsible_employee_id
       ${whereClause}
       ORDER BY cs.submission_date DESC`,
      values
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporting Commercial');

    const headers = [
      'Type', 'Référence', 'Objet / Intitulé', 'Client / Organisme',
      'Date de soumission', 'Ligne de service', 'Responsable', 'Statut',
      ...(canViewAmounts ? ['Montant contrat (FCFA)', 'Début contrat', 'Fin contrat'] : []),
    ];

    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const TYPE_LABELS: Record<string, string> = {
      AMI: 'AMI',
      APPEL_OFFRE: 'Appel d\'offre',
    };
    const STATUS_LABELS: Record<string, string> = {
      EN_COURS: 'En cours',
      GAGNE: 'Gagné',
      PERDU: 'Perdu',
    };

    for (const row of result.rows) {
      const rowData = [
        TYPE_LABELS[row.type] || row.type,
        row.reference,
        row.title,
        row.client,
        row.submission_date ? new Date(row.submission_date).toLocaleDateString('fr-FR') : '',
        SERVICE_LINE_LABELS[row.service_line] || row.service_line,
        row.responsible_name || '',
        STATUS_LABELS[row.status] || row.status,
        ...(canViewAmounts ? [
          row.contract_amount ? parseFloat(row.contract_amount) : '',
          row.contract_start_date ? new Date(row.contract_start_date).toLocaleDateString('fr-FR') : '',
          row.contract_end_date ? new Date(row.contract_end_date).toLocaleDateString('fr-FR') : '',
        ] : []),
      ];
      sheet.addRow(rowData);
    }

    // Auto-width
    sheet.columns.forEach((col) => {
      let max = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 2, 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reporting_commercial.xlsx"');
    return res.send(buffer);
  } catch (err) {
    logger.error('exportExcel commercial error', err);
    return res.status(500).json({ error: 'Erreur export Excel' });
  }
};

export const exportPDF = async (req: Request, res: Response) => {
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(req.user!.role);
  const params = req.query as Record<string, string>;
  const { conditions, values } = buildFilters(params);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT
        cs.type, cs.reference, cs.title, cs.client, cs.submission_date,
        cs.service_line, CONCAT(e.first_name, ' ', e.last_name) AS responsible_name,
        cs.status,
        ${canViewAmounts ? 'cs.contract_amount, cs.contract_start_date, cs.contract_end_date' : `NULL AS contract_amount, NULL AS contract_start_date, NULL AS contract_end_date`}
       FROM commercial_submissions cs
       LEFT JOIN employees e ON e.id = cs.responsible_employee_id
       ${whereClause}
       ORDER BY cs.submission_date DESC`,
      values
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporting_commercial.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('Reporting Commercial', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(1);

    const TYPE_LABELS: Record<string, string> = { AMI: 'AMI', APPEL_OFFRE: "Appel d'offre" };
    const STATUS_LABELS: Record<string, string> = { EN_COURS: 'En cours', GAGNE: 'Gagné', PERDU: 'Perdu' };

    // Simple table
    const headers = ['Type', 'Référence', 'Objet', 'Client', 'Date', 'Ligne', 'Responsable', 'Statut'];
    if (canViewAmounts) headers.push('Montant (FCFA)');

    const colWidths = canViewAmounts
      ? [55, 70, 110, 90, 60, 80, 90, 55, 90]
      : [60, 80, 130, 110, 65, 90, 100, 65];

    let x = doc.page.margins.left;
    const y = doc.y;

    // Header row
    doc.font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill('#1E3A5F');
      doc.fillColor('white').text(h, x + 2, y + 5, { width: colWidths[i] - 4, lineBreak: false });
      x += colWidths[i];
    });

    doc.fillColor('black').font('Helvetica').fontSize(7);
    let rowY = y + 18;

    for (const row of result.rows) {
      if (rowY > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape' });
        rowY = doc.page.margins.top;
      }

      const cells = [
        TYPE_LABELS[row.type] || row.type,
        row.reference || '',
        (row.title || '').substring(0, 40),
        (row.client || '').substring(0, 30),
        row.submission_date ? new Date(row.submission_date).toLocaleDateString('fr-FR') : '',
        SERVICE_LINE_LABELS[row.service_line] || row.service_line,
        (row.responsible_name || '').substring(0, 25),
        STATUS_LABELS[row.status] || row.status,
      ];
      if (canViewAmounts) {
        cells.push(row.contract_amount ? Number(row.contract_amount).toLocaleString('fr-FR') : '');
      }

      x = doc.page.margins.left;
      cells.forEach((cell, i) => {
        doc.rect(x, rowY, colWidths[i], 16).stroke('#dddddd');
        doc.fillColor('#333333').text(String(cell), x + 2, rowY + 4, { width: colWidths[i] - 4, lineBreak: false });
        x += colWidths[i];
      });

      rowY += 16;
    }

    doc.end();
  } catch (err) {
    logger.error('exportPDF commercial error', err);
    return res.status(500).json({ error: 'Erreur export PDF' });
  }
};
