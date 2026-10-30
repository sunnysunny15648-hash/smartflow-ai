import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getOverview = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const now = new Date();

    // 1. Fetch workflows counts
    const { data: workflows = [] } = await supabaseAdmin
      .from('workflows')
      .select('id, status, priority, category')
      .eq('organization_id', orgId);

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
    const completedWorkflows = workflows.filter((w) => w.status === 'completed').length;

    // 2. Fetch tasks
    const { data: tasks = [] } = await supabaseAdmin
      .from('tasks')
      .select('id, status, priority, due_date, assigned_to, created_at, completed_at')
      .eq('organization_id', orgId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
    ).length;
    const myTasks = tasks.filter((t) => t.assigned_to === userId && t.status !== 'completed').length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average completion hours calculation
    let totalHours = 0;
    let completedCount = 0;
    tasks.forEach((t) => {
      if (t.completed_at && t.created_at) {
        const diff = (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60);
        if (diff >= 0) {
          totalHours += diff;
          completedCount++;
        }
      }
    });
    const avgCompletionHours = completedCount > 0 ? Math.round((totalHours / completedCount) * 10) / 10 : 0;

    // 3. Fetch pending approvals
    const { count: pendingApprovalsCount } = await supabaseAdmin
      .from('approvals')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'pending');

    // 4. Fetch recent activities
    const { data: recentActivities = [] } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        id, action, entity_type, entity_id, metadata, created_at,
        profiles (id, full_name, avatar_url)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(8);

    return sendSuccess(res, 'Dashboard overview retrieved', {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksAssignedToMe: myTasks,
      completionPercentage,
      avgCompletionHours,
      pendingApprovals: pendingApprovalsCount || 0,
      recentActivities,
    });
  } catch (err) {
    return sendError(res, 'Error fetching dashboard overview', [err.message], 500);
  }
};

export const getProductivity = async (req, res) => {
  try {
    const orgId = req.organizationId;

    // Fetch tasks grouped by status and priority
    const { data: tasks = [] } = await supabaseAdmin
      .from('tasks')
      .select('status, priority, created_at, completed_at')
      .eq('organization_id', orgId);

    // Productivity by day of week or status
    const statusCounts = {
      to_do: 0,
      in_progress: 0,
      under_review: 0,
      completed: 0,
      blocked: 0,
    };

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    tasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });

    const statusChartData = [
      { name: 'To Do', count: statusCounts.to_do, color: '#94a3b8' },
      { name: 'In Progress', count: statusCounts.in_progress, color: '#3b82f6' },
      { name: 'Under Review', count: statusCounts.under_review, color: '#eab308' },
      { name: 'Completed', count: statusCounts.completed, color: '#22c55e' },
      { name: 'Blocked', count: statusCounts.blocked, color: '#ef4444' },
    ];

    const priorityChartData = [
      { priority: 'Low', count: priorityCounts.low },
      { priority: 'Medium', count: priorityCounts.medium },
      { priority: 'High', count: priorityCounts.high },
      { priority: 'Critical', count: priorityCounts.critical },
    ];

    return sendSuccess(res, 'Productivity data retrieved', {
      statusChartData,
      priorityChartData,
    });
  } catch (err) {
    return sendError(res, 'Error fetching productivity metrics', [err.message], 500);
  }
};

export const getWorkflowPerformance = async (req, res) => {
  try {
    const { data: workflows = [] } = await supabaseAdmin
      .from('workflows')
      .select('id, name, category, status, priority')
      .eq('organization_id', req.organizationId);

    // Group by category
    const categoryMap = {};
    workflows.forEach((w) => {
      const cat = w.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, active: 0, completed: 0 };
      }
      categoryMap[cat].total++;
      if (w.status === 'active') categoryMap[cat].active++;
      if (w.status === 'completed') categoryMap[cat].completed++;
    });

    const categoryChartData = Object.values(categoryMap);

    return sendSuccess(res, 'Workflow performance data retrieved', {
      categoryChartData,
    });
  } catch (err) {
    return sendError(res, 'Error fetching workflow performance', [err.message], 500);
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        *,
        profiles (id, full_name, email, avatar_url)
      `)
      .eq('organization_id', req.organizationId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) return sendError(res, error.message, [], 500);
    return sendSuccess(res, 'Recent activities retrieved', data || []);
  } catch (err) {
    return sendError(res, 'Error fetching activities', [err.message], 500);
  }
};

