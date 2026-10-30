import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export const WorkflowCreatePage = () => {
  const { currentOrg } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Operations',
    priority: 'medium',
    department_id: '',
    start_date: '',
    due_date: '',
    status: 'draft',
    steps: [
      { step_order: 1, title: 'Initial Requirement Gathering', description: 'Collect source documents', assigned_to: '', status: 'pending' },
      { step_order: 2, title: 'Manager Verification', description: 'Review for compliance and budget authorization', assigned_to: '', status: 'pending' },
    ],
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        if (!currentOrg) return;
        const [deptRes, memRes] = await Promise.all([
          api.get('/departments'),
          api.get(`/organizations/${currentOrg.id}/members`),
        ]);
        if (deptRes.success) setDepartments(deptRes.data || []);
        if (memRes.success) setMembers(memRes.data || []);
      } catch (err) {
        console.warn('Error loading form metadata:', err);
      }
    };
    fetchMetadata();
  }, [currentOrg]);

  const handleStepChange = (index, field, value) => {
    const updated = [...formData.steps];
    updated[index][field] = value;
    setFormData({ ...formData, steps: updated });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          step_order: formData.steps.length + 1,
          title: '',
          description: '',
          assigned_to: '',
          status: 'pending',
        },
      ],
    });
  };

  const removeStep = (index) => {
    const updated = formData.steps.filter((_, idx) => idx !== index).map((s, idx) => ({
      ...s,
      step_order: idx + 1,
    }));
    setFormData({ ...formData, steps: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
      };

      const res = await api.post('/workflows', payload);
      if (res.success) {
        navigate(`/workflows/${res.data.id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);

    try {
      const res = await api.post('/ai/workflow-suggestions', {
        prompt: aiPrompt,
        context: { organization: currentOrg?.name },
      });

      if (res.success && res.data) {
        const suggestion = res.data;
        setFormData({
          ...formData,
          name: suggestion.workflow_name || formData.name,
          description: suggestion.description || formData.description,
          category: suggestion.category || formData.category,
          priority: suggestion.priority || formData.priority,
          steps: (suggestion.steps || []).map((s, idx) => ({
            step_order: idx + 1,
            title: s.step_name || s.title,
            description: s.description || '',
            assigned_to: '',
            status: 'pending',
          })),
        });
        setAiModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'AI workflow generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/workflows')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workflows
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAiModalOpen(true)}
          className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" />
          Generate with Gemini AI
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Workflow Info */}
        <Card title="Workflow Details" subtitle="Primary configuration and ownership parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Workflow Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Employee Onboarding Process"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the purpose and expected deliverables of this business workflow..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="IT Department">IT Department</option>
                <option value="Administration">Administration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">No Department Assigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Workflow Steps Builder */}
        <Card
          title="Workflow Execution Steps"
          subtitle="Sequential milestones required to conclude this process"
          actions={
            <Button variant="secondary" size="sm" onClick={addStep} icon={Plus}>
              Add Step
            </Button>
          }
        >
          <div className="space-y-4">
            {formData.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start gap-4 relative group"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-1">
                  {idx + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                      Step Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={step.title}
                      onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      placeholder="e.g. Compliance Review"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                      Assign Employee
                    </label>
                    <select
                      value={step.assigned_to || ''}
                      onChange={(e) => handleStepChange(idx, 'assigned_to', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.profiles?.id}>
                          {m.profiles?.full_name || m.profiles?.email} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-0.5">
                      Step Instructions
                    </label>
                    <input
                      type="text"
                      value={step.description}
                      onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                      placeholder="Specific deliverables or actions expected..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {formData.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={() => navigate('/workflows')}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading} icon={Save}>
            Save Workflow
          </Button>
        </div>
      </form>

      {/* Gemini AI Generator Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Generate Workflow with Google Gemini"
        subtitle="Describe your business objective in plain English"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Business Process Description
            </label>
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Design a complete employee onboarding workflow for remote software developers, including IT asset procurement, compliance training, and mentor assignment."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              Gemini AI will analyze your prompt, structure the necessary stages, suggest realistic durations, and assign appropriate operational priorities.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateAI}
              loading={aiLoading}
              disabled={!aiPrompt.trim()}
            >
              Generate Pipeline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowCreatePage;

