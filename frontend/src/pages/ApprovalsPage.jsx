import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Plus,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export const ApprovalsPage = () => {
  const { currentOrg, isManager, profile, user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');

  // Decision Modal State
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [decisionType, setDecisionType] = useState('approved'); // 'approved' | 'rejected' | 'info_requested'
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Submit Request Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    request_type: 'Expense Reimbursement',
    amount: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusTab !== 'all') params.append('status', statusTab);

      const res = await api.get(`/approvals?${params.toString()}`);
      if (res.success) setApprovals(res.data || []);
    } catch (err) {
      console.warn('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchApprovals();
  }, [currentOrg, statusTab]);

  const handleOpenDecision = (approval, type) => {
    setSelectedApproval(approval);
    setDecisionType(type);
    setDecisionComment('');
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setDecisionLoading(true);

    try {
      const endpoint =
        decisionType === 'approved'
          ? 'approve'
          : decisionType === 'rejected'
          ? 'reject'
          : 'request-information';

      await api.post(`/approvals/${selectedApproval.id}/${endpoint}`, {
        decision_comment: decisionComment,
      });

      setSelectedApproval(null);
      fetchApprovals();
    } catch (err) {
      alert(err.message || 'Error recording decision');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = {
        ...submitForm,
        amount: submitForm.amount ? parseFloat(submitForm.amount) : null,
      };

      const res = await api.post('/approvals', payload);
      if (res.success) {
        setSubmitModalOpen(false);
        setSubmitForm({
          title: '',
          description: '',
          request_type: 'Expense Reimbursement',
          amount: '',
        });
        fetchApprovals();
      }
    } catch (err) {
      alert(err.message || 'Error submitting approval request');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">Review operational requests, purchase authorizations, and expenses</p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setSubmitModalOpen(true)} icon={Plus}>
          New Approval Request
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        {['all', 'pending', 'approved', 'rejected', 'info_requested'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`pb-3 px-3 capitalize transition-all border-b-2 -mb-px ${
              statusTab === tab
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Approvals Table / Card Listing */}
      {loading ? (
        <LoadingSpinner text="Retrieving approval queue..." />
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Approvals Found"
          description="There are currently no approval requests matching your filter."
          actionLabel="Submit Request"
          onAction={() => setSubmitModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {approvals.map((appr) => {
            const isSelf = appr.requested_by === user?.id;
            const canDecide = isManager && (!isSelf || profile?.role === 'admin') && appr.status === 'pending';

            return (
              <Card key={appr.id} className="hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {appr.request_type}
                      </span>
                      <Badge variant={appr.status}>{appr.status}</Badge>
                      {appr.amount !== null && (
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          ${Number(appr.amount).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Link to={`/approvals/${appr.id}`} className="group inline-block">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {appr.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {appr.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span>
                        Requested by: <strong className="text-slate-700">{appr.requester?.full_name || 'Member'}</strong>
                      </span>
                      <span>
                        Date: {new Date(appr.created_at).toLocaleDateString()}
                      </span>
                      {appr.decision_comment && (
                        <span className="text-slate-600 italic">
                          "{appr.decision_comment}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decision Actions */}
                  {canDecide ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'approved')}
                        icon={CheckCircle}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'rejected')}
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDecision(appr, 'info_requested')}
                        icon={HelpCircle}
                      >
                        Request Info
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to={`/approvals/${appr.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex-shrink-0"
                    >
                      View Request →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Comment Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={`${decisionType === 'approved' ? 'Approve' : decisionType === 'rejected' ? 'Reject' : 'Request Info'} on Request`}
        subtitle={`Request: "${selectedApproval?.title}"`}
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Decision Note / Justification
            </label>
            <textarea
              rows={3}
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              placeholder="Add rationale, conditions, or requested details for the employee..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedApproval(null)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === 'approved' ? 'success' : decisionType === 'rejected' ? 'danger' : 'primary'}
              size="sm"
              type="submit"
              loading={decisionLoading}
            >
              Confirm Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submit Approval Request Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit New Approval Request"
        subtitle="Route to organizational management for review"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Request Title *
            </label>
            <input
              type="text"
              required
              value={submitForm.title}
              onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
              placeholder="e.g. Q4 Cloud Hosting Budget Increase"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Request Type *
              </label>
              <select
                value={submitForm.request_type}
                onChange={(e) => setSubmitForm({ ...submitForm, request_type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="Expense Reimbursement">Expense Reimbursement</option>
                <option value="Purchase Request">Purchase Request</option>
                <option value="Leave Request">Leave Request</option>
                <option value="Document Signoff">Document Signoff</option>
                <option value="Operational Change">Operational Change</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Amount ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={submitForm.amount}
                onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })}
                placeholder="Optional amount..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description & Justification
            </label>
            <textarea
              rows={3}
              value={submitForm.description}
              onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
              placeholder="Explain the background and business requirement..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitLoading}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApprovalsPage;

