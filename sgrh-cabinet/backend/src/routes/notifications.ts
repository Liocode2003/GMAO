import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

/**
 * GET /api/notifications
 * Retourne les alertes actives :
 *  - Anniversaires dans les 7 prochains jours
 *  - Fins de contrat (CDD/STAGE) dans les 30 prochains jours
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Anniversaires cette semaine
    const birthdays = await query(`
      SELECT id, first_name, last_name, birth_date,
             TO_CHAR(birth_date, 'DD/MM') as birth_day_month,
             DATE_PART('year', AGE(birth_date)) + 1 as upcoming_age
      FROM employees
      WHERE exit_date IS NULL OR exit_date > CURRENT_DATE
        AND TO_CHAR(birth_date, 'MM-DD') BETWEEN
            TO_CHAR(CURRENT_DATE, 'MM-DD') AND
            TO_CHAR(CURRENT_DATE + INTERVAL '7 days', 'MM-DD')
      ORDER BY TO_CHAR(birth_date, 'MM-DD')
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

    const notifications = [
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
