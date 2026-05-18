import { Router } from 'express';
import { listUsers, createUser, updateUser, resetUserPassword, getAuditLogs } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../schemas/userSchemas';

const router = Router();
router.use(authenticate);
// Lecture : DRH et DIRECTION_GENERALE peuvent consulter
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

router.get('/', listUsers);
router.get('/audit-logs', getAuditLogs);

// Écriture : DRH uniquement
router.post('/', authorize('DRH'), validate(createUserSchema), createUser);
router.put('/:id', authorize('DRH'), validate(updateUserSchema), updateUser);
router.post('/:id/reset-password', authorize('DRH'), validate(resetPasswordSchema), resetUserPassword);

export default router;
