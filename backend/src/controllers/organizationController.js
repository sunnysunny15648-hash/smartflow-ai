import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/auditService.js';

export const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create Organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        slug,
        description: description || '',
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      return sendError(res, 'Failed to create organization', [orgError.message], 400);
    }

    // 2. Add creator as Admin member
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'admin',
        is_active: true,
      });

    if (memberError) {
      return sendError(res, 'Failed to assign owner admin role', [memberError.message], 500);
    }

    // 3. Seed default departments
    const defaultDepartments = [
      { organization_id: org.id, name: 'Operations', description: 'Core business operations and project logistics' },
      { organization_id: org.id, name: 'Human Resources', description: 'Employee onboarding, relations, and policies' },
      { organization_id: org.id, name: 'Finance', description: 'Invoices, approvals, and budget allocation' },
      { organization_id: org.id, name: 'IT & Engineering', description: 'Technical support, security, and dev operations' },
    ];
    await supabaseAdmin.from('departments').insert(defaultDepartments);

    // 4. Audit log
    await logActivity({
      organizationId: org.id,
      userId,
      action: 'organization.created',
      entityType: 'organization',
      entityId: org.id,
      metadata: { name: org.name, slug: org.slug },
    });

    return sendSuccess(res, 'Organization created successfully', org, 201);
  } catch (err) {
    return sendError(res, 'Internal server error creating organization', [err.message], 500);
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        role, department_id, joined_at,
        organizations (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) return sendError(res, error.message, [], 500);

    const orgs = (data || []).map((m) => ({
      ...m.organizations,
      userRole: m.role,
      userDepartmentId: m.department_id,
      joinedAt: m.joined_at,
    }));

    return sendSuccess(res, 'Organizations retrieved successfully', orgs);
  } catch (err) {
    return sendError(res, 'Failed to retrieve organizations', [err.message], 500);
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !org) return sendError(res, 'Organization not found', [], 404);

    return sendSuccess(res, 'Organization details retrieved', org);
  } catch (err) {
    return sendError(res, 'Error retrieving organization', [err.message], 500);
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, 'Failed to update organization', [error.message], 400);

    await logActivity({
      organizationId: id,
      userId: req.user.id,
      action: 'organization.updated',
      entityType: 'organization',
      entityId: id,
      metadata: { name, description },
    });

    return sendSuccess(res, 'Organization updated successfully', org);
  } catch (err) {
    return sendError(res, 'Error updating organization', [err.message], 500);
  }
};

export const getMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        id, role, is_active, joined_at, department_id,
        profiles (id, full_name, email, avatar_url),
        departments (id, name)
      `)
      .eq('organization_id', id);

    if (error) return sendError(res, error.message, [], 500);

    return sendSuccess(res, 'Members retrieved successfully', data || []);
  } catch (err) {
    return sendError(res, 'Error retrieving members', [err.message], 500);
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const { email, role, department_id } = req.body;

    // Check if user already has a profile with this email
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();

    let targetUserId = existingProfile?.id;

    if (!targetUserId) {
      return sendError(
        res,
        `No registered user found with email "${email}". Please ask the user to sign up for SmartFlow AI first so you can invite them.`,
        [],
        404
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.is_active) {
        return sendError(res, 'User is already an active member of this organization', [], 400);
      }
      // Re-activate member
      const { data: reactivated, error: reactErr } = await supabaseAdmin
        .from('organization_members')
        .update({ is_active: true, role, department_id: department_id || null })
        .eq('id', existingMember.id)
        .select()
        .single();

      if (reactErr) return sendError(res, reactErr.message, [], 500);
      return sendSuccess(res, 'Member reactivated successfully', reactivated);
    }

    // Add member
    const { data: newMember, error: addErr } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: targetUserId,
        role,
        department_id: department_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (addErr) return sendError(res, 'Failed to add member', [addErr.message], 500);

    await logActivity({
      organizationId,
      userId: req.user.id,
      action: 'organization.member_added',
      entityType: 'organization_member',
      entityId: newMember.id,
      metadata: { targetUserEmail: email, role, department_id },
    });

    return sendSuccess(res, 'Member added successfully', newMember, 201);
  } catch (err) {
    return sendError(res, 'Error inviting member', [err.message], 500);
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id: organizationId, memberId } = req.params;
    const { role, department_id, is_active } = req.body;

    const { data: member, error } = await supabaseAdmin
      .from('organization_members')
      .update({ role, department_id, is_active })
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) return sendError(res, 'Failed to update member', [error.message], 400);

    await logActivity({
      organizationId,
      userId: req.user.id,
      action: 'organization.member_updated',
      entityType: 'organization_member',
      entityId: memberId,
      metadata: { role, department_id, is_active },
    });

    return sendSuccess(res, 'Member updated successfully', member);
  } catch (err) {
    return sendError(res, 'Error updating member', [err.message], 500);
  }
};

