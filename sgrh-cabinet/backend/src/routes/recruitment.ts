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
router.post('/', authorize('DRH', 'MANAGER'), createCandidate);
router.put('/:id', authorize('DRH', 'MANAGER'), updateCandidate);
router.delete('/:id', authorize('DRH'), deleteCandidate);

export default router;
