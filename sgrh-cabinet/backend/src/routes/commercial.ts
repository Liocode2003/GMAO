import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listSubmissions,
  getStats,
  getDashboardWidget,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  exportExcel,
  exportPDF,
} from '../controllers/commercialController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /commercial/stats:
 *   get:
 *     tags: [Commercial]
 *     summary: Statistiques par type (AMI, APPEL_OFFRE) — tous rôles connectés
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: quarter
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *       - in: query
 *         name: service_line
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Statistiques indexées par type de soumission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   total: { type: integer }
 *                   wins: { type: integer }
 *                   losses: { type: integer }
 *                   en_cours: { type: integer }
 *                   success_rate: { type: number, description: Pourcentage 0-100 }
 *                   total_amount: { type: number, description: "Montant total gagné (0 si rôle sans accès montants)" }
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /commercial/dashboard-widget:
 *   get:
 *     tags: [Commercial]
 *     summary: Chiffres du mois en cours pour le tableau de bord
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Agrégats du mois courant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ami_this_month: { type: integer }
 *                 ao_this_month: { type: integer }
 *                 wins_this_month: { type: integer }
 *                 amount_this_month: { type: number }
 */
router.get('/dashboard-widget', getDashboardWidget);

/**
 * @swagger
 * /commercial/export/excel:
 *   get:
 *     tags: [Commercial]
 *     summary: Export Excel des soumissions filtrées
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [AMI, APPEL_OFFRE] }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: quarter
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *       - in: query
 *         name: service_line
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fichier Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/excel', exportExcel);

/**
 * @swagger
 * /commercial/export/pdf:
 *   get:
 *     tags: [Commercial]
 *     summary: Export PDF des soumissions filtrées
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [AMI, APPEL_OFFRE] }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: quarter
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *       - in: query
 *         name: service_line
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/pdf', exportPDF);

/**
 * @swagger
 * /commercial:
 *   get:
 *     tags: [Commercial]
 *     summary: Liste paginée des soumissions commerciales — tous rôles connectés
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [AMI, APPEL_OFFRE] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *       - in: query
 *         name: service_line
 *         schema: { type: string }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: quarter
 *         schema: { type: integer }
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
 *           enum: [submission_date, title, client, status, reference]
 *           default: submission_date
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Soumissions paginées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       reference: { type: string }
 *                       title: { type: string }
 *                       client: { type: string }
 *                       type: { type: string, enum: [AMI, APPEL_OFFRE] }
 *                       status: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *                       submission_date: { type: string, format: date }
 *                       service_line: { type: string, nullable: true }
 *                       contract_amount: { type: number, nullable: true }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/', listSubmissions);

/**
 * @swagger
 * /commercial:
 *   post:
 *     tags: [Commercial]
 *     summary: Créer une soumission (DRH, ASSOCIE, MANAGER)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, client, type, submission_date]
 *             properties:
 *               reference: { type: string }
 *               title: { type: string }
 *               client: { type: string }
 *               type: { type: string, enum: [AMI, APPEL_OFFRE] }
 *               status: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE], default: EN_COURS }
 *               submission_date: { type: string, format: date }
 *               service_line: { type: string }
 *               contract_amount: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Soumission créée
 *       400:
 *         description: Données invalides
 */
router.post('/', authorize('DRH', 'ASSOCIE', 'MANAGER'), createSubmission);

/**
 * @swagger
 * /commercial/{id}:
 *   put:
 *     tags: [Commercial]
 *     summary: Modifier une soumission (DRH, ASSOCIE, MANAGER)
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
 *               title: { type: string }
 *               client: { type: string }
 *               status: { type: string, enum: [EN_COURS, GAGNE, PERDU, SANS_SUITE] }
 *               submission_date: { type: string, format: date }
 *               service_line: { type: string }
 *               contract_amount: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Soumission mise à jour
 *       403:
 *         description: Non autorisé à modifier cette soumission
 *       404:
 *         description: Soumission introuvable
 */
router.put('/:id', authorize('DRH', 'ASSOCIE', 'MANAGER'), updateSubmission);

/**
 * @swagger
 * /commercial/{id}:
 *   delete:
 *     tags: [Commercial]
 *     summary: Supprimer une soumission (DRH, ASSOCIE, MANAGER)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Soumission supprimée
 *       403:
 *         description: Non autorisé à supprimer cette soumission
 *       404:
 *         description: Soumission introuvable
 */
router.delete('/:id', authorize('DRH', 'ASSOCIE', 'MANAGER'), deleteSubmission);

export default router;
