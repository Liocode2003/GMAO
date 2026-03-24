import { Router } from 'express';
import { login, logout, refresh, getProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '../schemas/authSchemas';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
