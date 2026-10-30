import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ReportsPage = () => {
  const { currentOrg, isManager } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);

  // Filter/Generate State
  const [reportType, setReportType] = useState('operational');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeReport, setActiveReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      if (res.success && res.data) {
        setReports(res.data);
        if (res.data.length > 0 && !activeReport) {
          // Fetch full report details for latest
          const latestRes = await api.get(`/reports/${res.data[0].id}`);
          if (latestRes.success) setActiveReport(latestRes.data);
        }
      }
    } catch (err) {
      console.warn('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchReports();
  }, [currentOrg]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerateLoading(true);

    try {
      const res = await api.post('/reports/generate', {
        report_type: reportType,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (res.success) {
        setActiveReport(res.data);
        fetchReports();
      }
    } catch (err) {
      alert(err.message || 'Error generating report');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleSelectReport = async (reportId) => {
    try {
      const res = await api.get(`/reports/${reportId}`);
      if (res.success) setActiveReport(res.data);
    } catch (err) {
      alert('Error fetching report');
    }
  };

  const handleExportCSV = async (reportId) => {
    try {
      window.open(`${api.defaults.baseURL}/reports/${reportId}/export`, '_blank');
    } catch (err) {
      alert('Error exporting report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data-backed operational reports with AI-generated executive summaries
          </p>
        </div>

        {activeReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV(activeReport.id)}
            icon={Download}
          >
            Export CSV
          </Button>
        )}
      </div>

      {/* Generator Configuration Card */}
      {isManager && (
        <Card title="Generate New Report" subtitle="Calculates live PostgreSQL database metrics">
          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="operational">Daily Operational Report</option>
                <option value="productivity">Weekly Productivity Report</option>
                <option value="monthly">Monthly Business Report</option>
                <option value="overdue_tasks">Overdue Task Analysis</option>
                <option value="pending_approvals">Pending Approval Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={generateLoading}
                className="w-full shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Report
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Report Display & Historic List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Report View */}
        <div className="lg:col-span-2 space-y-5">
          {activeReport ? (
            <>
              {/* Executive AI Summary Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Synthesis</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Generated: {new Date(activeReport.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold tracking-tight capitalize">
                  {activeReport.report_type.replace(/_/g, ' ')} Summary
                </h3>

                <p className="text-xs text-indigo-100/90 mt-2 leading-relaxed whitespace-pre-wrap">
                  {activeReport.ai_summary || 'Standard operational report.'}
                </p>
              </div>

              {/* Data Metrics Summary */}
              {activeReport.report_data && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Tasks</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {activeReport.report_data.totalTasks}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Completion Rate</p>
                    <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                      {activeReport.report_data.completionRate}%
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Overdue Tasks</p>
                    <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                      {activeReport.report_data.overdueTasks}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Hours</p>
                    <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
                      {activeReport.report_data.avgCompletionHours}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No report selected</p>
              <p className="text-xs text-slate-500 mt-1">
                Generate an operational report to view calculated KPIs and AI insights.
              </p>
            </div>
          )}
        </div>

        {/* Historic Generated Reports List */}
        <Card title="Generated Reports" subtitle="Prior saved report snapshots">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectReport(r.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  activeReport?.id === r.id
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 capitalize">
                  <span>{r.report_type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  By: {r.generator?.full_name || 'System'}
                </p>
              </div>
            ))}

            {reports.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No reports generated yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;

