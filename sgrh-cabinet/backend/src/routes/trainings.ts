import { Router } from 'express';
import { listTrainings, createTraining, updateTraining, deleteTraining } from '../controllers/trainingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTrainingSchema, updateTrainingSchema } from '../schemas/trainingSchemas';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /trainings:
 *   get:
 *     tags: [Trainings]
 *     summary: Liste paginée des formations
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Filtrer par année
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 500 }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, title, type, duration_hours, trainer]
 *           default: date
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Formations paginées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trainings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       title: { type: string }
 *                       type: { type: string, enum: [INTRA, INTERNE, AOC, GROUPE] }
 *                       date: { type: string, format: date }
 *                       duration_hours: { type: number }
 *                       trainer: { type: string, nullable: true }
 *                       location: { type: string, nullable: true }
 *                       participant_count: { type: integer }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', listTrainings);

/**
 * @swagger
 * /trainings:
 *   post:
 *     tags: [Trainings]
 *     summary: Créer une formation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, date]
 *             properties:
 *               title: { type: string }
 *               type: { type: string, enum: [INTRA, INTERNE, AOC, GROUPE] }
 *               date: { type: string, format: date }
 *               duration_hours: { type: number }
 *               location: { type: string }
 *               trainer: { type: string }
 *               participant_ids: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Formation créée
 */
router.post('/', authorize('DRH', 'MANAGER'), validate(createTrainingSchema), createTraining);

/**
 * @swagger
 * /trainings/{id}:
 *   put:
 *     tags: [Trainings]
 *     summary: Modifier une formation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Formation mise à jour
 *   delete:
 *     tags: [Trainings]
 *     summary: Supprimer une formation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Formation supprimée
 */
router.put('/:id', authorize('DRH', 'MANAGER'), validate(updateTrainingSchema), updateTraining);
router.delete('/:id', authorize('DRH'), deleteTraining);

export default router;
