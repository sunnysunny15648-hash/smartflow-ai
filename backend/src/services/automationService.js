import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { createNotification } from './notificationService.js';
import { logActivity } from './auditService.js';

/**
 * Evaluate whether an event data object satisfies a rule's conditions
 */
export const evaluateConditions = (conditions, eventData) => {
  if (!conditions || conditions.length === 0) return true;

  for (const cond of conditions) {
    const { field, operator, value } = cond;
    const actualValue = eventData[field];

    switch (operator) {
      case 'equals':
        if (String(actualValue) !== String(value)) return false;
        break;
      case 'not_equals':
        if (String(actualValue) === String(value)) return false;
        break;
      case 'greater_than':
        if (Number(actualValue) <= Number(value)) return false;
        break;
      case 'less_than':
        if (Number(actualValue) >= Number(value)) return false;
        break;
      case 'contains':
        if (!actualValue || !String(actualValue).toLowerCase().includes(String(value).toLowerCase())) {
          return false;
        }
        break;
      default:
        return false;
    }
  }

  return true;
};

/**
 * Execute an action for a matching automation rule
 */
const executeAction = async (action, eventData, organizationId) => {
  const { type, payload = {} } = action;

  switch (type) {
    case 'create_task': {
      const taskData = {
        organization_id: organizationId,
        workflow_id: payload.workflow_id || eventData.workflow_id || null,
        title: payload.title || `Automated Task: ${eventData.title || 'Follow up'}`,
        description: payload.description || 'Created automatically by SmartFlow Automation Engine',
        assigned_to: payload.assigned_to || eventData.assigned_to || null,
        priority: payload.priority || 'medium',
        status: 'to_do',
        due_date: payload.due_date || null,
      };
      const { data, error } = await supabaseAdmin.from('tasks').insert(taskData).select().single();
      if (error) throw error;
      return { action: 'create_task', taskId: data.id };
    }

    case 'assign_task': {
      const taskId = payload.task_id || eventData.id;
      const targetUser = payload.assigned_to;
      if (!taskId || !targetUser) throw new Error('Missing task_id or assigned_to in action payload');

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({ assigned_to: targetUser })
        .eq('id', taskId)
        .eq('organization_id', organizationId)
        .select()
        .single();
      if (error) throw error;

      await createNotification({
        organizationId,
        userId: targetUser,
        title: 'Task Assigned',
        message: `You were assigned to task "${data.title}" by automation.`,
        entityType: 'task',
        entityId: data.id,
      });

      return { action: 'assign_task', taskId, assignedTo: targetUser };
    }

    case 'send_notification': {
      const targetUser = payload.user_id || eventData.assigned_to || eventData.owner_id;
      if (!targetUser) {
        return { action: 'send_notification', skipped: true, reason: 'Target user not resolved' };
      }

      await createNotification({
        organizationId,
        userId: targetUser,
        title: payload.title || 'Automated Alert',
        message: payload.message || `Automated notification triggered for ${eventData.name || eventData.title || 'event'}`,
        entityType: eventData.entityType || 'automation',
        entityId: eventData.id || null,
      });

      return { action: 'send_notification', userId: targetUser };
    }

    case 'request_approval': {
      const approvalData = {
        organization_id: organizationId,
        workflow_id: payload.workflow_id || eventData.workflow_id || null,
        task_id: payload.task_id || eventData.task_id || (eventData.entityType === 'task' ? eventData.id : null),
        requested_by: payload.requested_by || eventData.assigned_to || eventData.owner_id,
        approver_id: payload.approver_id || null,
        title: payload.title || `Approval required: ${eventData.title || eventData.name}`,
        description: payload.description || 'Generated automatically by SmartFlow automation rule',
        request_type: payload.request_type || 'Automation Triggered',
        amount: payload.amount || eventData.amount || null,
        status: 'pending',
      };

      const { data, error } = await supabaseAdmin.from('approvals').insert(approvalData).select().single();
      if (error) throw error;

      if (approvalData.approver_id) {
        await createNotification({
          organizationId,
          userId: approvalData.approver_id,
          title: 'Approval Request',
          message: `New approval request requires review: "${approvalData.title}"`,
          entityType: 'approval',
          entityId: data.id,
        });
      }

      return { action: 'request_approval', approvalId: data.id };
    }

    case 'change_task_status': {
      const taskId = payload.task_id || eventData.id;
      const newStatus = payload.status;
      if (!taskId || !newStatus) throw new Error('Missing task_id or status');

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .eq('organization_id', organizationId)
        .select()
        .single();
      if (error) throw error;

      return { action: 'change_task_status', taskId, newStatus };
    }

    case 'update_workflow_status': {
      const workflowId = payload.workflow_id || eventData.workflow_id || eventData.id;
      const newStatus = payload.status;
      if (!workflowId || !newStatus) throw new Error('Missing workflow_id or status');

      const { data, error } = await supabaseAdmin
        .from('workflows')
        .update({ status: newStatus })
        .eq('id', workflowId)
        .eq('organization_id', organizationId)
        .select()
        .single();
      if (error) throw error;

      return { action: 'update_workflow_status', workflowId, newStatus };
    }

    default:
      throw new Error(`Unsupported automation action type: ${type}`);
  }
};

/**
 * Dispatch an event to all matching automation rules
 * Guaranteed idempotency: Checks automation_executions for (rule_id, event_id)
 */
export const dispatchEvent = async ({ organizationId, triggerType, eventId, eventData = {} }) => {
  if (!organizationId || !triggerType || !eventId) {
    logger.warn('Automation dispatchEvent missing required params', { organizationId, triggerType, eventId });
    return [];
  }

  try {
    // Fetch active rules for this trigger and organization
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('trigger_type', triggerType)
      .eq('is_active', true);

    if (rulesError || !rules || rules.length === 0) {
      return [];
    }

    const executionResults = [];

    for (const rule of rules) {
      // 1. Check idempotency: Has this rule already run for this exact event?
      const { data: existingExecution } = await supabaseAdmin
        .from('automation_executions')
        .select('id, status')
        .eq('rule_id', rule.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingExecution) {
        logger.info(`Automation rule ${rule.id} already processed event ${eventId}, skipping duplicate.`);
        continue;
      }

      // 2. Evaluate conditions
      const matchesConditions = evaluateConditions(rule.conditions, eventData);
      if (!matchesConditions) {
        // Record skipped execution
        await supabaseAdmin.from('automation_executions').insert({
          organization_id: organizationId,
          rule_id: rule.id,
          event_id: eventId,
          status: 'skipped',
          execution_result: { message: 'Conditions not met', conditions: rule.conditions },
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
        continue;
      }

      // 3. Execute actions with failure isolation and retry-safe logging
      const startedAt = new Date().toISOString();
      const actionOutputs = [];
      let executionStatus = 'success';
      let errorMessage = null;

      try {
        for (const action of rule.actions || []) {
          const out = await executeAction(action, eventData, organizationId);
          actionOutputs.push(out);
        }
      } catch (err) {
        executionStatus = 'failed';
        errorMessage = err.message || 'Execution error';
        logger.error(`Automation rule ${rule.id} failed executing actions: ${errorMessage}`, err);
      }

      // 4. Save execution log
      const { data: execRecord } = await supabaseAdmin
        .from('automation_executions')
        .insert({
          organization_id: organizationId,
          rule_id: rule.id,
          event_id: eventId,
          status: executionStatus,
          execution_result: { actions: actionOutputs },
          error_message: errorMessage,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      executionResults.push(execRecord);

      await logActivity({
        organizationId,
        action: `automation.rule_${executionStatus}`,
        entityType: 'automation_rule',
        entityId: rule.id,
        metadata: { ruleName: rule.name, triggerType, eventId, executionStatus },
      });
    }

    return executionResults;
  } catch (error) {
    logger.error(`Fatal error in automation dispatchEvent: ${error.message}`, error);
    return [];
  }
};

