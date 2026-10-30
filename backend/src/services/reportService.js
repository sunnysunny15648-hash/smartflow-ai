import { supabaseAdmin } from '../config/supabase.js';
import { generateReportSummary } from './aiService.js';
import { logActivity } from './auditService.js';
import { Parser } from 'json2csv';

export const calculateOrganizationMetrics = async (organizationId, dateFrom, dateTo) => {
  // Query tasks
  let tasksQuery = supabaseAdmin
    .from('tasks')
    .select('id, title, status, priority, due_date, created_at, completed_at, assigned_to')
    .eq('organization_id', organizationId);

  if (dateFrom) tasksQuery = tasksQuery.gte('created_at', dateFrom);
  if (dateTo) tasksQuery = tasksQuery.lte('created_at', dateTo);

  const { data: tasks = [] } = await tasksQuery;

  // Query workflows
  let wfQuery = supabaseAdmin
    .from('workflows')
    .select('id, name, status, priority, category, created_at')
    .eq('organization_id', organizationId);

  if (dateFrom) wfQuery = wfQuery.gte('created_at', dateFrom);
  if (dateTo) wfQuery = wfQuery.lte('created_at', dateTo);

  const { data: workflows = [] } = await wfQuery;

  // Query approvals
  let apprQuery = supabaseAdmin
    .from('approvals')
    .select('id, title, status, request_type, amount, created_at, decided_at')
    .eq('organization_id', organizationId);

  const { data: approvals = [] } = await apprQuery;

  // Query automation executions
  let execQuery = supabaseAdmin
    .from('automation_executions')
    .select('id, status, created_at')
    .eq('organization_id', organizationId);

  const { data: executions = [] } = await execQuery;

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate average completion time in hours
  let totalCompletionHours = 0;
  let countWithDuration = 0;
  tasks.forEach((t) => {
    if (t.completed_at && t.created_at) {
      const diffMs = new Date(t.completed_at) - new Date(t.created_at);
      const hours = diffMs / (1000 * 60 * 60);
      if (hours >= 0) {
        totalCompletionHours += hours;
        countWithDuration++;
      }
    }
  });

  const avgCompletionHours = countWithDuration > 0 ? Math.round((totalCompletionHours / countWithDuration) * 10) / 10 : 0;

  // Approval metrics
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;

  // Automation metrics
  const totalAutomations = executions.length;
  const successfulAutomations = executions.filter((e) => e.status === 'success').length;

  return {
    period: { dateFrom: dateFrom || 'All time', dateTo: dateTo || 'Present' },
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter((w) => w.status === 'active').length,
    completedWorkflows: workflows.filter((w) => w.status === 'completed').length,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    avgCompletionHours,
    pendingApprovals,
    approvedCount,
    rejectedCount,
    totalAutomations,
    successfulAutomations,
    workflowsSummary: workflows.slice(0, 10),
    tasksSummary: tasks.slice(0, 10),
  };
};

export const generateReport = async ({
  organizationId,
  reportType,
  dateFrom,
  dateTo,
  userId,
}) => {
  const metrics = await calculateOrganizationMetrics(organizationId, dateFrom, dateTo);

  // AI-generated summary
  let aiSummary = null;
  try {
    const aiResult = await generateReportSummary(metrics);
    aiSummary = aiResult.summary + '\n\nKey Findings: ' + (aiResult.key_findings || []).join('; ');
  } catch (err) {
    aiSummary = `Operational report generated with ${metrics.completionRate}% task completion rate.`;
  }

  const { data: report, error } = await supabaseAdmin
    .from('reports')
    .insert({
      organization_id: organizationId,
      generated_by: userId,
      report_type: reportType,
      date_from: dateFrom || null,
      date_to: dateTo || null,
      report_data: metrics,
      ai_summary: aiSummary,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    organizationId,
    userId,
    action: 'report.generated',
    entityType: 'report',
    entityId: report.id,
    metadata: { reportType, dateFrom, dateTo },
  });

  return report;
};

export const exportReportToCSV = async (reportData) => {
  const fields = ['metric', 'value'];
  const rows = [
    { metric: 'Total Workflows', value: reportData.totalWorkflows },
    { metric: 'Active Workflows', value: reportData.activeWorkflows },
    { metric: 'Completed Workflows', value: reportData.completedWorkflows },
    { metric: 'Total Tasks', value: reportData.totalTasks },
    { metric: 'Completed Tasks', value: reportData.completedTasks },
    { metric: 'In Progress Tasks', value: reportData.inProgressTasks },
    { metric: 'Overdue Tasks', value: reportData.overdueTasks },
    { metric: 'Completion Rate (%)', value: reportData.completionRate },
    { metric: 'Avg Completion Hours', value: reportData.avgCompletionHours },
    { metric: 'Pending Approvals', value: reportData.pendingApprovals },
    { metric: 'Approved Count', value: reportData.approvedCount },
    { metric: 'Rejected Count', value: reportData.rejectedCount },
    { metric: 'Automation Executions', value: reportData.totalAutomations },
  ];

  const parser = new Parser({ fields });
  return parser.parse(rows);
};

