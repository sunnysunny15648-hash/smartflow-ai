import { Router } from 'express';
import * as deptController from '../controllers/departmentController.js';
import { requireAuth, requireOrganization } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { DepartmentSchema } from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', deptController.listDepartments);
router.post('/', requireRole(['admin', 'manager']), validate(DepartmentSchema), deptController.createDepartment);
router.patch('/:id', requireRole(['admin', 'manager']), validate(DepartmentSchema.partial()), deptController.updateDepartment);
router.delete('/:id', requireRole(['admin']), deptController.deleteDepartment);

export default router;

