import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Alertes actives — anniversaires (7 j), fins de contrat (30 j), congés en attente
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des notifications actives triées par priorité
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       type:
 *                         type: string
 *                         enum: [LEAVE_PENDING, BIRTHDAY, CONTRACT_END]
 *                       title: { type: string }
 *                       body: { type: string }
 *                       employeeId: { type: string, format: uuid }
 *                       date: { type: string, format: date }
 *                       priority:
 *                         type: string
 *                         enum: [INFO, WARNING, URGENT]
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Anniversaires cette semaine (correction: comparaison DOY robuste, gère le passage fin d'année)
    const birthdays = await query(`
      SELECT id, first_name, last_name, birth_date,
             TO_CHAR(birth_date, 'DD/MM') as birth_day_month,
             DATE_PART('year', AGE(birth_date)) + 1 as upcoming_age
      FROM employees
      WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
        AND birth_date IS NOT NULL
        AND (
          MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM birth_date)::int, EXTRACT(DAY FROM birth_date)::int)
            BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          OR
          MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM birth_date)::int, EXTRACT(DAY FROM birth_date)::int)
            BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        )
      ORDER BY
        CASE
          WHEN MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM birth_date)::int, EXTRACT(DAY FROM birth_date)::int) >= CURRENT_DATE
          THEN MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM birth_date)::int, EXTRACT(DAY FROM birth_date)::int)
          ELSE MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM birth_date)::int, EXTRACT(DAY FROM birth_date)::int)
        END
      LIMIT 20
    `);

    // Fins de contrat dans 30 jours
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

    // Congés en attente de validation
    const pendingLeaves = await query(`
      SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date,
             e.first_name, e.last_name, e.id as employee_id,
             (lr.end_date - lr.start_date + 1) as days
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      WHERE lr.status = 'PENDING'
      ORDER BY lr.created_at ASC
      LIMIT 20
    `);

    const notifications = [
      ...pendingLeaves.rows.map(l => ({
        id: `leave-pending-${l.id}`,
        type: 'LEAVE_PENDING' as const,
        title: `Congé en attente — ${l.first_name} ${l.last_name}`,
        body: `${l.first_name} ${l.last_name} demande ${l.days} jour(s) de congé (${l.leave_type}) du ${new Date(l.start_date).toLocaleDateString('fr-FR')} au ${new Date(l.end_date).toLocaleDateString('fr-FR')}`,
        employeeId: l.employee_id,
        date: l.start_date,
        priority: 'WARNING' as const,
      })),
      ...birthdays.rows.map(b => ({
        id: `birthday-${b.id}`,
        type: 'BIRTHDAY' as const,
        title: `Anniversaire — ${b.first_name} ${b.last_name}`,
        body: `${b.first_name} ${b.last_name} fête ses ${b.upcoming_age} ans le ${b.birth_day_month}`,
        employeeId: b.id,
        date: b.birth_date,
        priority: 'INFO' as const,
      })),
      ...contractEnds.rows.map(c => ({
        id: `contract-end-${c.id}`,
        type: 'CONTRACT_END' as const,
        title: `Fin de contrat — ${c.first_name} ${c.last_name}`,
        body: `Contrat ${c.contract_type} de ${c.first_name} ${c.last_name} se termine dans ${c.days_remaining} jour(s)`,
        employeeId: c.id,
        date: c.exit_date,
        priority: c.days_remaining <= 7 ? ('URGENT' as const) : ('WARNING' as const),
      })),
    ];

    return res.json({
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
