import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AIChatSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.post('/workflow-suggestions', aiController.workflowSuggestions);
router.post('/task-generation', aiController.taskGeneration);
router.post('/analyze-workflow', aiController.analyzeWorkflow);
router.post('/report-summary', aiController.reportSummary);
router.post('/chat', validate(AIChatSchema), aiController.chat);

export default router;

