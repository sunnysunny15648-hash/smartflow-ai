import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';

export const WorkflowsPage = () => {
  const { currentOrg, isManager, isAdmin } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/workflows?${params.toString()}`);
      if (res.success) setWorkflows(res.data || []);
    } catch (err) {
      console.warn('Error fetching workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchWorkflows();
  }, [currentOrg, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkflows();
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/workflows/${id}/activate`);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Error activating workflow');
    }
  };

  const handlePause = async (id) => {
    try {
      await api.post(`/workflows/${id}/pause`);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Error pausing workflow');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Error duplicating workflow');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setActionLoading(true);
      await api.delete(`/workflows/${deleteId}`);
      setDeleteId(null);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Error deleting workflow');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflows</h1>
          <p className="text-xs text-slate-500 mt-1">Design, execute, and monitor business process pipelines</p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2">
            <Link to="/workflows/create">
              <Button variant="primary" size="sm" icon={Plus}>
                New Workflow
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows by name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Workflows Listing */}
      {loading ? (
        <LoadingSpinner text="Fetching workflows..." />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No Workflows Found"
          description="Create your first structured workflow or ask the Gemini AI Assistant to design one."
          actionLabel={isManager ? 'Create Workflow' : undefined}
          onAction={() => (window.location.href = '/workflows/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => {
            const stepsCount = wf.workflow_steps?.length || 0;
            const completedSteps = wf.workflow_steps?.filter((s) => s.status === 'completed').length || 0;
            const stepPercent = stepsCount > 0 ? Math.round((completedSteps / stepsCount) * 100) : 0;

            return (
              <Card key={wf.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                      {wf.category || 'General'}
                    </span>
                    <Badge variant={wf.status}>{wf.status}</Badge>
                  </div>

                  <Link to={`/workflows/${wf.id}`} className="group">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {wf.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {wf.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-700">
                        {completedSteps}/{stepsCount} steps ({stepPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stepPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Priority: <strong className="capitalize text-slate-700">{wf.priority}</strong></span>
                    {wf.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(wf.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/workflows/${wf.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isManager && (
                    <div className="flex items-center gap-1">
                      {wf.status === 'active' ? (
                        <button
                          onClick={() => handlePause(wf.id)}
                          title="Pause"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(wf.id)}
                          title="Activate"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicate(wf.id)}
                        title="Duplicate"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setDeleteId(wf.id)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Workflow?"
        message="This will permanently delete this workflow and all associated steps and history."
        loading={actionLoading}
        confirmText="Delete Workflow"
      />
    </div>
  );
};

export default WorkflowsPage;

