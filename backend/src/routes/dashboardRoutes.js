import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/overview', dashboardController.getOverview);
router.get('/productivity', dashboardController.getProductivity);
router.get('/workflow-performance', dashboardController.getWorkflowPerformance);
router.get('/recent-activities', dashboardController.getRecentActivities);

export default router;

