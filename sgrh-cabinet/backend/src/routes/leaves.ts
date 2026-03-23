import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLeaveBalance,
  listLeaves,
  createLeave,
  approveLeave,
  deleteLeave,
} from '../controllers/leavesController';

const router = Router();

// Solde congés d'un collaborateur
router.get('/employee/:id/balance', authenticate, getLeaveBalance);

// Liste des congés d'un collaborateur
router.get('/employee/:id', authenticate, listLeaves);

// Créer un congé (DRH, DIRECTION_GENERALE, MANAGER)
router.post('/employee/:id', authenticate, authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), createLeave);

// Approuver / refuser un congé (DRH, DIRECTION_GENERALE)
router.patch('/:leaveId/approve', authenticate, authorize('DRH', 'DIRECTION_GENERALE'), approveLeave);

// Supprimer un congé (DRH uniquement)
router.delete('/:leaveId', authenticate, authorize('DRH', 'DIRECTION_GENERALE'), deleteLeave);

export default router;
