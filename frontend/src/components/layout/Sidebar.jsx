import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  Users,
  Building2,
  FileClock,
  Settings,
  ChevronDown,
  Building,
  LogOut,
  X,
} from 'lucide-react';
import Badge from '../common/Badge';

export const Sidebar = ({ mobile = false, onClose }) => {
  const { profile, currentOrg, organizations, switchOrganization, role, logout } = useAuth();

  const navItems = [
    { group: 'Core' },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', path: '/workflows', icon: GitBranch },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Approvals', path: '/approvals', icon: ShieldCheck },

    { group: 'AI & Automation' },
    { name: 'Automation Engine', path: '/automation', icon: Zap },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Gemini' },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },

    { group: 'Organization' },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['admin', 'manager'] },
    { name: 'Activity Audit', path: '/activity-logs', icon: FileClock, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Brand & Organization */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                SmartFlow <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Workflow Platform</p>
            </div>
          </div>
          {mobile && (
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Workspace Switcher */}
        {organizations && organizations.length > 0 && (
          <div className="relative group">
            <div className="bg-slate-800/80 hover:bg-slate-800 rounded-lg p-2 flex items-center justify-between text-xs cursor-pointer border border-slate-700/60 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <Building className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="font-medium text-white truncate">{currentOrg?.name || 'Select Workspace'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Organizations dropdown if multiple */}
            {organizations.length > 1 && (
              <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-30">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => switchOrganization(org.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/80 ${
                      org.id === currentOrg?.id ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[10px] uppercase text-slate-500">{org.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item, index) => {
          if (item.group) {
            return (
              <div
                key={`group-${index}`}
                className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 pt-3 pb-1"
              >
                {item.group}
              </div>
            );
          }

          // Check role restrictions
          if (item.roles && !item.roles.includes(role)) {
            return null;
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-indigo-400/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-semibold text-xs flex-shrink-0">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile?.fullName || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 truncate">{profile?.email}</span>
              {role && (
                <Badge variant="primary" size="sm" className="text-[9px] px-1 py-0 uppercase">
                  {role}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

