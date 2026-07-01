import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

/**
 * GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Retourne tous les événements du calendrier équipe sur la période :
 *  - CONGE       : congés (APPROUVE + EN_ATTENTE)
 *  - FORMATION   : formations (avec liste des participant_ids)
 *  - FIN_CONTRAT : employés dont exit_date est dans la période
 *
 * Structure de chaque événement :
 * {
 *   id, event_type, employee_id, employee_name, service_line,
 *   start_date, end_date, status,
 *   title?,           -- pour les formations
 *   participant_ids?, -- pour les formations
 * }
 */
export const listCalendarEvents = async (req: Request, res: Response) => {
  const startDate = req.query.startDate as string | undefined;
  const endDate   = req.query.endDate   as string | undefined;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate et endDate sont requis' });
  }

  try {
    // ── 1. Congés (APPROUVE + EN_ATTENTE) ────────────────────────────────
    const leavesResult = await query(
      `SELECT
         l.id,
         'CONGE'                                        AS event_type,
         l.employee_id,
         e.first_name || ' ' || e.last_name            AS employee_name,
         e.service_line,
         l.start_date::text                             AS start_date,
         l.end_date::text                               AS end_date,
         l.status,
         l.type                                         AS leave_type,
         NULL::text[]                                   AS participant_ids,
         NULL::text                                     AS title
       FROM leaves l
       JOIN employees e ON e.id = l.employee_id
       WHERE l.status IN ('APPROUVE', 'EN_ATTENTE')
         AND l.end_date   >= $1
         AND l.start_date <= $2
       ORDER BY l.start_date ASC`,
      [startDate, endDate]
    );

    // ── 2. Formations (une ligne par formation, avec tableau participant_ids) ──
    const trainingsResult = await query(
      `SELECT
         t.id,
         'FORMATION'                                    AS event_type,
         NULL::uuid                                     AS employee_id,
         NULL::text                                     AS employee_name,
         NULL::text                                     AS service_line,
         t.date::text                                   AS start_date,
         t.date::text                                   AS end_date,
         'PLANIFIE'                                     AS status,
         NULL::text                                     AS leave_type,
         ARRAY_AGG(tp.employee_id::text)                AS participant_ids,
         t.title                                        AS title
       FROM trainings t
       LEFT JOIN training_participants tp ON tp.training_id = t.id
       WHERE t.date BETWEEN $1 AND $2
       GROUP BY t.id, t.title, t.date
       ORDER BY t.date ASC`,
      [startDate, endDate]
    );

    // ── 3. Fins de contrat (exit_date dans la période) ────────────────────
    const contractEndsResult = await query(
      `SELECT
         e.id,
         'FIN_CONTRAT'                                  AS event_type,
         e.id                                           AS employee_id,
         e.first_name || ' ' || e.last_name            AS employee_name,
         e.service_line,
         e.exit_date::text                              AS start_date,
         e.exit_date::text                              AS end_date,
         'CONFIRME'                                     AS status,
         NULL::text                                     AS leave_type,
         NULL::text[]                                   AS participant_ids,
         NULL::text                                     AS title
       FROM employees e
       WHERE e.exit_date IS NOT NULL
         AND e.exit_date BETWEEN $1 AND $2
       ORDER BY e.exit_date ASC`,
      [startDate, endDate]
    );

    const events = [
      ...leavesResult.rows,
      ...trainingsResult.rows,
      ...contractEndsResult.rows,
    ];

    return res.json({ data: events });

  } catch (err) {
    logger.error('listCalendarEvents error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
