import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, authController.getMe);
router.post('/verify', requireAuth, authController.verifyAuth);
router.post('/logout', requireAuth, authController.logout);

export default router;

