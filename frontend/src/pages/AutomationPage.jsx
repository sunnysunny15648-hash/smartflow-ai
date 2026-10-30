import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  History,
  FileCode,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export const AutomationPage = () => {
  const { currentOrg, isManager } = useAuth();
  const [tab, setTab] = useState('rules'); // 'rules' | 'logs'
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (tab === 'rules') {
        const res = await api.get('/automation/rules');
        if (res.success) setRules(res.data || []);
      } else {
        const res = await api.get('/automation/executions');
        if (res.success) setLogs(res.data || []);
      }
    } catch (err) {
      console.warn('Error fetching automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchData();
  }, [currentOrg, tab]);

  const handleToggleActive = async (rule) => {
    try {
      const endpoint = rule.is_active ? 'deactivate' : 'activate';
      await api.post(`/automation/rules/${rule.id}/${endpoint}`);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !rule.is_active } : r))
      );
    } catch (err) {
      alert(err.message || 'Error toggling automation rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    try {
      await api.delete(`/automation/rules/${deleteRuleId}`);
      setDeleteRuleId(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automation Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Trigger-based automated workflows, instant actions, and event orchestration
          </p>
        </div>

        {isManager && (
          <Link to="/automation/create">
            <Button variant="primary" size="sm" icon={Plus}>
              Create Automation Rule
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setTab('rules')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
            tab === 'rules'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" /> Active Rules ({rules.length})
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
            tab === 'logs'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Execution History
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading automation system..." />
      ) : tab === 'rules' ? (
        /* RULES TAB */
        rules.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No Automation Rules Configured"
            description="Create your first rule to automatically assign tasks, send notices, or trigger approvals when events occur."
            actionLabel={isManager ? 'Create First Rule' : undefined}
            onAction={() => (window.location.href = '/automation/create')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Zap className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      rule.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {rule.description || 'Executes automated actions when trigger conditions match.'}
                </p>

                {/* Trigger -> Action flow representation */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-2 mb-4 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">WHEN</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px]">
                      {rule.trigger_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {rule.conditions && rule.conditions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">IF</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] truncate">
                        {rule.conditions.length} condition(s) satisfied
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">THEN</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                      Execute {rule.actions?.length || 0} action(s)
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(rule.created_at).toLocaleDateString()}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => setDeleteRuleId(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* LOGS TAB */
        logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Automation Executions Yet"
            description="When matching business events fire, execution logs and idempotency records will appear here."
          />
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Event ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {log.automation_rules?.name || 'Automation Rule'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {log.event_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.status}>{log.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.started_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Output
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Log Output Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Execution Details"
        subtitle={`Event: ${selectedLog?.event_id}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <Badge variant={selectedLog?.status}>{selectedLog?.status}</Badge>
          </div>

          {selectedLog?.error_message && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              <p className="font-bold">Error:</p>
              <p>{selectedLog.error_message}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-1">Execution Payload</h4>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] overflow-x-auto font-mono">
              {JSON.stringify(selectedLog?.execution_result, null, 2)}
            </pre>
          </div>
        </div>
      </Modal>

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Automation Rule?"
        message="This rule will no longer trigger for future events."
        confirmText="Delete Rule"
      />
    </div>
  );
};

export default AutomationPage;

