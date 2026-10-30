import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch,
  ArrowLeft,
  Calendar,
  User,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  Pause,
  Copy,
  Plus,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

export const WorkflowDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, isManager } = useAuth();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workflows/${id}`);
      if (res.success) setWorkflow(res.data);
    } catch (err) {
      console.warn('Error fetching workflow detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && currentOrg) fetchWorkflow();
  }, [id, currentOrg]);

  const handleStatusChange = async (newStatus) => {
    try {
      const endpoint = newStatus === 'active' ? 'activate' : 'pause';
      await api.post(`/workflows/${id}/${endpoint}`);
      fetchWorkflow();
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleAnalyzeAI = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await api.post('/ai/analyze-workflow', { workflowId: id });
      if (res.success) setAiAnalysis(res.data);
    } catch (err) {
      alert(err.message || 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving workflow details..." size="lg" />;
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Workflow not found or access restricted.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/workflows')} className="mt-4">
          Return to Workflows
        </Button>
      </div>
    );
  }

  const steps = workflow.workflow_steps || [];
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workflows')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                {workflow.category || 'General'}
              </span>
              <Badge variant={workflow.status}>{workflow.status}</Badge>
              <Badge variant={workflow.priority}>{workflow.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{workflow.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAnalyzeAI}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" /> AI Bottleneck Analysis
          </Button>

          {isManager && (
            <>
              {workflow.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('on_hold')} icon={Pause}>
                  Pause
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange('active')} icon={Play}>
                  Activate
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress & Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Overall Progress" className="md:col-span-2">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>Execution Milestones</span>
            <span className="font-bold text-indigo-600">{progressPercent}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{workflow.description}</p>
        </Card>

        <Card title="Attributes">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-slate-800">{workflow.departments?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Owner</span>
              <span className="font-semibold text-slate-800">{workflow.profiles?.full_name || 'System'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Start Date</span>
              <span className="text-slate-700">{workflow.start_date || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Due Date</span>
              <span className="text-slate-700 font-semibold">{workflow.due_date || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sequential Steps Timeline */}
      <Card title="Workflow Step Sequence" subtitle="Standard operating procedure roadmap">
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  step.status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : step.status === 'in_progress'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : step.step_order || idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  <Badge variant={step.status}>{step.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {step.description || 'Follow standard protocol for this operational step.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Linked Tasks */}
      <Card
        title="Associated Tasks"
        subtitle="Individual tasks tracked under this workflow"
        actions={
          <Link to="/tasks">
            <Button variant="secondary" size="sm" icon={Plus}>
              Manage Tasks
            </Button>
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {workflow.tasks && workflow.tasks.length > 0 ? (
            workflow.tasks.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <Link to={`/tasks/${task.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                    {task.title}
                  </Link>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Priority: <span className="capitalize">{task.priority}</span>
                  </p>
                </div>
                <Badge variant={task.status}>{task.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No tasks currently linked to this workflow.</p>
          )}
        </div>
      </Card>

      {/* AI Bottleneck Analysis Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Workflow Bottleneck Analysis"
        subtitle="Powered by Google Gemini Generative Intelligence"
        maxWidth="max-w-2xl"
      >
        {aiLoading ? (
          <LoadingSpinner text="Gemini is analyzing workflow delays and operational bottlenecks..." />
        ) : aiAnalysis ? (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-700 uppercase">Estimated Efficiency Score</p>
                <p className="text-2xl font-extrabold text-indigo-900 mt-0.5">
                  {aiAnalysis.efficiency_score} / 100
                </p>
              </div>
              <p className="text-[10px] text-indigo-500 max-w-xs text-right">
                AI-generated process estimate based on approval checkpoints and sequential handoffs.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Process Analysis</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {aiAnalysis.workflow_analysis}
              </p>
            </div>

            {aiAnalysis.bottlenecks && aiAnalysis.bottlenecks.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Detected Bottlenecks</h4>
                <div className="space-y-2">
                  {aiAnalysis.bottlenecks.map((b, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span>{b.step}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                          {b.impact} Impact
                        </span>
                      </div>
                      <p className="text-amber-800 mt-1">{b.problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Optimization Recommendations
                </h4>
                <div className="space-y-2">
                  {aiAnalysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <p className="text-slate-600 mt-0.5">{rec.description}</p>
                      <p className="text-[11px] text-indigo-600 font-medium mt-1">
                        Expected Benefit: {rec.expected_benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default WorkflowDetailPage;

