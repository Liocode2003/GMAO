import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const getCalendarEvents = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate et endDate requis' });
  }

  try {
    const [leavesRes, trainingsRes, contractsRes] = await Promise.all([
      query(`
        SELECT
          l.id, l.employee_id, l.type AS leave_type, l.start_date, l.end_date,
          l.days, l.status, l.notes,
          e.first_name || ' ' || e.last_name AS employee_name,
          e.service_line
        FROM leaves l
        JOIN employees e ON e.id = l.employee_id
        WHERE l.status IN ('APPROUVE', 'EN_ATTENTE')
          AND l.start_date <= $2
          AND l.end_date   >= $1
        ORDER BY l.start_date
      `, [startDate, endDate]),

      query(`
        SELECT
          t.id, t.title, t.date, t.type AS training_type,
          t.location, t.duration_hours,
          COUNT(tp.employee_id)::int AS participant_count,
          COALESCE(ARRAY_AGG(tp.employee_id) FILTER (WHERE tp.employee_id IS NOT NULL), '{}') AS participant_ids
        FROM trainings t
        LEFT JOIN training_participants tp ON tp.training_id = t.id
        WHERE t.date BETWEEN $1 AND $2
        GROUP BY t.id
        ORDER BY t.date
      `, [startDate, endDate]),

      query(`
        SELECT id, first_name || ' ' || last_name AS employee_name,
          service_line, contract_type, exit_date
        FROM employees
        WHERE exit_date BETWEEN $1 AND $2
        ORDER BY exit_date
      `, [startDate, endDate]),
    ]);

    const events: object[] = [];

    for (const l of leavesRes.rows) {
      events.push({
        id: l.id,
        event_type: 'CONGE',
        title: l.employee_name,
        start_date: l.start_date,
        end_date: l.end_date,
        employee_id: l.employee_id,
        employee_name: l.employee_name,
        service_line: l.service_line,
        status: l.status,
        days: l.days,
        leave_type: l.leave_type,
        notes: l.notes,
      });
    }

    for (const t of trainingsRes.rows) {
      events.push({
        id: t.id,
        event_type: 'FORMATION',
        title: t.title,
        start_date: t.date,
        end_date: t.date,
        employee_id: null,
        employee_name: null,
        service_line: null,
        status: 'CONFIRME',
        participant_count: t.participant_count,
        participant_ids: t.participant_ids,
        training_type: t.training_type,
        location: t.location,
        duration_hours: t.duration_hours,
      });
    }

    for (const c of contractsRes.rows) {
      events.push({
        id: `contract-end-${c.id}`,
        event_type: 'FIN_CONTRAT',
        title: c.employee_name,
        start_date: c.exit_date,
        end_date: c.exit_date,
        employee_id: c.id,
        employee_name: c.employee_name,
        service_line: c.service_line,
        status: 'ECHEANCE',
        contract_type: c.contract_type,
      });
    }

    return res.json(events);
  } catch (err) {
    logger.error('getCalendarEvents error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
