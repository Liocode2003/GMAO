import { Router } from 'express';
import { listTrainings, createTraining, updateTraining, deleteTraining } from '../controllers/trainingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', listTrainings);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), createTraining);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateTraining);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteTraining);

export default router;
