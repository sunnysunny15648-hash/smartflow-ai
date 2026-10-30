import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', notificationController.listNotifications);
router.patch('/:id/read', notificationController.markRead);
router.post('/read-all', notificationController.markAllRead);

export default router;

