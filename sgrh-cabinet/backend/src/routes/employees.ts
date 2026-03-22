import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getEmployeeHistory,
  checkDuplicates,
} from '../controllers/employeeController';
import { authenticate, authorize, auditLog } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listEmployees);
router.get('/check-duplicates', checkDuplicates);
router.get('/:id', auditLog('READ', 'employee'), getEmployee);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE'), createEmployee);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateEmployee);
router.patch('/:id/deactivate', authorize('DRH', 'DIRECTION_GENERALE'), deactivateEmployee);
router.get('/:id/history', authorize('DRH', 'DIRECTION_GENERALE'), getEmployeeHistory);

export default router;
