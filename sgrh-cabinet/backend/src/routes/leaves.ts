import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getLeaveBalance, listLeaves, createLeave, approveLeave, deleteLeave } from '../controllers/leavesController';
import { validate } from '../middleware/validate';
import { createLeaveSchema, approveLeaveSchema } from '../schemas/leaveSchemas';

const router = Router();

/**
 * @swagger
 * /leaves/employee/{id}/balance:
 *   get:
 *     tags: [Leaves]
 *     summary: Solde de congés d'un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Solde de congés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 annual_balance: { type: number }
 *                 used_days: { type: number }
 *                 remaining_days: { type: number }
 */
router.get('/employee/:id/balance', authenticate, getLeaveBalance);

/**
 * @swagger
 * /leaves/employee/{id}:
 *   get:
 *     tags: [Leaves]
 *     summary: Liste des congés d'un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste des congés
 *   post:
 *     tags: [Leaves]
 *     summary: Créer un congé pour un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, start_date, end_date]
 *             properties:
 *               type: { type: string, enum: [PLANIFIE, IMPRÉVU] }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               days: { type: number }
 *               subtype: { type: string }
 *     responses:
 *       201:
 *         description: Congé créé
 */
router.get('/employee/:id', authenticate, listLeaves);
router.post('/employee/:id', authenticate, authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), validate(createLeaveSchema), createLeave);

/**
 * @swagger
 * /leaves/{leaveId}/approve:
 *   patch:
 *     tags: [Leaves]
 *     summary: Approuver ou refuser un congé
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [APPROUVE, REFUSE] }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.patch('/:leaveId/approve', authenticate, authorize('DRH', 'DIRECTION_GENERALE'), validate(approveLeaveSchema), approveLeave);

/**
 * @swagger
 * /leaves/{leaveId}:
 *   delete:
 *     tags: [Leaves]
 *     summary: Supprimer un congé
 *     parameters:
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Congé supprimé
 */
router.delete('/:leaveId', authenticate, authorize('DRH', 'DIRECTION_GENERALE'), deleteLeave);

export default router;
