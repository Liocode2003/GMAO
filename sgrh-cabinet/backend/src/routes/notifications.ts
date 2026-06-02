import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { addClient, removeClient } from '../services/sseService';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const { role, email } = req.user!;
  const isHR = ['DRH', 'DIRECTION_GENERALE'].includes(role);
  const isManager = role === 'MANAGER';

  try {
    const notifications: object[] = [];

    // ── Alertes RH globales (DRH / Direction / Manager) ──────────────────────
    if (isHR || isManager) {
      // Anniversaires cette semaine
      const birthdays = await query(`
        WITH anniversary AS (
          SELECT id, first_name, last_name, birth_date,
                 TO_CHAR(birth_date, 'DD/MM') as birth_day_month,
                 DATE_PART('year', AGE(birth_date)) + 1 as upcoming_age,
                 MAKE_DATE(
                   EXTRACT(YEAR FROM CURRENT_DATE)::int,
                   EXTRACT(MONTH FROM birth_date)::int,
                   LEAST(
                     EXTRACT(DAY FROM birth_date)::int,
                     DATE_PART('day',
                       MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM birth_date)::int, 1)
                       + INTERVAL '1 month' - INTERVAL '1 day'
                     )::int
                   )
                 ) AS anniv_this_year,
                 MAKE_DATE(
                   EXTRACT(YEAR FROM CURRENT_DATE)::int + 1,
                   EXTRACT(MONTH FROM birth_date)::int,
                   LEAST(
                     EXTRACT(DAY FROM birth_date)::int,
                     DATE_PART('day',
                       MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM birth_date)::int, 1)
                       + INTERVAL '1 month' - INTERVAL '1 day'
                     )::int
                   )
                 ) AS anniv_next_year
          FROM employees
          WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
            AND birth_date IS NOT NULL
        )
        SELECT id, first_name, last_name, birth_date, birth_day_month, upcoming_age
        FROM anniversary
        WHERE anniv_this_year BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
           OR anniv_next_year BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY
          CASE WHEN anniv_this_year >= CURRENT_DATE THEN anniv_this_year ELSE anniv_next_year END
        LIMIT 20
      `);

      notifications.push(...birthdays.rows.map((b: any) => ({
        id: `birthday-${b.id}`,
        type: 'BIRTHDAY',
        title: `Anniversaire — ${b.first_name} ${b.last_name}`,
        body: `${b.first_name} ${b.last_name} fête ses ${b.upcoming_age} ans le ${b.birth_day_month}`,
        employeeId: b.id,
        date: b.birth_date,
        priority: 'INFO',
      })));

      // Fins de contrat dans 30 jours (DRH uniquement)
      if (isHR) {
        const contractEnds = await query(`
          SELECT id, matricule, first_name, last_name, contract_type, exit_date,
                 (exit_date - CURRENT_DATE) as days_remaining
          FROM employees
          WHERE contract_type IN ('CDD', 'STAGE')
            AND exit_date IS NOT NULL
            AND exit_date > CURRENT_DATE
            AND exit_date <= CURRENT_DATE + INTERVAL '30 days'
          ORDER BY exit_date ASC
          LIMIT 20
        `);

        notifications.push(...contractEnds.rows.map((c: any) => ({
          id: `contract-end-${c.id}`,
          type: 'CONTRACT_END',
          title: `Fin de contrat — ${c.first_name} ${c.last_name}`,
          body: `Contrat ${c.contract_type} de ${c.first_name} ${c.last_name} se termine dans ${c.days_remaining} jour(s)`,
          employeeId: c.id,
          date: c.exit_date,
          priority: c.days_remaining <= 7 ? 'URGENT' : 'WARNING',
        })));
      }

      // Congés en attente — DRH : tous ; Manager : son équipe uniquement
      let pendingLeaves;
      if (isHR) {
        pendingLeaves = await query(`
          SELECT l.id, l.type AS leave_type, l.start_date, l.end_date,
                 e.first_name, e.last_name, e.id as employee_id,
                 (l.end_date - l.start_date + 1) as days
          FROM leaves l
          JOIN employees e ON e.id = l.employee_id
          WHERE l.status = 'EN_ATTENTE'
          ORDER BY l.created_at ASC
          LIMIT 20
        `);
      } else {
        // Manager : uniquement les congés de ses collaborateurs directs
        pendingLeaves = await query(`
          SELECT l.id, l.type AS leave_type, l.start_date, l.end_date,
                 e.first_name, e.last_name, e.id as employee_id,
                 (l.end_date - l.start_date + 1) as days
          FROM leaves l
          JOIN employees e ON e.id = l.employee_id
          JOIN employees mgr ON mgr.id = e.manager_id
          JOIN users u ON u.email = mgr.email
          WHERE l.status = 'EN_ATTENTE'
            AND u.id = $1
          ORDER BY l.created_at ASC
          LIMIT 20
        `, [req.user!.userId]);
      }

      notifications.push(...pendingLeaves.rows.map((l: any) => ({
        id: `leave-pending-${l.id}`,
        type: 'LEAVE_PENDING',
        title: `Congé en attente — ${l.first_name} ${l.last_name}`,
        body: `${l.first_name} ${l.last_name} demande ${l.days} jour(s) de congé (${l.leave_type}) du ${new Date(l.start_date).toLocaleDateString('fr-FR')} au ${new Date(l.end_date).toLocaleDateString('fr-FR')}`,
        employeeId: l.employee_id,
        date: l.start_date,
        priority: 'WARNING',
      })));
    }

    // ── Notifications personnelles employé (tous rôles avec profil lié) ───────
    const empRes = await query(
      `SELECT id FROM employees WHERE email = $1 AND (exit_date IS NULL OR exit_date > CURRENT_DATE)`,
      [email]
    );
    const empId: string | undefined = empRes.rows[0]?.id;

    if (empId) {
      // Mes demandes en attente
      const myPending = await query(`
        SELECT id, type, start_date, end_date, days
        FROM leaves
        WHERE employee_id = $1 AND status = 'EN_ATTENTE'
        ORDER BY created_at DESC
        LIMIT 5
      `, [empId]);

      notifications.push(...myPending.rows.map((l: any) => ({
        id: `my-pending-${l.id}`,
        type: 'MY_LEAVE_PENDING',
        title: 'Demande de congé en attente',
        body: `Votre demande de ${l.days} jour(s) du ${new Date(l.start_date).toLocaleDateString('fr-FR')} au ${new Date(l.end_date).toLocaleDateString('fr-FR')} est en cours de validation.`,
        employeeId: empId,
        date: l.start_date,
        priority: 'INFO',
      })));

      // Mes congés récemment traités (30 derniers jours)
      const myRecent = await query(`
        SELECT id, type, start_date, end_date, days, status, updated_at
        FROM leaves
        WHERE employee_id = $1
          AND status IN ('APPROUVE', 'REFUSE')
          AND updated_at >= NOW() - INTERVAL '30 days'
        ORDER BY updated_at DESC
        LIMIT 5
      `, [empId]);

      notifications.push(...myRecent.rows.map((l: any) => ({
        id: `my-leave-${l.id}`,
        type: l.status === 'APPROUVE' ? 'MY_LEAVE_APPROVED' : 'MY_LEAVE_REJECTED',
        title: l.status === 'APPROUVE' ? 'Congé approuvé ✓' : 'Congé refusé',
        body: `Votre demande de ${l.days} jour(s) du ${new Date(l.start_date).toLocaleDateString('fr-FR')} au ${new Date(l.end_date).toLocaleDateString('fr-FR')} a été ${l.status === 'APPROUVE' ? 'approuvée' : 'refusée'}.`,
        employeeId: empId,
        date: l.start_date,
        priority: l.status === 'APPROUVE' ? 'INFO' : 'WARNING',
      })));
    }

    return res.json({ count: notifications.length, notifications });
  } catch (err) {
    logger.error('notifications error — ' + (err instanceof Error ? err.message : String(err)));
    return res.json({ count: 0, notifications: [] });
  }
});

router.get('/stream', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  addClient(userId, res);

  const heartbeat = setInterval(() => {
    try { res.write(':ping\n\n'); }
    catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
});

export default router;
