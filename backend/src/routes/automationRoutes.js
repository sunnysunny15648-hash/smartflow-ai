import { Router } from 'express';
import * as automationController from '../controllers/automationController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { AutomationRuleSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/rules', automationController.listRules);
router.post('/rules', requireRole(['admin', 'manager']), validate(AutomationRuleSchema), automationController.createRule);
router.get('/rules/:id', automationController.getRule);
router.patch('/rules/:id', requireRole(['admin', 'manager']), validate(AutomationRuleSchema.partial()), automationController.updateRule);
router.delete('/rules/:id', requireRole(['admin', 'manager']), automationController.deleteRule);

router.post('/rules/:id/activate', requireRole(['admin', 'manager']), automationController.activateRule);
router.post('/rules/:id/deactivate', requireRole(['admin', 'manager']), automationController.deactivateRule);

router.get('/executions', requireRole(['admin', 'manager']), automationController.listExecutions);

export default router;

