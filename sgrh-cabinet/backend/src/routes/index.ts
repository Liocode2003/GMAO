import { Router } from 'express';
import authRoutes from './auth';
import employeeRoutes from './employees';
import kpiRoutes from './kpis';
import trainingRoutes from './trainings';
import userRoutes from './users';
import reportRoutes from './reports';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/kpis', kpiRoutes);
router.use('/trainings', trainingRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

export default router;
