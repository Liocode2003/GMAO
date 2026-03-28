import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listEvaluations, getEvaluation, createEvaluation, updateEvaluation, deleteEvaluation,
} from '../controllers/evaluationsController';

const router = Router();
router.use(authenticate);

router.get('/', listEvaluations);
router.get('/:id', getEvaluation);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), createEvaluation);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateEvaluation);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteEvaluation);

export default router;
