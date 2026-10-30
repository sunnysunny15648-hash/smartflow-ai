import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { sendError } from '../utils/response.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required: missing Bearer token', [], 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing', [], 401);
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return sendError(res, 'Invalid or expired authentication session', [authError?.message || 'Unauthorized'], 401);
    }

    req.user = user;
    req.token = token;
    req.userClient = createUserClient(token);

    // Resolve organization context
    const requestedOrgId = req.headers['x-organization-id'];

    if (requestedOrgId) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .select('id, organization_id, role, department_id, is_active')
        .eq('organization_id', requestedOrgId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError || !member) {
        return sendError(res, 'Access forbidden: You do not belong to the requested organization', [], 403);
      }

      req.organizationId = member.organization_id;
      req.memberRole = member.role;
      req.departmentId = member.department_id;
    } else {
      // Find the first active organization user belongs to
      const { data: memberships } = await supabaseAdmin
        .from('organization_members')
        .select('id, organization_id, role, department_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (memberships && memberships.length > 0) {
        req.organizationId = memberships[0].organization_id;
        req.memberRole = memberships[0].role;
        req.departmentId = memberships[0].department_id;
      } else {
        req.organizationId = null;
        req.memberRole = null;
        req.departmentId = null;
      }
    }

    next();
  } catch (err) {
    return sendError(res, 'Authentication verification failed', [err.message], 401);
  }
};

// Require active organization context for org-scoped endpoints
export const requireOrganization = (req, res, next) => {
  if (!req.organizationId) {
    return sendError(res, 'Active organization context required. Please select or create an organization.', [], 400);
  }
  next();
};

