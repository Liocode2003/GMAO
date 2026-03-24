import { Router } from 'express';
import { listTrainings, createTraining, updateTraining, deleteTraining } from '../controllers/trainingController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTrainingSchema, updateTrainingSchema } from '../schemas/trainingSchemas';

const router = Router();
router.use(authenticate);

router.get('/', listTrainings);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), validate(createTrainingSchema), createTraining);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), validate(updateTrainingSchema), updateTraining);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteTraining);

export default router;
