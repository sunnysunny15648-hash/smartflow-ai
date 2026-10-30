import { Router } from 'express';
import authRoutes from './authRoutes.js';
import organizationRoutes from './organizationRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import taskRoutes from './taskRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import automationRoutes from './automationRoutes.js';
import aiRoutes from './aiRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/departments', departmentRoutes);
router.use('/workflows', workflowRoutes);
router.use('/tasks', taskRoutes);
router.use('/approvals', approvalRoutes);
router.use('/automation', automationRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activity-logs', auditRoutes);

export default router;

