import { Router, Request, Response, NextFunction } from 'express';
import {
  listEmployees, getEmployee, createEmployee, updateEmployee,
  deactivateEmployee, getEmployeeHistory, getSalaryHistory,
  checkDuplicates, uploadPhoto, handlePhotoUpload, servePhoto,
} from '../controllers/employeeController';
import {
  uploadExcel, parseImport, executeImport, downloadImportTemplate,
  exportEmployeesExcel, exportEmployeesPDF, exportEmployeePDF,
} from '../controllers/importExportController';
import { authenticate, authorize, auditLog } from '../middleware/auth';

const router = Router();

// Photo publique — doit être AVANT router.use(authenticate)
router.get('/:id/photo/file/:filename', servePhoto);

router.use(authenticate);

/**
 * @swagger
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: Liste des collaborateurs avec filtres et pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche par nom, prénom, matricule ou email
 *       - in: query
 *         name: service_line
 *         schema: { type: string, enum: [AUDIT_ASSURANCE,CONSULTING_FA,OUTSOURCING,ADMINISTRATION,JURIDIQUE_FISCALITE] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIF,INACTIF] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste paginée des collaborateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/', listEmployees);

router.get('/check-duplicates', checkDuplicates);

/**
 * @swagger
 * /employees/export/excel:
 *   get:
 *     tags: [Employees]
 *     summary: Exporter la liste en Excel (.xlsx)
 *     responses:
 *       200:
 *         description: Fichier Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/excel', exportEmployeesExcel);

/**
 * @swagger
 * /employees/export/pdf:
 *   get:
 *     tags: [Employees]
 *     summary: Exporter la liste en PDF
 *     responses:
 *       200:
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/pdf', exportEmployeesPDF);

/**
 * @swagger
 * /employees/import/template:
 *   get:
 *     tags: [Employees]
 *     summary: Télécharger le modèle Excel d'import
 *     responses:
 *       200:
 *         description: Modèle Excel
 */
router.get('/import/template', downloadImportTemplate);

/**
 * @swagger
 * /employees/import/parse:
 *   post:
 *     tags: [Employees]
 *     summary: Analyser un fichier Excel avant import (prévisualisation)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Résultat de l'analyse avec erreurs de validation
 */
router.post('/import/parse', authorize('DRH', 'DIRECTION_GENERALE'), (req: Request, res: Response, next: NextFunction) => {
  uploadExcel(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, parseImport);

/**
 * @swagger
 * /employees/import/execute:
 *   post:
 *     tags: [Employees]
 *     summary: Exécuter l'import des collaborateurs validés
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Résultat de l'import
 */
router.post('/import/execute', authorize('DRH', 'DIRECTION_GENERALE'), executeImport);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Détail d'un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Collaborateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Collaborateur non trouvé
 */
router.get('/:id', auditLog('READ', 'employee'), getEmployee);

/**
 * @swagger
 * /employees:
 *   post:
 *     tags: [Employees]
 *     summary: Créer un collaborateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Collaborateur créé
 *       409:
 *         description: Doublon détecté (matricule ou email)
 */
router.post('/', authorize('DRH', 'DIRECTION_GENERALE'), createEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Modifier un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Collaborateur mis à jour
 */
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateEmployee);

/**
 * @swagger
 * /employees/{id}/deactivate:
 *   patch:
 *     tags: [Employees]
 *     summary: Désactiver un collaborateur (sortie)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Collaborateur désactivé
 */
router.patch('/:id/deactivate', authorize('DRH', 'DIRECTION_GENERALE'), deactivateEmployee);

/**
 * @swagger
 * /employees/{id}/history:
 *   get:
 *     tags: [Employees]
 *     summary: Historique des modifications d'un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Liste des modifications
 */
router.get('/:id/history', authorize('DRH', 'DIRECTION_GENERALE'), getEmployeeHistory);

/**
 * @swagger
 * /employees/{id}/salary-history:
 *   get:
 *     tags: [Employees]
 *     summary: Historique des salaires d'un collaborateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Historique des salaires
 */
router.get('/:id/salary-history', authorize('DRH', 'DIRECTION_GENERALE', 'ASSOCIE'), getSalaryHistory);

router.post('/:id/photo', authorize('DRH', 'DIRECTION_GENERALE'), (req: Request, res: Response, next: NextFunction) => {
  uploadPhoto(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, handlePhotoUpload);

/**
 * @swagger
 * /employees/{id}/export/pdf:
 *   get:
 *     tags: [Employees]
 *     summary: Exporter la fiche individuelle en PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fiche PDF
 */
router.get('/:id/export/pdf', exportEmployeePDF);

export default router;
