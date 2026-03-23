import { Router } from 'express';
import authRoutes from './auth';
import employeeRoutes from './employees';
import kpiRoutes from './kpis';
import trainingRoutes from './trainings';
import userRoutes from './users';
import reportRoutes from './reports';
import leavesRoutes from './leaves';
import commercialRoutes from './commercial';
import notificationsRoutes from './notifications';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/kpis', kpiRoutes);
router.use('/trainings', trainingRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/leaves', leavesRoutes);
router.use('/commercial', commercialRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
