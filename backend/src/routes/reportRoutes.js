import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ReportGenerateSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', reportController.listReports);
router.post('/generate', requireRole(['admin', 'manager']), validate(ReportGenerateSchema), reportController.generateReport);
router.get('/:id', reportController.getReport);
router.get('/:id/export', reportController.exportReport);

export default router;

