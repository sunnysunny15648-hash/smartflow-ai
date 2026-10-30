import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Bell,
  CheckSquare,
  ShieldCheck,
  PlayCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const TRIGGERS = [
  { id: 'task_created', label: 'When a new task is created', desc: 'Fires whenever an employee or workflow initiates a task' },
  { id: 'task_completed', label: 'When a task is completed', desc: 'Fires when task status transitions to completed' },
  { id: 'task_overdue', label: 'When a task becomes overdue', desc: 'Fires automatically if due date passes without completion' },
  { id: 'due_date_approaching', label: 'When a task due date is within 24 hours', desc: 'Pre-emptive notice for upcoming deadlines' },
  { id: 'approval_submitted', label: 'When an approval request is submitted', desc: 'Fires when purchase/leave/expense is submitted' },
  { id: 'approval_approved', label: 'When an approval request is approved', desc: 'Fires upon manager authorization' },
  { id: 'approval_rejected', label: 'When an approval request is rejected', desc: 'Fires upon rejection' },
  { id: 'workflow_created', label: 'When a new workflow is created', desc: 'Fires on workflow initialization' },
  { id: 'workflow_completed', label: 'When a workflow is completed', desc: 'Fires when all workflow steps finalize' },
];

export const AutomationCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('task_overdue');

  // Conditions State
  const [conditions, setConditions] = useState([]);

  // Action State
  const [actionType, setActionType] = useState('send_notification');
  const [actionPayload, setActionPayload] = useState({
    title: 'Automated System Alert',
    message: 'Task is overdue. Please address immediately.',
  });

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { field: 'priority', operator: 'equals', value: 'high' },
    ]);
  };

  const handleUpdateCondition = (index, key, val) => {
    const updated = [...conditions];
    updated[index][key] = val;
    setConditions(updated);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, idx) => idx !== index));
  };

  const handleActionTypeChange = (type) => {
    setActionType(type);
    if (type === 'send_notification') {
      setActionPayload({ title: 'System Notification', message: 'Triggered by SmartFlow automation rule.' });
    } else if (type === 'create_task') {
      setActionPayload({ title: 'Follow-up Task', priority: 'high' });
    } else if (type === 'change_task_status') {
      setActionPayload({ status: 'completed' });
    } else if (type === 'request_approval') {
      setActionPayload({ title: 'Approval Required', request_type: 'Operational Escalation' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: ruleName,
        description,
        trigger_type: triggerType,
        conditions,
        actions: [
          {
            type: actionType,
            payload: actionPayload,
          },
        ],
        is_active: true,
      };

      const res = await api.post('/automation/rules', payload);
      if (res.success) {
        navigate('/automation');
      }
    } catch (err) {
      alert(err.message || 'Error saving automation rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/automation')}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure Automation Rule</h1>
          <p className="text-xs text-slate-500 mt-1">Build an event-driven Trigger → Condition → Action rule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card title="1. Rule Identity" subtitle="Name and operational purpose">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                required
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Notify manager when high-priority task becomes overdue"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional explanation of expected rule outcome..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Step 1: Trigger */}
        <Card title="2. When this event occurs (Trigger)" subtitle="Select the event that starts this automation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRIGGERS.map((trig) => (
              <div
                key={trig.id}
                onClick={() => setTriggerType(trig.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  triggerType === trig.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{trig.label}</span>
                  {triggerType === trig.id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">{trig.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Step 2: Conditions */}
        <Card
          title="3. Only if these conditions match (Optional)"
          subtitle="Add criteria to filter triggering events"
          actions={
            <Button variant="secondary" size="sm" onClick={handleAddCondition} icon={Plus}>
              Add Condition
            </Button>
          }
        >
          {conditions.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No conditions set. This rule will trigger for all matching events.
            </p>
          ) : (
            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(idx, 'field', e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                    <option value="request_type">Request Type</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(idx, 'operator', e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does Not Equal</option>
                    <option value="contains">Contains</option>
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => handleUpdateCondition(idx, 'value', e.target.value)}
                    placeholder="Value..."
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Step 3: Action */}
        <Card title="4. Execute this action (Action)" subtitle="Specify what SmartFlow should do automatically">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => handleActionTypeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              >
                <option value="send_notification">Send Internal Notification</option>
                <option value="create_task">Create Follow-up Task</option>
                <option value="request_approval">Request Manager Approval</option>
                <option value="change_task_status">Change Task Status</option>
              </select>
            </div>

            {/* Action Dynamic Inputs */}
            {actionType === 'send_notification' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                    Notification Subject
                  </label>
                  <input
                    type="text"
                    value={actionPayload.title || ''}
                    onChange={(e) => setActionPayload({ ...actionPayload, title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                    Notification Message
                  </label>
                  <input
                    type="text"
                    value={actionPayload.message || ''}
                    onChange={(e) => setActionPayload({ ...actionPayload, message: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {actionType === 'create_task' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={actionPayload.title || ''}
                    onChange={(e) => setActionPayload({ ...actionPayload, title: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/automation')}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading} icon={Save}>
            Save Automation Rule
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AutomationCreatePage;

