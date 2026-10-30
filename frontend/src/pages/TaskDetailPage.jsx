import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Upload,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

export const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, profile, isManager } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Checklist state
  const [newChecklistText, setNewChecklistText] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/tasks/${id}/comments`),
      ]);
      if (tRes.success) setTask(tRes.data);
      if (cRes.success) setComments(cRes.data || []);
    } catch (err) {
      console.warn('Error loading task detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && currentOrg) fetchTask();
  }, [id, currentOrg]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/tasks/${id}`, { status: newStatus });
      if (res.success) setTask(res.data);
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleToggleChecklist = async (itemId) => {
    if (!task) return;
    const updatedChecklist = (task.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    try {
      const res = await api.patch(`/tasks/${id}`, { checklist: updatedChecklist });
      if (res.success) setTask(res.data);
    } catch (err) {
      alert('Failed to update checklist item');
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem = {
      id: `check_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    const updatedChecklist = [...(task.checklist || []), newItem];

    try {
      const res = await api.patch(`/tasks/${id}`, { checklist: updatedChecklist });
      if (res.success) {
        setTask(res.data);
        setNewChecklistText('');
      }
    } catch (err) {
      alert('Failed to add checklist item');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const res = await api.post(`/tasks/${id}/comments`, { comment: newComment });
      if (res.success) {
        setComments([...comments, res.data]);
        setNewComment('');
      }
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving task details..." size="lg" />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Task not found or access denied.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/tasks')} className="mt-4">
          Return to Tasks
        </Button>
      </div>
    );
  }

  const checklistItems = task.checklist || [];
  const completedChecklist = checklistItems.filter((i) => i.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={task.status}>{task.status}</Badge>
              <Badge variant={task.priority}>{task.priority}</Badge>
              {task.workflows?.name && (
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                  {task.workflows.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{task.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick status selector */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 text-slate-800 shadow-sm focus:outline-none"
          >
            <option value="to_do">Status: To Do</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="under_review">Status: Under Review</option>
            <option value="completed">Status: Completed</option>
            <option value="blocked">Status: Blocked</option>
          </select>

          {isManager && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(true)} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details & Checklist */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card title="Task Description">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No description provided.'}
            </p>
          </Card>

          {/* Interactive Checklist */}
          <Card
            title="Action Checklist"
            subtitle={`${completedChecklist} of ${checklistItems.length} items completed`}
          >
            <div className="space-y-2 mb-4">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`text-xs ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add checklist action..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <Button type="submit" variant="secondary" size="sm" icon={Plus}>
                Add
              </Button>
            </form>
          </Card>

          {/* Comments Discussion Thread */}
          <Card title="Discussion & Activity Stream" subtitle="Internal collaboration notes">
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {comments && comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{c.profiles?.full_name || 'Team Member'}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No comments on this task yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <Button type="submit" variant="primary" size="sm" loading={commentLoading} icon={Send}>
                Post
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <Card title="Task Metadata">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Assignee</span>
                <span className="font-semibold text-slate-800">
                  {task.profiles?.full_name || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Created By</span>
                <span className="text-slate-700">{task.creator?.full_name || 'System'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Due Date</span>
                <span className="text-slate-700 font-semibold">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None set'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Created At</span>
                <span className="text-slate-700">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card title="Supporting Documents" subtitle="Verified attachments">
            <div className="space-y-2">
              {task.task_attachments && task.task_attachments.length > 0 ? (
                task.task_attachments.map((att) => (
                  <div key={att.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-800">{att.file_name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No attachments uploaded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task?"
        message="This will remove the task, comments, and checklists permanently."
        confirmText="Delete Task"
      />
    </div>
  );
};

export default TaskDetailPage;

