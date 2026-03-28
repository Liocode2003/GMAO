import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listCandidates, getCandidate, createCandidate, updateCandidate, deleteCandidate, getStats,
} from '../controllers/recruitmentController';

const router = Router();
router.use(authenticate);

router.get('/stats', getStats);
router.get('/', listCandidates);
router.get('/:id', getCandidate);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), createCandidate);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateCandidate);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteCandidate);

export default router;
