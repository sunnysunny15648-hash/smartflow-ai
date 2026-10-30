import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/auditService.js';

export const listDepartments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select(`
        *,
        organization_members (count)
      `)
      .eq('organization_id', req.organizationId)
      .order('name', { ascending: true });

    if (error) return sendError(res, error.message, [], 500);

    return sendSuccess(res, 'Departments retrieved successfully', data || []);
  } catch (err) {
    return sendError(res, 'Error retrieving departments', [err.message], 500);
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    const { data: dept, error } = await supabaseAdmin
      .from('departments')
      .insert({
        organization_id: req.organizationId,
        name,
        description: description || '',
      })
      .select()
      .single();

    if (error) return sendError(res, 'Failed to create department', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'department.created',
      entityType: 'department',
      entityId: dept.id,
      metadata: { name },
    });

    return sendSuccess(res, 'Department created successfully', dept, 201);
  } catch (err) {
    return sendError(res, 'Error creating department', [err.message], 500);
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { data: dept, error } = await supabaseAdmin
      .from('departments')
      .update({ name, description })
      .eq('id', id)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) return sendError(res, 'Failed to update department', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'department.updated',
      entityType: 'department',
      entityId: id,
      metadata: { name },
    });

    return sendSuccess(res, 'Department updated successfully', dept);
  } catch (err) {
    return sendError(res, 'Error updating department', [err.message], 500);
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.organizationId);

    if (error) return sendError(res, 'Failed to delete department', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'department.deleted',
      entityType: 'department',
      entityId: id,
    });

    return sendSuccess(res, 'Department deleted successfully');
  } catch (err) {
    return sendError(res, 'Error deleting department', [err.message], 500);
  }
};

