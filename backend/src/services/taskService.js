import { supabaseAdmin } from '../config/supabase.js';
import { logActivity } from './auditService.js';
import { dispatchEvent } from './automationService.js';
import { createNotification } from './notificationService.js';

export const listTasks = async (organizationId, filters = {}) => {
  let query = supabaseAdmin
    .from('tasks')
    .select(`
      *,
      workflows (id, name),
      profiles:assigned_to (id, full_name, email, avatar_url),
      creator:created_by (id, full_name, email)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.workflow_id) query = query.eq('workflow_id', filters.workflow_id);
  if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getTaskById = async (taskId, organizationId) => {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(`
      *,
      workflows (id, name, status),
      profiles:assigned_to (id, full_name, email, avatar_url),
      creator:created_by (id, full_name, email),
      task_comments (
        id, comment, created_at,
        profiles (id, full_name, avatar_url)
      ),
      task_attachments (*)
    `)
    .eq('id', taskId)
    .eq('organization_id', organizationId)
    .single();

  if (error) throw error;
  return data;
};

export const createTask = async (taskData, organizationId, userId) => {
  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      ...taskData,
      organization_id: organizationId,
      created_by: userId,
      status: taskData.status || 'to_do',
    })
    .select(`
      *,
      workflows (id, name),
      profiles:assigned_to (id, full_name, email)
    `)
    .single();

  if (error) throw error;

  // Notify assignee
  if (task.assigned_to && task.assigned_to !== userId) {
    await createNotification({
      organizationId,
      userId: task.assigned_to,
      title: 'New Task Assigned',
      message: `You were assigned to: "${task.title}"`,
      entityType: 'task',
      entityId: task.id,
    });
  }

  // Audit
  await logActivity({
    organizationId,
    userId,
    action: 'task.created',
    entityType: 'task',
    entityId: task.id,
    metadata: { title: task.title, priority: task.priority, status: task.status },
  });

  // Automation event
  await dispatchEvent({
    organizationId,
    triggerType: 'task_created',
    eventId: `task_create_${task.id}_${Date.now()}`,
    eventData: { ...task, entityType: 'task' },
  });

  return task;
};

export const updateTask = async (taskId, organizationId, updateData, userId) => {
  const previous = await getTaskById(taskId, organizationId);
  if (!previous) throw new Error('Task not found');

  const finalUpdate = { ...updateData };
  if (updateData.status === 'completed' && previous.status !== 'completed') {
    finalUpdate.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .update(finalUpdate)
    .eq('id', taskId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      workflows (id, name),
      profiles:assigned_to (id, full_name, email)
    `)
    .single();

  if (error) throw error;

  // Check if assigned user changed
  if (finalUpdate.assigned_to && finalUpdate.assigned_to !== previous.assigned_to) {
    await createNotification({
      organizationId,
      userId: finalUpdate.assigned_to,
      title: 'Task Reassigned',
      message: `Task "${task.title}" was assigned to you.`,
      entityType: 'task',
      entityId: task.id,
    });
  }

  // Audit
  await logActivity({
    organizationId,
    userId,
    action: 'task.updated',
    entityType: 'task',
    entityId: task.id,
    metadata: { from: previous.status, to: task.status, fields: Object.keys(updateData) },
  });

  // If completed, trigger event
  if (task.status === 'completed' && previous.status !== 'completed') {
    await dispatchEvent({
      organizationId,
      triggerType: 'task_completed',
      eventId: `task_complete_${task.id}_${Date.now()}`,
      eventData: { ...task, entityType: 'task' },
    });
  }

  return task;
};

export const deleteTask = async (taskId, organizationId, userId) => {
  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('organization_id', organizationId);

  if (error) throw error;

  await logActivity({
    organizationId,
    userId,
    action: 'task.deleted',
    entityType: 'task',
    entityId: taskId,
  });

  return true;
};

export const addTaskComment = async (taskId, commentText, organizationId, userId) => {
  const { data: comment, error } = await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      comment: commentText,
    })
    .select(`
      *,
      profiles (id, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;

  // Notify task assignee if someone else commented
  const task = await getTaskById(taskId, organizationId);
  if (task && task.assigned_to && task.assigned_to !== userId) {
    await createNotification({
      organizationId,
      userId: task.assigned_to,
      title: 'New Comment on Task',
      message: `A new comment was added to "${task.title}".`,
      entityType: 'task',
      entityId: taskId,
    });
  }

  return comment;
};

export const addTaskAttachment = async (attachmentData, organizationId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('task_attachments')
    .insert({
      ...attachmentData,
      organization_id: organizationId,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

