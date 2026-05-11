import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const listCandidates = async (req: Request, res: Response) => {
  const { status, position, search } = req.query as Record<string, string>;
  try {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`); }
    if (position) { params.push(`%${position}%`); conditions.push(`c.position ILIKE $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.position ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT c.*,
         u.first_name || ' ' || u.last_name as created_by_name
       FROM candidates c
       LEFT JOIN users u ON u.id = c.created_by
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    return res.json(result.rows);
  } catch (err) {
    logger.error('listCandidates error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT c.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM candidates c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Candidat non trouvé' });
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('getCandidate error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCandidate = async (req: Request, res: Response) => {
  const {
    first_name, last_name, email, phone, position, department,
    status, source, cover_letter, notes, interview_date, salary_expected,
  } = req.body;

  if (!first_name || !last_name || !position) {
    return res.status(400).json({ error: 'Prénom, nom et poste sont obligatoires' });
  }

  try {
    const result = await query(
      `INSERT INTO candidates
         (first_name, last_name, email, phone, position, department, status, source,
          cover_letter, notes, interview_date, salary_expected, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        first_name, last_name, email || null, phone || null, position,
        department || null, status || 'NOUVEAU', source || null,
        cover_letter || null, notes || null,
        interview_date || null, salary_expected || null,
        req.user?.userId,
      ]
    );
    logger.info(`Candidat créé: ${result.rows[0].id} par ${req.user?.email}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('createCandidate error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, position, department,
    status, source, cover_letter, notes, interview_date, salary_expected,
  } = req.body;

  try {
    const result = await query(
      `UPDATE candidates SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         email = $3,
         phone = $4,
         position = COALESCE($5, position),
         department = $6,
         status = COALESCE($7, status),
         source = $8,
         cover_letter = $9,
         notes = $10,
         interview_date = $11,
         salary_expected = $12,
         updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        first_name || null, last_name || null, email || null, phone || null,
        position || null, department || null, status || null, source || null,
        cover_letter || null, notes || null,
        interview_date || null, salary_expected || null,
        id,
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Candidat non trouvé' });
    logger.info(`Candidat ${id} mis à jour par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('updateCandidate error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM candidates WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Candidat non trouvé' });
    logger.info(`Candidat ${id} supprimé par ${req.user?.email}`);
    return res.json({ message: 'Candidat supprimé' });
  } catch (err) {
    logger.error('deleteCandidate error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        status,
        COUNT(*) as count
      FROM candidates
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'NOUVEAU' THEN 1
          WHEN 'EN_COURS' THEN 2
          WHEN 'ENTRETIEN' THEN 3
          WHEN 'OFFRE' THEN 4
          WHEN 'EMBAUCHE' THEN 5
          WHEN 'REFUSE' THEN 6
          ELSE 7
        END
    `);
    const total = await query(`SELECT COUNT(*) as total FROM candidates`);
    return res.json({ byStatus: result.rows, total: parseInt(total.rows[0].total) });
  } catch (err) {
    logger.error('getStats recruitment error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
