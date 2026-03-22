import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const listTrainings = async (req: Request, res: Response) => {
  const { year, month, type } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (year) { conditions.push(`EXTRACT(YEAR FROM t.date) = $${pi++}`); params.push(year); }
  if (month) { conditions.push(`EXTRACT(MONTH FROM t.date) = $${pi++}`); params.push(month); }
  if (type) { conditions.push(`t.type = $${pi++}`); params.push(type); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT t.*,
         COUNT(tp.employee_id) as participant_count,
         ARRAY_AGG(json_build_object('id', e.id, 'name', e.first_name || ' ' || e.last_name)) FILTER (WHERE e.id IS NOT NULL) as participants
       FROM trainings t
       LEFT JOIN training_participants tp ON tp.training_id = t.id
       LEFT JOIN employees e ON e.id = tp.employee_id
       ${where}
       GROUP BY t.id
       ORDER BY t.date DESC`,
      params
    );
    return res.json(result.rows);
  } catch (err) {
    logger.error('listTrainings error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createTraining = async (req: Request, res: Response) => {
  const { type, title, date, location, start_time, end_time, duration_hours, trainer, observations, budget, participant_ids } = req.body;

  try {
    const result = await query(
      `INSERT INTO trainings(type, title, date, location, start_time, end_time, duration_hours, trainer, observations, budget, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [type, title, date, location || null, start_time || null, end_time || null,
       duration_hours || null, trainer || null, observations || null, budget || null, req.user?.userId]
    );

    const training = result.rows[0];

    if (Array.isArray(participant_ids) && participant_ids.length > 0) {
      const placeholders = participant_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO training_participants(training_id, employee_id) VALUES ${placeholders}`,
        [training.id, ...participant_ids]
      );
    }

    return res.status(201).json(training);
  } catch (err) {
    logger.error('createTraining error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateTraining = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { participant_ids, ...updates } = req.body;

  const fields = Object.keys(updates).filter(k => !['id','created_at','created_by'].includes(k));
  if (fields.length > 0) {
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    await query(
      `UPDATE trainings SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1}`,
      [...fields.map(f => updates[f]), id]
    );
  }

  if (Array.isArray(participant_ids)) {
    await query('DELETE FROM training_participants WHERE training_id = $1', [id]);
    if (participant_ids.length > 0) {
      const placeholders = participant_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO training_participants(training_id, employee_id) VALUES ${placeholders}`,
        [id, ...participant_ids]
      );
    }
  }

  const result = await query('SELECT * FROM trainings WHERE id = $1', [id]);
  return res.json(result.rows[0]);
};

export const deleteTraining = async (req: Request, res: Response) => {
  const { id } = req.params;
  await query('DELETE FROM trainings WHERE id = $1', [id]);
  return res.json({ message: 'Formation supprimée' });
};
