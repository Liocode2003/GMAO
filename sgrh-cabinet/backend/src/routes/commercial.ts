import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listSubmissions,
  getStats,
  getDashboardWidget,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  exportExcel,
  exportPDF,
} from '../controllers/commercialController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Lecture (tous les rôles connectés)
router.get('/', listSubmissions);
router.get('/stats', getStats);
router.get('/dashboard-widget', getDashboardWidget);

// Exports
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

// Écriture (DRH, ASSOCIE, MANAGER — pas DIRECTION_GENERALE)
router.post('/', authorize('DRH', 'ASSOCIE', 'MANAGER'), createSubmission);
router.put('/:id', authorize('DRH', 'ASSOCIE', 'MANAGER'), updateSubmission);
router.delete('/:id', authorize('DRH', 'ASSOCIE', 'MANAGER'), deleteSubmission);

export default router;
