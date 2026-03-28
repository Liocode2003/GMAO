import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listDocuments, uploadDocument, downloadDocument, deleteDocument, uploadDoc,
} from '../controllers/documentsController';

const router = Router();
router.use(authenticate);

router.get('/employee/:employee_id', listDocuments);
router.post('/employee/:employee_id',
  authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'),
  uploadDoc.single('file'),
  uploadDocument
);
router.get('/:id/download', downloadDocument);
router.delete('/:id', authorize('DRH', 'DIRECTION_GENERALE'), deleteDocument);

export default router;
