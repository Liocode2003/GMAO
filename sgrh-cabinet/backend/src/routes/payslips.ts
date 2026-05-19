import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listPayslips, getPayslip, previewPayslip,
  createPayslip, updatePayslip, publishPayslip,
  downloadPayslipPDF, deletePayslip,
  getMasseSalariale, getAnnualSummary, downloadAttestation,
  exportMasseSalarialeExcel,
} from '../controllers/payslipController';

const router = Router();
router.use(authenticate);
// Seuls DRH et ADG utilisent l'application
router.use(authorize('DRH', 'DIRECTION_GENERALE'));

// Agrégats & rapports (AVANT les routes paramétrées pour éviter les conflits)
router.get('/masse-salariale', getMasseSalariale);
router.get('/masse-salariale/export', exportMasseSalarialeExcel);
router.get('/employee/:id/annual', getAnnualSummary);
router.get('/employee/:id/attestation', downloadAttestation);

// Lecture
router.get('/', listPayslips);
router.get('/:id', getPayslip);
router.get('/:id/pdf', downloadPayslipPDF);

// Calcul en temps réel + écriture — DRH uniquement
router.post('/preview', authorize('DRH'), previewPayslip);
router.post('/', authorize('DRH'), createPayslip);
router.put('/:id', authorize('DRH'), updatePayslip);
router.patch('/:id/publish', authorize('DRH'), publishPayslip);
router.delete('/:id', authorize('DRH'), deletePayslip);

export default router;
