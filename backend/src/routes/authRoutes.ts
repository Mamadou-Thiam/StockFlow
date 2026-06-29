import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, authRules } from '../middleware/validate';

const router = Router();

router.post('/register', authRules, validate, register);
router.post('/login', authRules, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
