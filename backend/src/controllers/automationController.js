import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/auditService.js';

export const listRules = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .select(`
        *,
        creator:created_by (id, full_name, email)
      `)
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false });

    if (error) return sendError(res, error.message, [], 500);
    return sendSuccess(res, 'Automation rules retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching automation rules', [err.message], 500);
  }
};

export const createRule = async (req, res) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .insert({
        ...req.body,
        organization_id: req.organizationId,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) return sendError(res, 'Failed to create automation rule', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'automation.rule_created',
      entityType: 'automation_rule',
      entityId: rule.id,
      metadata: { name: rule.name, trigger: rule.trigger_type },
    });

    return sendSuccess(res, 'Automation rule created successfully', rule, 201);
  } catch (err) {
    return sendError(res, 'Error creating rule', [err.message], 400);
  }
};

export const getRule = async (req, res) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .single();

    if (error || !rule) return sendError(res, 'Automation rule not found', [], 404);
    return sendSuccess(res, 'Automation rule retrieved', rule);
  } catch (err) {
    return sendError(res, 'Error retrieving rule', [err.message], 500);
  }
};

export const updateRule = async (req, res) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) return sendError(res, 'Failed to update rule', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'automation.rule_updated',
      entityType: 'automation_rule',
      entityId: rule.id,
      metadata: req.body,
    });

    return sendSuccess(res, 'Automation rule updated successfully', rule);
  } catch (err) {
    return sendError(res, 'Error updating rule', [err.message], 400);
  }
};

export const deleteRule = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('automation_rules')
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId);

    if (error) return sendError(res, 'Failed to delete rule', [error.message], 400);

    await logActivity({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'automation.rule_deleted',
      entityType: 'automation_rule',
      entityId: req.params.id,
    });

    return sendSuccess(res, 'Automation rule deleted successfully');
  } catch (err) {
    return sendError(res, 'Error deleting rule', [err.message], 500);
  }
};

export const activateRule = async (req, res) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .update({ is_active: true })
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) return sendError(res, error.message, [], 400);
    return sendSuccess(res, 'Rule activated', rule);
  } catch (err) {
    return sendError(res, 'Error activating rule', [err.message], 500);
  }
};

export const deactivateRule = async (req, res) => {
  try {
    const { data: rule, error } = await supabaseAdmin
      .from('automation_rules')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .select()
      .single();

    if (error) return sendError(res, error.message, [], 400);
    return sendSuccess(res, 'Rule deactivated', rule);
  } catch (err) {
    return sendError(res, 'Error deactivating rule', [err.message], 500);
  }
};

export const listExecutions = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('automation_executions')
      .select(`
        *,
        automation_rules (id, name, trigger_type)
      `)
      .eq('organization_id', req.organizationId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (req.query.rule_id) {
      query = query.eq('rule_id', req.query.rule_id);
    }

    const { data, error } = await query;
    if (error) return sendError(res, error.message, [], 500);
    return sendSuccess(res, 'Automation executions retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching automation logs', [err.message], 500);
  }
};

