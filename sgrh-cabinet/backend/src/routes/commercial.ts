import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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

// Écriture (DRH, DIRECTION_GENERALE, ASSOCIE, MANAGER)
router.post('/', createSubmission);
router.put('/:id', updateSubmission);
router.delete('/:id', deleteSubmission);

export default router;
