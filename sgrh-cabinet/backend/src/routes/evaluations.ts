import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listEvaluations, getEvaluation, createEvaluation, updateEvaluation, deleteEvaluation,
} from '../controllers/evaluationsController';

const router = Router();
router.use(authenticate);

router.get('/', listEvaluations);
router.get('/:id', getEvaluation);
router.post('/', authorize('DRH', 'MANAGER'), createEvaluation);
router.put('/:id', authorize('DRH', 'MANAGER'), updateEvaluation);
router.delete('/:id', authorize('DRH'), deleteEvaluation);

export default router;
