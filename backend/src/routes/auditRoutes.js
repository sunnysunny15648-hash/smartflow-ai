import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(requireAuth, requireOrganization, requireRole(['admin', 'manager']));

router.get('/', auditController.listAuditLogs);

export default router;

