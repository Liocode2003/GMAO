import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const EVAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'evaluations');
if (!fs.existsSync(EVAL_UPLOADS_DIR)) fs.mkdirSync(EVAL_UPLOADS_DIR, { recursive: true });

const evalStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVAL_UPLOADS_DIR),
  filename:    (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

export const uploadEvalDoc = multer({
  storage: evalStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(ext)) cb(null, true);
    else cb(new Error('Format non autorisé (pdf, doc, docx, jpg, png)'));
  },
});

const ALLOWED_SORT_EVALS = ['employee_name', 'year', 'overall_score', 'created_at'];
const EVAL_SORT_MAP: Record<string, string> = {
  employee_name: "e.first_name || ' ' || e.last_name",
  year:          'ev.year',
  overall_score: 'ev.overall_score',
  created_at:    'ev.created_at',
};

export const listEvaluations = async (req: Request, res: Response) => {
  const { year, period, status, employee_id } = req.query as Record<string, string>;
  const userRole = req.user?.role;
  const userId   = req.user?.userId;

  const page     = Math.max(1, parseInt(String(req.query.page  || '1')));
  const limit    = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const sortKey  = ALLOWED_SORT_EVALS.includes(String(req.query.sort)) ? String(req.query.sort) : 'created_at';
  const sort     = EVAL_SORT_MAP[sortKey];
  const order    = req.query.order === 'asc' ? 'ASC' : 'DESC';
  const offset   = (page - 1) * limit;

  try {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (year)        { params.push(year);        conditions.push(`ev.year = $${params.length}`); }
    if (period)      { params.push(period);      conditions.push(`ev.period = $${params.length}`); }
    if (status)      { params.push(status);      conditions.push(`ev.status = $${params.length}`); }
    if (employee_id) { params.push(employee_id); conditions.push(`ev.employee_id = $${params.length}`); }

    if (userRole === 'MANAGER') {
      params.push(req.user!.email);
      conditions.push(`e.manager_id IN (SELECT id FROM employees WHERE email = $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const baseIdx     = params.length + 1;

    const [countRes, result] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM evaluations ev JOIN employees e ON e.id = ev.employee_id ${whereClause}`,
        params
      ),
      query(
        `SELECT ev.*,
           e.first_name || ' ' || e.last_name as employee_name,
           e.function as employee_function,
           e.service_line as employee_service_line,
           u.first_name || ' ' || u.last_name as evaluator_name
         FROM evaluations ev
         JOIN employees e ON e.id = ev.employee_id
         LEFT JOIN users u ON u.id = ev.evaluator_id
         ${whereClause}
         ORDER BY ${sort} ${order}
         LIMIT $${baseIdx} OFFSET $${baseIdx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    return res.json({ evaluations: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('listEvaluations error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getEvaluation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT ev.*,
         e.first_name || ' ' || e.last_name as employee_name,
         e.function as employee_function,
         e.service_line as employee_service_line,
         u.first_name || ' ' || u.last_name as evaluator_name
       FROM evaluations ev
       JOIN employees e ON e.id = ev.employee_id
       LEFT JOIN users u ON u.id = ev.evaluator_id
       WHERE ev.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Évaluation non trouvée' });
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('getEvaluation error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createEvaluation = async (req: Request, res: Response) => {
  const {
    employee_id, year, period, status,
    objectives_score, skills_score, behavior_score,
    comments, objectives, strengths, improvements,
  } = req.body;

  if (!employee_id || !year) {
    return res.status(400).json({ error: 'employee_id et year sont obligatoires' });
  }

  // Compute overall score as average of three scores
  let overall_score: number | null = null;
  const scores = [objectives_score, skills_score, behavior_score].filter(s => s !== undefined && s !== null && s !== '');
  if (scores.length === 3) {
    overall_score = Math.round((parseFloat(scores[0]) + parseFloat(scores[1]) + parseFloat(scores[2])) / 3 * 100) / 100;
  }

  try {
    const result = await query(
      `INSERT INTO evaluations
         (employee_id, evaluator_id, year, period, status, overall_score,
          objectives_score, skills_score, behavior_score, comments, objectives, strengths, improvements)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        employee_id, req.user?.userId, year,
        period || 'ANNUEL', status || 'EN_COURS', overall_score,
        objectives_score || null, skills_score || null, behavior_score || null,
        comments || null, objectives || null, strengths || null, improvements || null,
      ]
    );
    logger.info(`Évaluation créée: ${result.rows[0].id} par ${req.user?.email}`);
    return res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return res.status(409).json({ error: 'Une évaluation existe déjà pour cet employé/année/période' });
    }
    logger.error('createEvaluation error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateEvaluation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    year, period, status,
    objectives_score, skills_score, behavior_score,
    comments, objectives, strengths, improvements,
  } = req.body;

  // Compute overall score
  let overall_score: number | null = null;
  const scores = [objectives_score, skills_score, behavior_score].filter(s => s !== undefined && s !== null && s !== '');
  if (scores.length === 3) {
    overall_score = Math.round((parseFloat(scores[0]) + parseFloat(scores[1]) + parseFloat(scores[2])) / 3 * 100) / 100;
  }

  try {
    const result = await query(
      `UPDATE evaluations SET
         year = COALESCE($1, year),
         period = COALESCE($2, period),
         status = COALESCE($3, status),
         overall_score = $4,
         objectives_score = $5,
         skills_score = $6,
         behavior_score = $7,
         comments = $8,
         objectives = $9,
         strengths = $10,
         improvements = $11,
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        year || null, period || null, status || null,
        overall_score,
        objectives_score !== undefined ? objectives_score : null,
        skills_score !== undefined ? skills_score : null,
        behavior_score !== undefined ? behavior_score : null,
        comments !== undefined ? comments : null,
        objectives !== undefined ? objectives : null,
        strengths !== undefined ? strengths : null,
        improvements !== undefined ? improvements : null,
        id,
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Évaluation non trouvée' });
    logger.info(`Évaluation ${id} mise à jour par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('updateEvaluation error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteEvaluation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM evaluations WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Évaluation non trouvée' });
    logger.info(`Évaluation ${id} supprimée par ${req.user?.email}`);
    return res.json({ message: 'Évaluation supprimée' });
  } catch (err) {
    logger.error('deleteEvaluation error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Document attaché à une évaluation ────────────────────────────────────────

export const uploadEvalDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Fichier requis' });
  try {
    // Supprimer l'ancien fichier s'il existe
    const existing = await query(`SELECT document_path FROM evaluations WHERE id = $1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (existing.rows[0].document_path) {
      const old = path.join(EVAL_UPLOADS_DIR, path.basename(existing.rows[0].document_path));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await query(
      `UPDATE evaluations SET document_path = $1, document_name = $2, document_mime = $3, updated_at = NOW() WHERE id = $4`,
      [file.filename, file.originalname, file.mimetype, id]
    );
    logger.info(`Document évaluation uploadé: ${file.filename} pour ${id}`);
    return res.json({ message: 'Document uploadé', document_name: file.originalname });
  } catch (err) {
    if (file) fs.unlinkSync(file.path);
    logger.error('uploadEvalDocument error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const downloadEvalDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT document_path, document_name, document_mime FROM evaluations WHERE id = $1`, [id]);
    const ev = result.rows[0];
    if (!ev?.document_path) return res.status(404).json({ error: 'Aucun document' });
    const filePath = path.join(EVAL_UPLOADS_DIR, path.basename(ev.document_path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fichier introuvable' });
    const ext = path.extname(ev.document_path).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf', '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    };
    res.setHeader('Content-Type', mimeMap[ext] || ev.document_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(ev.document_name || 'document')}"`);
    return res.sendFile(filePath);
  } catch (err) {
    logger.error('downloadEvalDocument error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteEvalDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT document_path FROM evaluations WHERE id = $1`, [id]);
    const ev = result.rows[0];
    if (!ev) return res.status(404).json({ error: 'Évaluation non trouvée' });
    if (ev.document_path) {
      const filePath = path.join(EVAL_UPLOADS_DIR, path.basename(ev.document_path));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await query(`UPDATE evaluations SET document_path = NULL, document_name = NULL, document_mime = NULL, updated_at = NOW() WHERE id = $1`, [id]);
    return res.json({ message: 'Document supprimé' });
  } catch (err) {
    logger.error('deleteEvalDocument error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
