import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { TaskSchema, TaskUpdateSchema, TaskCommentSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', taskController.listTasks);
router.post('/', requireRole(['admin', 'manager', 'employee']), validate(TaskSchema), taskController.createTask);
router.get('/:id', taskController.getTask);
router.patch('/:id', validate(TaskUpdateSchema), taskController.updateTask);
router.delete('/:id', requireRole(['admin', 'manager']), taskController.deleteTask);

router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', validate(TaskCommentSchema), taskController.addComment);
router.post('/:id/attachments', taskController.addAttachment);

export default router;

