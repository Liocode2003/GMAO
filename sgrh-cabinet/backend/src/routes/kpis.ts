import { Router } from 'express';
import { getDashboard, getKPIs, getMonthlyKPIs } from '../controllers/kpiController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /kpis/dashboard:
 *   get:
 *     tags: [KPIs]
 *     summary: Données du tableau de bord principal
 *     description: Retourne effectifs, anniversaires, contrats à renouveler, répartitions par service/genre/âge
 *     responses:
 *       200:
 *         description: Données dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActive:
 *                   type: integer
 *                 withEmail:
 *                   type: integer
 *                 birthdaysThisMonth:
 *                   type: array
 *                 contractsToRenew:
 *                   type: array
 *                 byServiceLine:
 *                   type: array
 *                 byGender:
 *                   type: array
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /kpis:
 *   get:
 *     tags: [KPIs]
 *     summary: KPIs annuels (YTD, cibles, turnover, mobilités)
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Année (défaut année courante)
 *     responses:
 *       200:
 *         description: KPIs annuels
 */
router.get('/', getKPIs);

/**
 * @swagger
 * /kpis/monthly:
 *   get:
 *     tags: [KPIs]
 *     summary: KPIs mensuels
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *     responses:
 *       200:
 *         description: KPIs du mois
 */
router.get('/monthly', getMonthlyKPIs);

export default router;
