import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const listEvaluations = async (req: Request, res: Response) => {
  const { year, period, status, employee_id } = req.query as Record<string, string>;
  const userRole = req.user?.role;
  const userId = req.user?.userId;

  try {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (year) { params.push(year); conditions.push(`ev.year = $${params.length}`); }
    if (period) { params.push(period); conditions.push(`ev.period = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`ev.status = $${params.length}`); }
    if (employee_id) { params.push(employee_id); conditions.push(`ev.employee_id = $${params.length}`); }

    // MANAGER: only see evaluations for their direct reports
    if (userRole === 'MANAGER') {
      params.push(userId);
      conditions.push(`e.manager_id IN (SELECT id FROM employees WHERE id IN (SELECT employee_id FROM users WHERE id = $${params.length}))`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT ev.*,
         e.first_name || ' ' || e.last_name as employee_name,
         e.function as employee_function,
         e.service_line as employee_service_line,
         u.first_name || ' ' || u.last_name as evaluator_name
       FROM evaluations ev
       JOIN employees e ON e.id = ev.employee_id
       LEFT JOIN users u ON u.id = ev.evaluator_id
       ${whereClause}
       ORDER BY ev.year DESC, ev.created_at DESC`,
      params
    );

    return res.json(result.rows);
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
        period || 'ANNUEL', status || 'BROUILLON', overall_score,
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
