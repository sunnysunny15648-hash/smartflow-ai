import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMe = async (req, res) => {
  try {
    const user = req.user;

    // Fetch profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      return sendError(res, 'Profile not found', [profileErr.message], 404);
    }

    // Fetch user organizations
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('organization_members')
      .select(`
        id, role, department_id, is_active, joined_at,
        organizations (id, name, slug, description)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (memErr) {
      return sendError(res, 'Failed to fetch organizations', [memErr.message], 500);
    }

    const organizations = (memberships || []).map((m) => ({
      membershipId: m.id,
      role: m.role,
      departmentId: m.department_id,
      ...m.organizations,
    }));

    return sendSuccess(res, 'User profile fetched successfully', {
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name,
        avatarUrl: profile?.avatar_url,
      },
      currentOrganizationId: req.organizationId,
      currentRole: req.memberRole,
      organizations,
    });
  } catch (err) {
    return sendError(res, 'Error fetching user profile', [err.message], 500);
  }
};

export const verifyAuth = async (req, res) => {
  return sendSuccess(res, 'Token is valid', {
    userId: req.user.id,
    email: req.user.email,
    organizationId: req.organizationId,
    role: req.memberRole,
  });
};

export const logout = async (req, res) => {
  return sendSuccess(res, 'Successfully logged out');
};

