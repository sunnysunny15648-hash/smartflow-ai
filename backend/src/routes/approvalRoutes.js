import { Router } from 'express';
import * as approvalController from '../controllers/approvalController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ApprovalSchema, ApprovalDecisionSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', approvalController.listApprovals);
router.post('/', validate(ApprovalSchema), approvalController.createApproval);
router.get('/:id', approvalController.getApproval);

router.post('/:id/approve', requireRole(['admin', 'manager']), validate(ApprovalDecisionSchema), approvalController.approveRequest);
router.post('/:id/reject', requireRole(['admin', 'manager']), validate(ApprovalDecisionSchema), approvalController.rejectRequest);
router.post('/:id/request-information', requireRole(['admin', 'manager']), validate(ApprovalDecisionSchema), approvalController.requestInformation);

export default router;

