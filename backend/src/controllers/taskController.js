import * as taskService from '../services/taskService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listTasks = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      workflow_id: req.query.workflow_id,
      assigned_to: req.query.assigned_to,
      search: req.query.search,
    };
    const tasks = await taskService.listTasks(req.organizationId, filters);
    return sendSuccess(res, 'Tasks retrieved', tasks);
  } catch (err) {
    return sendError(res, 'Error fetching tasks', [err.message], 500);
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.organizationId, req.user.id);
    return sendSuccess(res, 'Task created successfully', task, 201);
  } catch (err) {
    return sendError(res, 'Error creating task', [err.message], 400);
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.organizationId);
    if (!task) return sendError(res, 'Task not found', [], 404);
    return sendSuccess(res, 'Task retrieved', task);
  } catch (err) {
    return sendError(res, 'Error retrieving task', [err.message], 500);
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.organizationId, req.body, req.user.id);
    return sendSuccess(res, 'Task updated successfully', task);
  } catch (err) {
    return sendError(res, 'Error updating task', [err.message], 400);
  }
};

export const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.organizationId, req.user.id);
    return sendSuccess(res, 'Task deleted successfully');
  } catch (err) {
    return sendError(res, 'Error deleting task', [err.message], 400);
  }
};

export const getComments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('task_comments')
      .select(`
        *,
        profiles (id, full_name, avatar_url)
      `)
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) return sendError(res, error.message, [], 500);
    return sendSuccess(res, 'Comments retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching comments', [err.message], 500);
  }
};

export const addComment = async (req, res) => {
  try {
    const comment = await taskService.addTaskComment(
      req.params.id,
      req.body.comment,
      req.organizationId,
      req.user.id
    );
    return sendSuccess(res, 'Comment added', comment, 201);
  } catch (err) {
    return sendError(res, 'Error adding comment', [err.message], 400);
  }
};

export const addAttachment = async (req, res) => {
  try {
    const attachment = await taskService.addTaskAttachment(
      {
        task_id: req.params.id,
        file_name: req.body.file_name,
        storage_path: req.body.storage_path,
        mime_type: req.body.mime_type,
        file_size: req.body.file_size,
      },
      req.organizationId,
      req.user.id
    );
    return sendSuccess(res, 'Attachment recorded', attachment, 201);
  } catch (err) {
    return sendError(res, 'Error adding attachment', [err.message], 400);
  }
};

