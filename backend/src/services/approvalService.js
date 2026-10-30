import { supabaseAdmin } from '../config/supabase.js';
import { logActivity } from './auditService.js';
import { dispatchEvent } from './automationService.js';
import { createNotification } from './notificationService.js';

export const listApprovals = async (organizationId, filters = {}) => {
  let query = supabaseAdmin
    .from('approvals')
    .select(`
      *,
      workflows (id, name),
      tasks (id, title),
      requester:requested_by (id, full_name, email, avatar_url),
      approver:approver_id (id, full_name, email, avatar_url)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.request_type) query = query.eq('request_type', filters.request_type);
  if (filters.requested_by) query = query.eq('requested_by', filters.requested_by);
  if (filters.approver_id) query = query.eq('approver_id', filters.approver_id);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getApprovalById = async (approvalId, organizationId) => {
  const { data, error } = await supabaseAdmin
    .from('approvals')
    .select(`
      *,
      workflows (id, name, priority, status),
      tasks (id, title, priority, status),
      requester:requested_by (id, full_name, email, avatar_url),
      approver:approver_id (id, full_name, email, avatar_url)
    `)
    .eq('id', approvalId)
    .eq('organization_id', organizationId)
    .single();

  if (error) throw error;
  return data;
};

export const createApproval = async (approvalData, organizationId, userId) => {
  const { data: approval, error } = await supabaseAdmin
    .from('approvals')
    .insert({
      ...approvalData,
      organization_id: organizationId,
      requested_by: userId,
      status: 'pending',
    })
    .select(`
      *,
      workflows (id, name),
      requester:requested_by (id, full_name, email)
    `)
    .single();

  if (error) throw error;

  // Notify approver
  if (approval.approver_id) {
    await createNotification({
      organizationId,
      userId: approval.approver_id,
      title: 'Action Required: New Approval Request',
      message: `"${approval.title}" submitted by ${approval.requester?.full_name || 'team member'}.`,
      entityType: 'approval',
      entityId: approval.id,
    });
  }

  // Audit
  await logActivity({
    organizationId,
    userId,
    action: 'approval.requested',
    entityType: 'approval',
    entityId: approval.id,
    metadata: { title: approval.title, requestType: approval.request_type, amount: approval.amount },
  });

  // Automation event
  await dispatchEvent({
    organizationId,
    triggerType: 'approval_submitted',
    eventId: `appr_sub_${approval.id}_${Date.now()}`,
    eventData: { ...approval, entityType: 'approval' },
  });

  return approval;
};

export const decideApproval = async ({
  approvalId,
  organizationId,
  decision, // 'approved' | 'rejected' | 'info_requested'
  comment = '',
  userId,
  userRole,
}) => {
  const existing = await getApprovalById(approvalId, organizationId);
  if (!existing) throw new Error('Approval request not found');

  if (existing.status !== 'pending' && existing.status !== 'info_requested') {
    throw new Error(`Cannot decide an approval that is already in "${existing.status}" status`);
  }

  // Enforce self-approval prevention (Admins can override in emergency, but employees/managers cannot self-approve)
  if (existing.requested_by === userId && userRole !== 'admin') {
    throw new Error('Self-approval policy violation: You cannot decide on your own approval request.');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('approvals')
    .update({
      status: decision,
      decision_comment: comment,
      decided_at: new Date().toISOString(),
      approver_id: userId,
    })
    .eq('id', approvalId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      requester:requested_by (id, full_name, email)
    `)
    .single();

  if (error) throw error;

  // Notify requester of decision
  const titleMap = {
    approved: 'Approval Request Approved',
    rejected: 'Approval Request Rejected',
    info_requested: 'Additional Information Requested',
  };

  await createNotification({
    organizationId,
    userId: existing.requested_by,
    title: titleMap[decision] || 'Approval Update',
    message: `Your request "${existing.title}" was marked as ${decision}. ${comment ? `Note: "${comment}"` : ''}`,
    entityType: 'approval',
    entityId: approvalId,
  });

  // Audit
  await logActivity({
    organizationId,
    userId,
    action: `approval.${decision}`,
    entityType: 'approval',
    entityId: approvalId,
    metadata: { decision, comment },
  });

  // Automation event
  const triggerType = decision === 'approved' ? 'approval_approved' : decision === 'rejected' ? 'approval_rejected' : null;
  if (triggerType) {
    await dispatchEvent({
      organizationId,
      triggerType,
      eventId: `appr_dec_${approvalId}_${Date.now()}`,
      eventData: { ...updated, entityType: 'approval' },
    });
  }

  return updated;
};

