import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEvaluationSchema, updateEvaluationSchema } from '../schemas/evaluationSchemas';
import {
  listEvaluations, getEvaluation, createEvaluation, updateEvaluation, deleteEvaluation,
} from '../controllers/evaluationsController';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /evaluations:
 *   get:
 *     tags: [Evaluations]
 *     summary: Liste des évaluations (paginée, triable)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Filtrer par année
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [ANNUEL, MI_ANNUEL, PROBATOIRE] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [BROUILLON, EN_COURS, TERMINE] }
 *       - in: query
 *         name: employee_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 500 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [employee_name, year, overall_score, created_at], default: created_at }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Évaluations paginées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       employee_id: { type: string, format: uuid }
 *                       employee_name: { type: string }
 *                       employee_service_line: { type: string }
 *                       evaluator_name: { type: string }
 *                       year: { type: integer }
 *                       period: { type: string, enum: [ANNUEL, MI_ANNUEL, PROBATOIRE] }
 *                       status: { type: string, enum: [BROUILLON, EN_COURS, TERMINE] }
 *                       overall_score: { type: number, nullable: true }
 *                       objectives_score: { type: number, nullable: true }
 *                       skills_score: { type: number, nullable: true }
 *                       behavior_score: { type: number, nullable: true }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', listEvaluations);

/**
 * @swagger
 * /evaluations/{id}:
 *   get:
 *     tags: [Evaluations]
 *     summary: Détail d'une évaluation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Évaluation complète
 *       404:
 *         description: Évaluation introuvable
 */
router.get('/:id', getEvaluation);

/**
 * @swagger
 * /evaluations:
 *   post:
 *     tags: [Evaluations]
 *     summary: Créer une évaluation (DRH, MANAGER)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, year]
 *             properties:
 *               employee_id: { type: string, format: uuid }
 *               year: { type: integer }
 *               period: { type: string, enum: [ANNUEL, MI_ANNUEL, PROBATOIRE], default: ANNUEL }
 *               status: { type: string, enum: [BROUILLON, EN_COURS, TERMINE], default: BROUILLON }
 *               objectives_score: { type: number, minimum: 0, maximum: 20 }
 *               skills_score: { type: number, minimum: 0, maximum: 20 }
 *               behavior_score: { type: number, minimum: 0, maximum: 20 }
 *               comments: { type: string }
 *               objectives: { type: string }
 *               strengths: { type: string }
 *               improvements: { type: string }
 *     responses:
 *       201:
 *         description: Évaluation créée
 *       409:
 *         description: Évaluation déjà existante pour cet employé/année/période
 */
router.post('/', authorize('DRH', 'MANAGER'), validate(createEvaluationSchema), createEvaluation);

/**
 * @swagger
 * /evaluations/{id}:
 *   put:
 *     tags: [Evaluations]
 *     summary: Modifier une évaluation (DRH, MANAGER)
 *     security: [{ bearerAuth: [] }]
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
 *             properties:
 *               status: { type: string, enum: [BROUILLON, EN_COURS, TERMINE] }
 *               objectives_score: { type: number, minimum: 0, maximum: 20 }
 *               skills_score: { type: number, minimum: 0, maximum: 20 }
 *               behavior_score: { type: number, minimum: 0, maximum: 20 }
 *               comments: { type: string }
 *               strengths: { type: string }
 *               improvements: { type: string }
 *     responses:
 *       200:
 *         description: Évaluation mise à jour
 *       404:
 *         description: Évaluation introuvable
 */
router.put('/:id', authorize('DRH', 'MANAGER'), validate(updateEvaluationSchema), updateEvaluation);

/**
 * @swagger
 * /evaluations/{id}:
 *   delete:
 *     tags: [Evaluations]
 *     summary: Supprimer une évaluation (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Évaluation supprimée
 *       404:
 *         description: Évaluation introuvable
 */
router.delete('/:id', authorize('DRH'), deleteEvaluation);

export default router;
