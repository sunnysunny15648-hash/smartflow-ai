-- ==============================================================================
-- SMARTFLOW AI - SAMPLE SEED DATA
-- (Run this after users have created their initial organization)
-- ==============================================================================

-- Example: Initial default departments for a newly created organization
-- (Note: in production, default departments can be auto-created upon organization signup)

-- Helper function to seed an organization with standard departments & sample templates
CREATE OR REPLACE FUNCTION public.seed_default_departments(target_org_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.departments (organization_id, name, description)
    VALUES
        (target_org_id, 'Human Resources', 'Talent acquisition, employee onboarding, policies and payroll'),
        (target_org_id, 'Finance & Accounting', 'Invoicing, expense approvals, budget allocations and auditing'),
        (target_org_id, 'Operations', 'Supply chain, business logistics, facility and inventory maintenance'),
        (target_org_id, 'Engineering & IT', 'Infrastructure maintenance, system access requests, and issue tracking'),
        (target_org_id, 'Sales & Marketing', 'Lead workflows, campaign approvals, client onboarding and reviews')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

