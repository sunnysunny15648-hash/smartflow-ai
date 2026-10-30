import { supabaseAdmin } from '../config/supabase.js';
import { logActivity } from './auditService.js';
import { dispatchEvent } from './automationService.js';
import { createNotification } from './notificationService.js';

export const listWorkflows = async (organizationId, filters = {}) => {
  let query = supabaseAdmin
    .from('workflows')
    .select(`
      *,
      departments (id, name),
      profiles:owner_id (id, full_name, email, avatar_url),
      workflow_steps (id, title, status, step_order, assigned_to)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.department_id) query = query.eq('department_id', filters.department_id);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getWorkflowById = async (workflowId, organizationId) => {
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .select(`
      *,
      departments (id, name),
      profiles:owner_id (id, full_name, email, avatar_url),
      workflow_steps (*),
      tasks (id, title, status, priority, due_date, assigned_to)
    `)
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .single();

  if (error) throw error;
  return data;
};

export const createWorkflow = async (workflowData, organizationId, userId) => {
  const { steps = [], ...coreData } = workflowData;

  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .insert({
      ...coreData,
      organization_id: organizationId,
      owner_id: coreData.owner_id || userId,
      status: coreData.status || 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Insert steps if provided
  let createdSteps = [];
  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((s, index) => ({
      workflow_id: workflow.id,
      title: s.title || s.step_name,
      description: s.description || '',
      step_order: s.step_order !== undefined ? s.step_order : index + 1,
      assigned_to: s.assigned_to || null,
      status: s.status || 'pending',
    }));

    const { data: stepData, error: stepError } = await supabaseAdmin
      .from('workflow_steps')
      .insert(stepsToInsert)
      .select();

    if (!stepError) {
      createdSteps = stepData;
      // Notify assigned employees
      for (const step of stepData) {
        if (step.assigned_to && step.assigned_to !== userId) {
          await createNotification({
            organizationId,
            userId: step.assigned_to,
            title: 'Assigned to Workflow Step',
            message: `You were assigned to step "${step.title}" in workflow "${workflow.name}".`,
            entityType: 'workflow',
            entityId: workflow.id,
          });
        }
      }
    }
  }

  // Audit log
  await logActivity({
    organizationId,
    userId,
    action: 'workflow.created',
    entityType: 'workflow',
    entityId: workflow.id,
    metadata: { name: workflow.name, category: workflow.category, priority: workflow.priority },
  });

  // Dispatch automation event
  await dispatchEvent({
    organizationId,
    triggerType: 'workflow_created',
    eventId: `wf_create_${workflow.id}_${Date.now()}`,
    eventData: { ...workflow, steps: createdSteps, entityType: 'workflow' },
  });

  return { ...workflow, steps: createdSteps };
};

export const updateWorkflow = async (workflowId, organizationId, updateData, userId) => {
  const { steps, ...coreData } = updateData;

  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .update(coreData)
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    organizationId,
    userId,
    action: 'workflow.updated',
    entityType: 'workflow',
    entityId: workflow.id,
    metadata: updateData,
  });

  if (coreData.status === 'completed') {
    await dispatchEvent({
      organizationId,
      triggerType: 'workflow_completed',
      eventId: `wf_complete_${workflow.id}_${Date.now()}`,
      eventData: { ...workflow, entityType: 'workflow' },
    });
  }

  return workflow;
};

export const deleteWorkflow = async (workflowId, organizationId, userId) => {
  const { error } = await supabaseAdmin
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('organization_id', organizationId);

  if (error) throw error;

  await logActivity({
    organizationId,
    userId,
    action: 'workflow.deleted',
    entityType: 'workflow',
    entityId: workflowId,
  });

  return true;
};

export const duplicateWorkflow = async (workflowId, organizationId, userId) => {
  const original = await getWorkflowById(workflowId, organizationId);
  if (!original) throw new Error('Original workflow not found');

  const newWorkflow = {
    name: `${original.name} (Copy)`,
    description: original.description,
    category: original.category,
    priority: original.priority,
    department_id: original.department_id,
    status: 'draft',
    steps: (original.workflow_steps || []).map((s) => ({
      title: s.title,
      description: s.description,
      step_order: s.step_order,
      assigned_to: s.assigned_to,
      status: 'pending',
    })),
  };

  return createWorkflow(newWorkflow, organizationId, userId);
};

