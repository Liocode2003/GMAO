import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCandidateSchema, updateCandidateSchema } from '../schemas/recruitmentSchemas';
import {
  listCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate, getStats,
} from '../controllers/recruitmentController';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /recruitment/stats:
 *   get:
 *     tags: [Recrutement]
 *     summary: Statistiques du pipeline de recrutement
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Comptage par statut et source
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 byStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       count: { type: integer }
 *                 bySource:
 *                   type: array
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /recruitment:
 *   get:
 *     tags: [Recrutement]
 *     summary: Liste des candidats (paginée, triable, filtrable)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [NOUVEAU, EN_COURS, ENTRETIEN, OFFRE, EMBAUCHE, REFUSE] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [last_name, first_name, position, created_at, interview_date, salary_expected]
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Candidats paginés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       first_name: { type: string }
 *                       last_name: { type: string }
 *                       email: { type: string, nullable: true }
 *                       phone: { type: string, nullable: true }
 *                       position: { type: string }
 *                       status: { type: string, enum: [NOUVEAU, EN_COURS, ENTRETIEN, OFFRE, EMBAUCHE, REFUSE] }
 *                       interview_date: { type: string, format: date-time, nullable: true }
 *                       salary_expected: { type: number, nullable: true }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', listCandidates);

/**
 * @swagger
 * /recruitment/{id}:
 *   get:
 *     tags: [Recrutement]
 *     summary: Détail d'un candidat
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Candidat
 *       404:
 *         description: Candidat introuvable
 */
router.get('/:id', getCandidate);

/**
 * @swagger
 * /recruitment:
 *   post:
 *     tags: [Recrutement]
 *     summary: Créer un candidat (DRH, MANAGER)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, position]
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               position: { type: string }
 *               department: { type: string }
 *               status: { type: string, enum: [NOUVEAU, EN_COURS, ENTRETIEN, OFFRE, EMBAUCHE, REFUSE], default: NOUVEAU }
 *               source: { type: string }
 *               interview_date: { type: string, format: date-time }
 *               salary_expected: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Candidat créé
 */
router.post('/', authorize('DRH', 'MANAGER'), validate(createCandidateSchema), createCandidate);

/**
 * @swagger
 * /recruitment/{id}:
 *   put:
 *     tags: [Recrutement]
 *     summary: Modifier un candidat (DRH, MANAGER)
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
 *               status: { type: string, enum: [NOUVEAU, EN_COURS, ENTRETIEN, OFFRE, EMBAUCHE, REFUSE] }
 *               interview_date: { type: string, format: date-time }
 *               salary_expected: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Candidat mis à jour
 *       404:
 *         description: Candidat introuvable
 */
router.put('/:id', authorize('DRH', 'MANAGER'), validate(updateCandidateSchema), updateCandidate);

/**
 * @swagger
 * /recruitment/{id}:
 *   delete:
 *     tags: [Recrutement]
 *     summary: Supprimer un candidat (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Candidat supprimé
 */
router.delete('/:id', authorize('DRH'), deleteCandidate);

export default router;
