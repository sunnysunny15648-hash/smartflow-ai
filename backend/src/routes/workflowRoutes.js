import { Router } from 'express';
import * as workflowController from '../controllers/workflowController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { WorkflowSchema, WorkflowUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', workflowController.listWorkflows);
router.post('/', requireRole(['admin', 'manager']), validate(WorkflowSchema), workflowController.createWorkflow);
router.get('/:id', workflowController.getWorkflow);
router.patch('/:id', requireRole(['admin', 'manager']), validate(WorkflowUpdateSchema), workflowController.updateWorkflow);
router.delete('/:id', requireRole(['admin']), workflowController.deleteWorkflow);

router.post('/:id/activate', requireRole(['admin', 'manager']), workflowController.activateWorkflow);
router.post('/:id/pause', requireRole(['admin', 'manager']), workflowController.pauseWorkflow);
router.post('/:id/duplicate', requireRole(['admin', 'manager']), workflowController.duplicateWorkflow);

export default router;

