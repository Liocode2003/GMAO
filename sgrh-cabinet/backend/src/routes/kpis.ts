import { Router } from 'express';
import { getDashboard, getKPIs, getMonthlyKPIs } from '../controllers/kpiController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/', getKPIs);
router.get('/monthly', getMonthlyKPIs);

export default router;
