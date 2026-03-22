import { Router } from 'express';
import { login, logout, refresh, getProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, changePassword);

export default router;
