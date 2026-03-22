import { Router } from 'express';
import { listUsers, createUser, updateUser, resetUserPassword, getAuditLogs } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);
router.get('/audit-logs', getAuditLogs);

export default router;
