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
 *     summary: Liste des formations
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Filtrer par année
 *     responses:
 *       200:
 *         description: Liste des formations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   title: { type: string }
 *                   type: { type: string, enum: [INTRA, INTERNE, AOC, GROUPE] }
 *                   date: { type: string, format: date }
 *                   duration_hours: { type: number }
 *                   participant_count: { type: integer }
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
router.post('/', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), validate(createTrainingSchema), createTraining);

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
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), validate(updateTrainingSchema), updateTraining);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteTraining);

export default router;
