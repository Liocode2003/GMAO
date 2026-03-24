import { Router } from 'express';
import { listUsers, createUser, updateUser, resetUserPassword, getAuditLogs } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../schemas/userSchemas';

const router = Router();
router.use(authenticate);
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.post('/:id/reset-password', validate(resetPasswordSchema), resetUserPassword);
router.get('/audit-logs', getAuditLogs);

export default router;
