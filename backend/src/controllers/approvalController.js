import * as approvalService from '../services/approvalService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listApprovals = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      request_type: req.query.request_type,
      requested_by: req.query.requested_by,
      approver_id: req.query.approver_id,
    };
    const approvals = await approvalService.listApprovals(req.organizationId, filters);
    return sendSuccess(res, 'Approvals retrieved', approvals);
  } catch (err) {
    return sendError(res, 'Error fetching approvals', [err.message], 500);
  }
};

export const createApproval = async (req, res) => {
  try {
    const approval = await approvalService.createApproval(req.body, req.organizationId, req.user.id);
    return sendSuccess(res, 'Approval request submitted successfully', approval, 201);
  } catch (err) {
    return sendError(res, 'Error creating approval request', [err.message], 400);
  }
};

export const getApproval = async (req, res) => {
  try {
    const approval = await approvalService.getApprovalById(req.params.id, req.organizationId);
    if (!approval) return sendError(res, 'Approval not found', [], 404);
    return sendSuccess(res, 'Approval details retrieved', approval);
  } catch (err) {
    return sendError(res, 'Error retrieving approval', [err.message], 500);
  }
};

export const approveRequest = async (req, res) => {
  try {
    const updated = await approvalService.decideApproval({
      approvalId: req.params.id,
      organizationId: req.organizationId,
      decision: 'approved',
      comment: req.body.decision_comment || 'Approved',
      userId: req.user.id,
      userRole: req.memberRole,
    });
    return sendSuccess(res, 'Request approved successfully', updated);
  } catch (err) {
    return sendError(res, err.message, [], 400);
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const updated = await approvalService.decideApproval({
      approvalId: req.params.id,
      organizationId: req.organizationId,
      decision: 'rejected',
      comment: req.body.decision_comment || 'Rejected',
      userId: req.user.id,
      userRole: req.memberRole,
    });
    return sendSuccess(res, 'Request rejected', updated);
  } catch (err) {
    return sendError(res, err.message, [], 400);
  }
};

export const requestInformation = async (req, res) => {
  try {
    const updated = await approvalService.decideApproval({
      approvalId: req.params.id,
      organizationId: req.organizationId,
      decision: 'info_requested',
      comment: req.body.decision_comment || 'Additional information required',
      userId: req.user.id,
      userRole: req.memberRole,
    });
    return sendSuccess(res, 'Information request sent', updated);
  } catch (err) {
    return sendError(res, err.message, [], 400);
  }
};

