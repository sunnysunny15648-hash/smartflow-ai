import { Router } from 'express';
import * as orgController from '../controllers/organizationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { OrganizationSchema, MemberInviteSchema, MemberUpdateSchema } from '../validators/schemas.js';

const router = Router();

// List user's organizations
router.get('/', requireAuth, orgController.getOrganizations);

// Create new organization (any authenticated user can create an org)
router.post('/', requireAuth, validate(OrganizationSchema), orgController.createOrganization);

// Get specific organization details
router.get('/:id', requireAuth, orgController.getOrganizationById);

// Update organization (Admin only)
router.patch('/:id', requireAuth, requireRole(['admin']), validate(OrganizationSchema.partial()), orgController.updateOrganization);

// List organization members
router.get('/:id/members', requireAuth, orgController.getMembers);

// Invite new member (Admin only)
router.post('/:id/invitations', requireAuth, requireRole(['admin']), validate(MemberInviteSchema), orgController.inviteMember);

// Update member role/status (Admin only)
router.patch('/:id/members/:memberId', requireAuth, requireRole(['admin']), validate(MemberUpdateSchema), orgController.updateMember);

export default router;

