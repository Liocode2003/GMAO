import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listPayslips, getPayslip, previewPayslip,
  createPayslip, updatePayslip, publishPayslip,
  downloadPayslipPDF, deletePayslip,
  getMasseSalariale, getAnnualSummary, downloadAttestation,
  exportMasseSalarialeExcel,
} from '../controllers/payslipController';

const router = Router();
router.use(authenticate);
// Seuls DRH et ADG utilisent l'application
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

/**
 * @swagger
 * /payslips/masse-salariale:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Masse salariale mensuelle pour une année (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Année (défaut = année en cours)
 *     responses:
 *       200:
 *         description: Masse salariale mois par mois + totaux annuels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year: { type: integer }
 *                 months:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: integer }
 *                       headcount: { type: integer }
 *                       gross_total: { type: number }
 *                       net_total: { type: number }
 *                       igr_total: { type: number }
 *                 totals:
 *                   type: object
 *                   properties:
 *                     gross: { type: number }
 *                     net: { type: number }
 *                     igr: { type: number }
 */
router.get('/masse-salariale', getMasseSalariale);

/**
 * @swagger
 * /payslips/masse-salariale/export:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Export Excel de la masse salariale (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fichier Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/masse-salariale/export', exportMasseSalarialeExcel);

/**
 * @swagger
 * /payslips/employee/{id}/annual:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Récapitulatif annuel d'un employé (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Données annuelles de l'employé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     matricule: { type: string }
 *                     first_name: { type: string }
 *                     last_name: { type: string }
 *                     grade: { type: string }
 *                 year: { type: integer }
 *                 slips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period_month: { type: integer }
 *                       gross_salary: { type: number }
 *                       net_salary: { type: number }
 *                       igr: { type: number }
 *                       status: { type: string, enum: [BROUILLON, PUBLIE] }
 *                 cumul:
 *                   type: object
 *                   properties:
 *                     gross: { type: number }
 *                     net: { type: number }
 *                     igr: { type: number }
 *       404:
 *         description: Employé introuvable
 */
router.get('/employee/:id/annual', getAnnualSummary);

/**
 * @swagger
 * /payslips/employee/{id}/attestation:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Télécharger l'attestation fiscale annuelle (PDF) d'un employé (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Attestation PDF (formulaire 9421)
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Employé ou bulletins introuvables
 */
router.get('/employee/:id/attestation', downloadAttestation);

/**
 * @swagger
 * /payslips:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Liste des bulletins filtrée (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *       - in: query
 *         name: employee_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [BROUILLON, PUBLIE] }
 *     responses:
 *       200:
 *         description: Liste des bulletins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   employee_id: { type: string, format: uuid }
 *                   matricule: { type: string }
 *                   first_name: { type: string }
 *                   last_name: { type: string }
 *                   grade: { type: string }
 *                   service_line: { type: string }
 *                   period_year: { type: integer }
 *                   period_month: { type: integer }
 *                   gross_salary: { type: number }
 *                   net_salary: { type: number }
 *                   igr: { type: number }
 *                   status: { type: string, enum: [BROUILLON, PUBLIE] }
 *                   pdf_path: { type: string, nullable: true }
 */
router.get('/', listPayslips);

/**
 * @swagger
 * /payslips/{id}:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Détail d'un bulletin (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bulletin complet avec toutes les lignes de calcul
 *       404:
 *         description: Bulletin introuvable
 */
router.get('/:id', getPayslip);

/**
 * @swagger
 * /payslips/{id}/pdf:
 *   get:
 *     tags: [Bulletins de paie]
 *     summary: Télécharger le PDF d'un bulletin (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bulletin PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Bulletin introuvable
 */
router.get('/:id/pdf', downloadPayslipPDF);

/**
 * @swagger
 * /payslips/preview:
 *   post:
 *     tags: [Bulletins de paie]
 *     summary: Calculer un bulletin en temps réel sans l'enregistrer (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, period_year, period_month]
 *             properties:
 *               employee_id: { type: string, format: uuid }
 *               period_year: { type: integer }
 *               period_month: { type: integer, minimum: 1, maximum: 12 }
 *               base_salary_override: { type: number }
 *     responses:
 *       200:
 *         description: Résultat de calcul (brut, net, IGR, déductions)
 */
router.post('/preview', authorize('DRH'), previewPayslip);

/**
 * @swagger
 * /payslips:
 *   post:
 *     tags: [Bulletins de paie]
 *     summary: Créer et calculer un bulletin de paie (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, period_year, period_month]
 *             properties:
 *               employee_id: { type: string, format: uuid }
 *               period_year: { type: integer }
 *               period_month: { type: integer, minimum: 1, maximum: 12 }
 *               base_salary_override: { type: number }
 *               transport_allowance_override: { type: number }
 *               other_allowances: { type: number }
 *               other_deductions: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Bulletin créé (statut BROUILLON)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *       409:
 *         description: Un bulletin existe déjà pour cette période
 */
router.post('/', authorize('DRH'), createPayslip);

/**
 * @swagger
 * /payslips/{id}:
 *   put:
 *     tags: [Bulletins de paie]
 *     summary: Modifier un bulletin BROUILLON (DRH uniquement)
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
 *               base_salary_override: { type: number }
 *               transport_allowance_override: { type: number }
 *               other_allowances: { type: number }
 *               other_deductions: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Bulletin recalculé et mis à jour
 *       400:
 *         description: Impossible de modifier un bulletin publié
 *       404:
 *         description: Bulletin introuvable
 */
router.put('/:id', authorize('DRH'), updatePayslip);

/**
 * @swagger
 * /payslips/{id}/publish:
 *   patch:
 *     tags: [Bulletins de paie]
 *     summary: Publier un bulletin (DRH uniquement) — irréversible
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bulletin publié (PDF généré)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       404:
 *         description: Bulletin introuvable
 */
router.patch('/:id/publish', authorize('DRH'), publishPayslip);

/**
 * @swagger
 * /payslips/{id}:
 *   delete:
 *     tags: [Bulletins de paie]
 *     summary: Supprimer un bulletin BROUILLON (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Bulletin supprimé
 *       400:
 *         description: Impossible de supprimer un bulletin publié
 *       404:
 *         description: Bulletin introuvable
 */
router.delete('/:id', authorize('DRH'), deletePayslip);

export default router;
