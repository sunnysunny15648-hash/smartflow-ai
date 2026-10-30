import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

// Layout & Protected Guards
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RoleProtectedRoute from '../components/layout/RoleProtectedRoute';

// Authenticated Pages
import DashboardPage from '../pages/DashboardPage';
import WorkflowsPage from '../pages/WorkflowsPage';
import WorkflowCreatePage from '../pages/WorkflowCreatePage';
import WorkflowDetailPage from '../pages/WorkflowDetailPage';
import TasksPage from '../pages/TasksPage';
import TaskDetailPage from '../pages/TaskDetailPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import ApprovalDetailPage from '../pages/ApprovalDetailPage';
import AutomationPage from '../pages/AutomationPage';
import AutomationCreatePage from '../pages/AutomationCreatePage';
import AIAssistantPage from '../pages/AIAssistantPage';
import NotificationsPage from '../pages/NotificationsPage';
import ReportsPage from '../pages/ReportsPage';
import EmployeesPage from '../pages/EmployeesPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import ActivityLogsPage from '../pages/ActivityLogsPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated Workspace Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route
          path="/workflows/create"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <WorkflowCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route
          path="/automation/create"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <AutomationCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/employees"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <EmployeesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <DepartmentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/activity-logs"
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <ActivityLogsPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

