import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listPayslips, getPayslip, previewPayslip,
  createPayslip, updatePayslip, publishPayslip,
  downloadPayslipPDF, deletePayslip,
} from '../controllers/payslipController';

const router = Router();
router.use(authenticate);

// Lecture — tous les employés authentifiés (filtrage par rôle dans le contrôleur)
router.get('/', listPayslips);
router.get('/:id', getPayslip);
router.get('/:id/pdf', downloadPayslipPDF);

// Calcul en temps réel (DRH uniquement)
router.post('/preview', authorize('DRH'), previewPayslip);

// Écriture — DRH uniquement
router.post('/', authorize('DRH'), createPayslip);
router.put('/:id', authorize('DRH'), updatePayslip);
router.patch('/:id/publish', authorize('DRH'), publishPayslip);
router.delete('/:id', authorize('DRH'), deletePayslip);

export default router;
