import * as workflowService from '../services/workflowService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listWorkflows = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      department_id: req.query.department_id,
      search: req.query.search,
    };
    const workflows = await workflowService.listWorkflows(req.organizationId, filters);
    return sendSuccess(res, 'Workflows retrieved', workflows);
  } catch (err) {
    return sendError(res, 'Error fetching workflows', [err.message], 500);
  }
};

export const createWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body, req.organizationId, req.user.id);
    return sendSuccess(res, 'Workflow created successfully', workflow, 201);
  } catch (err) {
    return sendError(res, 'Error creating workflow', [err.message], 400);
  }
};

export const getWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.organizationId);
    if (!workflow) return sendError(res, 'Workflow not found', [], 404);
    return sendSuccess(res, 'Workflow retrieved', workflow);
  } catch (err) {
    return sendError(res, 'Error retrieving workflow', [err.message], 500);
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.organizationId, req.body, req.user.id);
    return sendSuccess(res, 'Workflow updated successfully', workflow);
  } catch (err) {
    return sendError(res, 'Error updating workflow', [err.message], 400);
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.organizationId, req.user.id);
    return sendSuccess(res, 'Workflow deleted successfully');
  } catch (err) {
    return sendError(res, 'Error deleting workflow', [err.message], 400);
  }
};

export const activateWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(
      req.params.id,
      req.organizationId,
      { status: 'active' },
      req.user.id
    );
    return sendSuccess(res, 'Workflow activated successfully', workflow);
  } catch (err) {
    return sendError(res, 'Error activating workflow', [err.message], 400);
  }
};

export const pauseWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(
      req.params.id,
      req.organizationId,
      { status: 'on_hold' },
      req.user.id
    );
    return sendSuccess(res, 'Workflow paused successfully', workflow);
  } catch (err) {
    return sendError(res, 'Error pausing workflow', [err.message], 400);
  }
};

export const duplicateWorkflow = async (req, res) => {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.organizationId, req.user.id);
    return sendSuccess(res, 'Workflow duplicated successfully', workflow, 201);
  } catch (err) {
    return sendError(res, 'Error duplicating workflow', [err.message], 400);
  }
};

