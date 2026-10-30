import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileClock, Search, Filter, ShieldCheck, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

export const ActivityLogsPage = () => {
  const { currentOrg } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedMeta, setSelectedMeta] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityFilter) params.append('entity_type', entityFilter);

      const res = await api.get(`/activity-logs?${params.toString()}`);
      if (res.success) setLogs(res.data || []);
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchLogs();
  }, [currentOrg, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, compliance-ready event ledger of all organizational actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="">All Entity Types</option>
            <option value="workflow">Workflows</option>
            <option value="task">Tasks</option>
            <option value="approval">Approvals</option>
            <option value="automation_rule">Automation Rules</option>
            <option value="organization">Organization</option>
            <option value="department">Departments</option>
            <option value="report">Reports</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving immutable audit records..." />
      ) : logs.length === 0 ? (
        <Card className="text-center py-12">
          <FileClock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No Activity Logs Found</p>
          <p className="text-xs text-slate-500 mt-1">Actions performed across the platform will be logged here.</p>
        </Card>
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Actor / User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Audit Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {log.profiles?.full_name ? log.profiles.full_name.charAt(0) : 'S'}
                        </div>
                        <span>{log.profiles?.full_name || 'System / Automation'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{log.entity_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          onClick={() => setSelectedMeta(log.metadata)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Metadata Inspector Modal */}
      <Modal
        isOpen={!!selectedMeta}
        onClose={() => setSelectedMeta(null)}
        title="Event Audit Metadata"
        subtitle="Cryptographically verified record payload"
      >
        <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto font-mono">
          {JSON.stringify(selectedMeta, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default ActivityLogsPage;

