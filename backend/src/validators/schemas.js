import { z } from 'zod';

// ==============================================================================
// AUTHENTICATION SCHEMAS
// ==============================================================================
export const RegisterSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  organizationName: z.string().min(2, 'Organization name is required').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// ==============================================================================
// ORGANIZATION & DEPARTMENT SCHEMAS
// ==============================================================================
export const OrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const DepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const MemberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee', 'viewer']),
  department_id: z.string().uuid().optional().nullable(),
});

export const MemberUpdateSchema = z.object({
  role: z.enum(['admin', 'manager', 'employee', 'viewer']).optional(),
  department_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
});

// ==============================================================================
// WORKFLOW SCHEMAS
// ==============================================================================
export const WorkflowStepSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(1000).optional().default(''),
  step_order: z.number().int().nonnegative(),
  assigned_to: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).default('pending'),
});

export const WorkflowSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  description: z.string().max(5000).optional().default(''),
  category: z.string().min(1).max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']).default('draft'),
  department_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  steps: z.array(WorkflowStepSchema).optional().default([]),
});

export const WorkflowUpdateSchema = WorkflowSchema.partial();

// ==============================================================================
// TASK SCHEMAS
// ==============================================================================
export const TaskChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  completed: z.boolean().default(false),
});

export const TaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().default(''),
  workflow_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['to_do', 'in_progress', 'under_review', 'completed', 'blocked']).default('to_do'),
  due_date: z.string().optional().nullable(),
  checklist: z.array(TaskChecklistItemSchema).optional().default([]),
});

export const TaskUpdateSchema = TaskSchema.partial();

export const TaskCommentSchema = z.object({
  comment: z.string().min(1).max(2000),
});

// ==============================================================================
// APPROVAL SCHEMAS
// ==============================================================================
export const ApprovalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional().default(''),
  request_type: z.string().min(2).max(100),
  workflow_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  approver_id: z.string().uuid().optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
});

export const ApprovalDecisionSchema = z.object({
  decision_comment: z.string().max(1000).optional().default(''),
});

// ==============================================================================
// AUTOMATION RULE SCHEMAS
// ==============================================================================
export const AutomationConditionSchema = z.object({
  field: z.string().min(1), // e.g. priority, department_id, status, amount, due_date
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
  value: z.any(),
});

export const AutomationActionSchema = z.object({
  type: z.enum([
    'create_task',
    'assign_task',
    'send_notification',
    'request_approval',
    'change_task_status',
    'update_workflow_status',
    'generate_report',
  ]),
  payload: z.record(z.any()),
});

export const AutomationRuleSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().max(1000).optional().default(''),
  trigger_type: z.enum([
    'workflow_created',
    'task_created',
    'task_completed',
    'approval_submitted',
    'approval_approved',
    'approval_rejected',
    'due_date_approaching',
    'task_overdue',
    'workflow_completed',
  ]),
  conditions: z.array(AutomationConditionSchema).default([]),
  actions: z.array(AutomationActionSchema).min(1, 'At least one action is required'),
  is_active: z.boolean().default(true),
});

// ==============================================================================
// AI SCHEMAS (Validation for inputs & outputs)
// ==============================================================================
export const AIChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(3000),
  conversationId: z.string().uuid().optional(),
  context: z.record(z.any()).optional(),
});

export const AIWorkflowResponseSchema = z.object({
  workflow_name: z.string(),
  description: z.string(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.array(
    z.object({
      step_name: z.string(),
      description: z.string(),
      suggested_role: z.string(),
      approval_required: z.boolean(),
    })
  ),
  estimated_duration_days: z.number(),
  recommendations: z.array(z.string()),
});

export const AITaskResponseSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      suggested_role: z.string(),
      estimated_duration_hours: z.number(),
      dependencies: z.array(z.string()).default([]),
    })
  ),
});

export const AIBottleneckResponseSchema = z.object({
  workflow_analysis: z.string(),
  efficiency_score: z.number(),
  bottlenecks: z.array(
    z.object({
      step: z.string(),
      problem: z.string(),
      impact: z.string(),
    })
  ),
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      expected_benefit: z.string(),
      priority: z.string(),
    })
  ),
});

export const AIReportResponseSchema = z.object({
  report_title: z.string(),
  summary: z.string(),
  key_findings: z.array(z.string()),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  overall_assessment: z.string(),
});

// ==============================================================================
// NOTIFICATION & REPORT SCHEMAS
// ==============================================================================
export const NotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  notification_type: z.string().default('info'),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
});

export const ReportGenerateSchema = z.object({
  report_type: z.enum([
    'operational',
    'productivity',
    'monthly',
    'employee_performance',
    'workflow_completion',
    'pending_approvals',
    'overdue_tasks',
    'automation_performance',
  ]),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  department_id: z.string().uuid().optional(),
});

