import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Sparkles,
  Calendar,
  User,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const KANBAN_COLUMNS = [
  { id: 'to_do', title: 'To Do', color: 'border-slate-300' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-400' },
  { id: 'under_review', title: 'Under Review', color: 'border-amber-400' },
  { id: 'completed', title: 'Completed', color: 'border-emerald-400' },
  { id: 'blocked', title: 'Blocked', color: 'border-rose-400' },
];

export const TasksPage = () => {
  const { currentOrg } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View State
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    workflow_id: '',
    assigned_to: '',
    priority: 'medium',
    status: 'to_do',
    due_date: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/tasks?${params.toString()}`);
      if (res.success) setTasks(res.data || []);
    } catch (err) {
      console.warn('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      if (!currentOrg) return;
      const [wfRes, memRes] = await Promise.all([
        api.get('/workflows'),
        api.get(`/organizations/${currentOrg.id}/members`),
      ]);
      if (wfRes.success) setWorkflows(wfRes.data || []);
      if (memRes.success) setMembers(memRes.data || []);
    } catch (err) {
      console.warn('Error fetching task metadata:', err);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchTasks();
      fetchMeta();
    }
  }, [currentOrg, priorityFilter, statusFilter]);

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert(err.message || 'Error updating task status');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        ...taskForm,
        workflow_id: taskForm.workflow_id || null,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
      };
      const res = await api.post('/tasks', payload);
      if (res.success) {
        setCreateModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          workflow_id: '',
          assigned_to: '',
          priority: 'medium',
          status: 'to_do',
          due_date: '',
        });
        fetchTasks();
      }
    } catch (err) {
      alert(err.message || 'Error creating task');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGenerateAITasks = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/task-generation', { prompt: aiPrompt });
      if (res.success && res.data?.tasks) {
        // Automatically create the suggested tasks
        for (const t of res.data.tasks) {
          await api.post('/tasks', {
            title: t.title,
            description: t.description,
            priority: t.priority || 'medium',
            status: 'to_do',
          });
        }
        setAiModalOpen(false);
        setAiPrompt('');
        fetchTasks();
      }
    } catch (err) {
      alert(err.message || 'Error generating AI tasks');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
          <p className="text-xs text-slate-500 mt-1">Coordinate assignments, deadlines, and project milestones</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAiModalOpen(true)}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" /> AI Tasks
          </Button>

          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} icon={Plus}>
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {viewMode === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Task View */}
      {loading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks Found"
          description="Create your first task or use Gemini AI to generate an actionable task breakdown."
          actionLabel="Create Task"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.title}</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards Column */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <Badge variant={task.priority} size="sm">
                          {task.priority}
                        </Badge>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                        >
                          <option value="to_do">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="under_review">Review</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>

                      <Link to={`/tasks/${task.id}`} className="group-hover:text-indigo-600">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {task.title}
                        </h4>
                      </Link>

                      {task.workflows?.name && (
                        <p className="text-[10px] text-indigo-600 font-medium truncate mt-1">
                          Pipeline: {task.workflows.name}
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{task.profiles?.full_name || 'Unassigned'}</span>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <Link to={`/tasks/${task.id}`} className="hover:text-indigo-600">
                        {task.title}
                      </Link>
                      {task.workflows?.name && (
                        <p className="text-[10px] text-slate-400 font-normal">{task.workflows.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={task.status}>{task.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={task.priority}>{task.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.profiles?.full_name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Task"
        subtitle="Specify task assignment, priority, and timeline"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Prepare Quarter Audit Documents"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Detailed instructions for the assigned team member..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Linked Workflow
              </label>
              <select
                value={taskForm.workflow_id}
                onChange={(e) => setTaskForm({ ...taskForm, workflow_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">Standalone Task</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Assign Employee
              </label>
              <select
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.profiles?.id}>
                    {m.profiles?.full_name || m.profiles?.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={createLoading}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Task Generator Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Task Breakdown Generator"
        subtitle="Powered by Google Gemini"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Project / Objective Description
            </label>
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Conduct a comprehensive security vulnerability assessment on our cloud storage infrastructure before Q4 compliance audit."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              Gemini will break down this goal into actionable, prioritised tasks with realistic durations and add them directly to your workspace board.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateAITasks}
              loading={aiLoading}
              disabled={!aiPrompt.trim()}
            >
              Generate Tasks
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPage;

