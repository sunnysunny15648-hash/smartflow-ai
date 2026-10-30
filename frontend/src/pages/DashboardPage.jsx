import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Activity,
  Layers,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage = () => {
  const { currentOrg, profile } = useAuth();
  const [overview, setOverview] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ovRes, prodRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/productivity'),
        ]);

        if (ovRes.success) setOverview(ovRes.data);
        if (prodRes.success) setProductivity(prodRes.data);
      } catch (err) {
        console.warn('Dashboard fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentOrg) {
      fetchDashboardData();
    }
  }, [currentOrg]);

  if (loading) {
    return <LoadingSpinner text="Aggregating operational analytics..." size="lg" />;
  }

  const statCards = [
    {
      title: 'Active Workflows',
      value: overview?.activeWorkflows ?? 0,
      sub: `${overview?.totalWorkflows ?? 0} total workflows`,
      icon: GitBranch,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Tasks Completion',
      value: `${overview?.completionPercentage ?? 0}%`,
      sub: `${overview?.completedTasks ?? 0} of ${overview?.totalTasks ?? 0} completed`,
      icon: CheckSquare,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Pending Approvals',
      value: overview?.pendingApprovals ?? 0,
      sub: 'Awaiting manager review',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Overdue Tasks',
      value: overview?.overdueTasks ?? 0,
      sub: `${overview?.tasksAssignedToMe ?? 0} assigned to you`,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  const pieColors = ['#94a3b8', '#3b82f6', '#eab308', '#22c55e', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-medium mb-2 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SmartFlow Intelligent Hub</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.fullName || 'Manager'}
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            Monitoring workspace: <strong className="text-white">{currentOrg?.name}</strong> • Avg Completion Time:{' '}
            <strong className="text-white">{overview?.avgCompletionHours ?? 0} hrs</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/ai-assistant">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-transparent">
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-300" /> Ask AI
            </Button>
          </Link>
          <Link to="/workflows/create">
            <Button variant="primary" size="sm" className="shadow-lg shadow-indigo-600/40">
              <Plus className="w-4 h-4 mr-1" /> Create Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>
                  <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity By Task Status Chart */}
        <Card
          title="Task Status Distribution"
          subtitle="Real-time breakdown of all organizational tasks"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            {productivity?.statusChartData && productivity.statusChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivity.statusChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active tasks recorded yet. Create a workflow to generate tasks.
              </div>
            )}
          </div>
        </Card>

        {/* Priority Breakdown Pie Chart */}
        <Card title="Task Priority" subtitle="Urgency distribution">
          <div className="h-64 w-full flex flex-col items-center justify-center">
            {productivity?.priorityChartData && productivity.priorityChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productivity.priorityChartData}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {productivity.priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No priority metrics yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Activities Audit Stream & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card
          title="Audit Trail Stream"
          subtitle="Real-time immutable operational log"
          actions={
            <Link to="/activity-logs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          }
        >
          <div className="space-y-3">
            {overview?.recentActivities && overview.recentActivities.length > 0 ? (
              overview.recentActivities.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {log.profiles?.full_name ? log.profiles.full_name.charAt(0) : 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {log.profiles?.full_name || 'System'}{' '}
                      <span className="font-normal text-slate-500">performed</span> {log.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {log.entity_type}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent activity logged</p>
            )}
          </div>
        </Card>

        {/* Pending Approvals Quick Widget */}
        <Card
          title="Pending Approvals"
          subtitle="Requests requiring management decision"
          actions={
            <Link to="/approvals" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Open approvals →
            </Link>
          }
        >
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {overview?.pendingApprovals ?? 0} Pending Approvals
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
              Review and authorize employee requests, purchase requisitions, and operational changes.
            </p>
            <Link to="/approvals">
              <Button variant="outline" size="sm">
                Review Approvals
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

