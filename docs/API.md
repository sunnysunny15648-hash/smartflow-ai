# SmartFlow AI - REST API Documentation (`/api/v1`)

SmartFlow AI exposes a RESTful API organized around resource endpoints. Every request to protected endpoints must include a Supabase Bearer token in the `Authorization` header and optionally an `X-Organization-Id` header to specify the active organization context.

---

## Authentication & Headers

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <supabase_jwt_token>` | Authenticates user session |
| `X-Organization-Id` | `<uuid>` | Scopes operation to the specified active organization |
| `Content-Type` | `application/json` | Required for POST / PATCH payloads |

---

## Standard Response Structure

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response (HTTP 400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "message": "A descriptive error message",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---

## Endpoints

### 1. Authentication (`/api/v1/auth`)
- `GET /auth/me` - Retrieves profile of authenticated user, list of active organizations, and current organizational role.
- `POST /auth/verify` - Validates caller JWT and organization membership.
- `POST /auth/logout` - Terminates session.

### 2. Organizations (`/api/v1/organizations`)
- `POST /organizations` - Creates new organization, assigns creator as `admin`, seeds default departments.
- `GET /organizations` - Lists organizations user belongs to.
- `GET /organizations/:id` - Retrieves organization details.
- `PATCH /organizations/:id` - Updates organization name/description (Admin only).
- `GET /organizations/:id/members` - Lists members of the organization with role, status, and profile info.
- `POST /organizations/:id/invitations` - Invites a registered user into the organization (Admin only).
- `PATCH /organizations/:id/members/:memberId` - Updates a member's role or active status (Admin only).

### 3. Departments (`/api/v1/departments`)
- `GET /departments` - Lists all departments for active organization.
- `POST /departments` - Creates department (Admin/Manager).
- `PATCH /departments/:id` - Updates department details.
- `DELETE /departments/:id` - Deletes department (Admin only).

### 4. Workflows (`/api/v1/workflows`)
- `GET /workflows` - Lists workflows. Supports query params: `status`, `priority`, `category`, `search`.
- `POST /workflows` - Creates workflow and sequence steps. Dispatches `workflow_created` automation event.
- `GET /workflows/:id` - Retrieves workflow with steps and associated tasks.
- `PATCH /workflows/:id` - Updates workflow status or metadata.
- `DELETE /workflows/:id` - Deletes workflow (Admin only).
- `POST /workflows/:id/activate` - Sets status to `active`.
- `POST /workflows/:id/pause` - Sets status to `on_hold`.
- `POST /workflows/:id/duplicate` - Creates duplicate workflow draft with steps.

### 5. Tasks (`/api/v1/tasks`)
- `GET /tasks` - Lists tasks. Supports query params: `status`, `priority`, `workflow_id`, `assigned_to`, `search`.
- `POST /tasks` - Creates task, notifies assignee, dispatches `task_created` automation event.
- `GET /tasks/:id` - Retrieves task with comments and attachments.
- `PATCH /tasks/:id` - Updates task status, checklist, or assignment.
- `DELETE /tasks/:id` - Deletes task (Admin/Manager).
- `GET /tasks/:id/comments` - Fetches discussion thread comments.
- `POST /tasks/:id/comments` - Adds a comment to the task.
- `POST /tasks/:id/attachments` - Records file attachment metadata.

### 6. Approvals (`/api/v1/approvals`)
- `GET /approvals` - Lists approvals. Supports query params: `status`, `request_type`.
- `POST /approvals` - Submits approval request, notifies approver, dispatches `approval_submitted`.
- `GET /approvals/:id` - Retrieves approval details and audit history.
- `POST /approvals/:id/approve` - Authorizes approval (checks anti-self-approval rule), dispatches `approval_approved`.
- `POST /approvals/:id/reject` - Rejects approval with comment, dispatches `approval_rejected`.
- `POST /approvals/:id/request-information` - Requests additional details from requester.

### 7. Automation Engine (`/api/v1/automation`)
- `GET /automation/rules` - Lists active and inactive automation rules.
- `POST /automation/rules` - Creates Trigger → Condition → Action rule.
- `GET /automation/rules/:id` - Retrieves specific rule.
- `PATCH /automation/rules/:id` - Updates rule configuration.
- `DELETE /automation/rules/:id` - Deletes rule.
- `POST /automation/rules/:id/activate` - Activates rule.
- `POST /automation/rules/:id/deactivate` - Deactivates rule.
- `GET /automation/executions` - Lists execution logs with idempotency keys and results.

### 8. AI Assistant (`/api/v1/ai`)
- `POST /ai/workflow-suggestions` - Generates structured workflow using Google Gemini.
- `POST /ai/task-generation` - Deconstructs a business objective into prioritized tasks.
- `POST /ai/analyze-workflow` - Analyzes bottlenecks and computes estimated efficiency score.
- `POST /ai/report-summary` - Generates executive summary from database metrics.
- `POST /ai/chat` - Interactive natural-language assistant conversation.

### 9. Notifications (`/api/v1/notifications`)
- `GET /notifications` - Lists notifications for authenticated user. Supports `?unread=true`.
- `PATCH /notifications/:id/read` - Marks single notification as read.
- `POST /notifications/read-all` - Marks all notifications as read.

### 10. Reports (`/api/v1/reports`)
- `GET /reports` - Lists historic generated reports.
- `POST /reports/generate` - Calculates actual PostgreSQL metrics, runs AI summary, saves report.
- `GET /reports/:id` - Retrieves report details.
- `GET /reports/:id/export` - Streams downloadable CSV export.

### 11. Dashboard & Audit (`/api/v1/dashboard`, `/api/v1/activity-logs`)
- `GET /dashboard/overview` - Aggregates KPIs (total workflows, completion %, pending approvals, overdue tasks, recent activities).
- `GET /dashboard/productivity` - Task distribution by status and priority for Recharts.
- `GET /dashboard/workflow-performance` - Workflow breakdown by category.
- `GET /dashboard/recent-activities` - Latest activities stream.
- `GET /activity-logs` - Immutable audit log stream with JSON metadata.

