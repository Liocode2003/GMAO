import { Router, Request, Response, NextFunction } from 'express';
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

// Multer validation errors → 400
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(400).json({ error: err.message });
});

export default router;
