-- ==============================================================================
-- SMARTFLOW AI - DATABASE INITIALIZATION SCHEMA & ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked with auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 2. ORGANIZATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 4. ORGANIZATION MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

-- ==============================================================================
-- 5. WORKFLOWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled')) DEFAULT 'draft',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 6. WORKFLOW STEPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 7. TASKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('to_do', 'in_progress', 'under_review', 'completed', 'blocked')) DEFAULT 'to_do',
    due_date TIMESTAMPTZ,
    checklist JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 8. TASK COMMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 9. TASK ATTACHMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 10. APPROVALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    request_type TEXT NOT NULL,
    amount NUMERIC(14,2),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested')) DEFAULT 'pending',
    decision_comment TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 11. AUTOMATION RULES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 12. AUTOMATION EXECUTIONS TABLE (With Idempotency Key)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
    execution_result JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_rule_event UNIQUE (rule_id, event_id)
);

-- ==============================================================================
-- 13. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT DEFAULT 'info',
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 14. ACTIVITY LOGS (AUDIT TRAIL) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 15. AI CONVERSATIONS & MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 16. REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    date_from DATE,
    date_to DATE,
    report_data JSONB NOT NULL,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON public.workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_owner ON public.workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.workflow_steps(workflow_id);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON public.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_approvals_org ON public.approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON public.approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

CREATE INDEX IF NOT EXISTS idx_auto_rules_org ON public.automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_auto_rules_active ON public.automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_exec_rule ON public.automation_executions(rule_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_org ON public.reports(organization_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- UPDATED_AT TIMESTAMP REUSABLE TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_dept_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_approvals_updated BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_auto_rules_updated BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_ai_conversations_updated BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- RLS HELPER FUNCTIONS
-- ==============================================================================

-- Check if current authenticated user belongs to an organization
CREATE OR REPLACE FUNCTION public.is_member_of(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check user role within an organization
CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND is_active = TRUE
          AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles can be viewed by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- Organizations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view their organizations"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (public.is_member_of(id) OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create an organization"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organization admins can update organization details"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (public.has_org_role(id, ARRAY['admin']));

-- ------------------------------------------------------------------------------
-- Organization Members Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view colleagues in their organization"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Admins can manage organization members"
    ON public.organization_members FOR ALL
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin']))
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin']));

-- Allow creator to add themselves as initial admin
CREATE POLICY "User can add self as admin upon org creation"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Departments Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view departments"
    ON public.departments FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Admins and managers can manage departments"
    ON public.departments FOR ALL
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']))
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

-- ------------------------------------------------------------------------------
-- Workflows Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view workflows"
    ON public.workflows FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Admins and managers can create workflows"
    ON public.workflows FOR INSERT
    TO authenticated
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

CREATE POLICY "Admins and managers can update workflows"
    ON public.workflows FOR UPDATE
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

CREATE POLICY "Admins can delete workflows"
    ON public.workflows FOR DELETE
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin']));

-- ------------------------------------------------------------------------------
-- Workflow Steps Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view workflow steps"
    ON public.workflow_steps FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_steps.workflow_id
              AND public.is_member_of(w.organization_id)
        )
    );

CREATE POLICY "Managers and admins can modify workflow steps"
    ON public.workflow_steps FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_steps.workflow_id
              AND public.has_org_role(w.organization_id, ARRAY['admin', 'manager'])
        )
    );

-- ------------------------------------------------------------------------------
-- Tasks Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Members can create tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'manager', 'employee']));

CREATE POLICY "Authorized users can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        public.has_org_role(organization_id, ARRAY['admin', 'manager'])
        OR assigned_to = auth.uid()
    );

CREATE POLICY "Admins can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

-- ------------------------------------------------------------------------------
-- Task Comments Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Task comments viewable by org members"
    ON public.task_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id
              AND public.is_member_of(t.organization_id)
        )
    );

CREATE POLICY "Users can add comments to tasks"
    ON public.task_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id
              AND public.is_member_of(t.organization_id)
        )
    );

-- ------------------------------------------------------------------------------
-- Task Attachments Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Task attachments viewable by org members"
    ON public.task_attachments FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Org members can upload attachments"
    ON public.task_attachments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of(organization_id) AND auth.uid() = uploaded_by);

-- ------------------------------------------------------------------------------
-- Approvals Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view approvals"
    ON public.approvals FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Employees, managers, and admins can submit approvals"
    ON public.approvals FOR INSERT
    TO authenticated
    WITH CHECK (public.is_member_of(organization_id) AND auth.uid() = requested_by);

CREATE POLICY "Admins and managers can decide on approvals"
    ON public.approvals FOR UPDATE
    TO authenticated
    USING (
        public.has_org_role(organization_id, ARRAY['admin', 'manager'])
        AND requested_by <> auth.uid() -- Enforce no self-approval unless admin override handled on backend
    );

-- ------------------------------------------------------------------------------
-- Automation Rules Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view automation rules"
    ON public.automation_rules FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Admins and managers can manage automation rules"
    ON public.automation_rules FOR ALL
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']))
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

-- ------------------------------------------------------------------------------
-- Automation Executions Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins and managers can view automation logs"
    ON public.automation_executions FOR SELECT
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

-- ------------------------------------------------------------------------------
-- Notifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Activity Logs (Audit Trail) Policies (Immutable to ordinary users)
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view activity logs based on role"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

-- ------------------------------------------------------------------------------
-- AI Conversations & Messages Policies (Private to user)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only view their own AI conversations"
    ON public.ai_conversations FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AI conversations"
    ON public.ai_conversations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.is_member_of(organization_id));

CREATE POLICY "Users can view AI messages in their conversations"
    ON public.ai_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add AI messages in their conversations"
    ON public.ai_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- Reports Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (public.is_member_of(organization_id));

CREATE POLICY "Admins and managers can generate reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'manager']));

