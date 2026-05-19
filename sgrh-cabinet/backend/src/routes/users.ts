import { Router } from 'express';
import { listUsers, createUser, updateUser, resetUserPassword, getAuditLogs } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../schemas/userSchemas';

const router = Router();
router.use(authenticate);
// Lecture : DRH et DIRECTION_GENERALE peuvent consulter
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Liste de tous les comptes utilisateurs (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Comptes utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   email: { type: string, format: email }
 *                   first_name: { type: string }
 *                   last_name: { type: string }
 *                   role:
 *                     type: string
 *                     enum: [DRH, DIRECTION_GENERALE, ADG, MANAGER, ASSOCIE, UTILISATEUR]
 *                   is_active: { type: boolean }
 *                   last_login: { type: string, format: date-time, nullable: true }
 *                   created_at: { type: string, format: date-time }
 */
router.get('/', listUsers);

/**
 * @swagger
 * /users/audit-logs:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Journal d'audit (DRH, DIRECTION_GENERALE)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: user_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entrées du journal d'audit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       user_id: { type: string, format: uuid }
 *                       user_name: { type: string }
 *                       action: { type: string }
 *                       entity: { type: string }
 *                       entity_id: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                 total: { type: integer }
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Utilisateurs]
 *     summary: Créer un compte utilisateur (DRH uniquement)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, role, password]
 *             properties:
 *               email: { type: string, format: email }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role:
 *                 type: string
 *                 enum: [DRH, DIRECTION_GENERALE, ADG, MANAGER, ASSOCIE, UTILISATEUR]
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Compte créé
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/', authorize('DRH'), validate(createUserSchema), createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Utilisateurs]
 *     summary: Modifier un utilisateur (DRH uniquement)
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
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role:
 *                 type: string
 *                 enum: [DRH, DIRECTION_GENERALE, ADG, MANAGER, ASSOCIE, UTILISATEUR]
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       404:
 *         description: Utilisateur introuvable
 */
router.put('/:id', authorize('DRH'), validate(updateUserSchema), updateUser);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     tags: [Utilisateurs]
 *     summary: Réinitialiser le mot de passe d'un utilisateur (DRH uniquement)
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
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 */
router.post('/:id/reset-password', authorize('DRH'), validate(resetPasswordSchema), resetUserPassword);

export default router;
