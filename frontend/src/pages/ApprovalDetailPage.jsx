import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, isManager, profile, user } = useAuth();

  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApproval = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/approvals/${id}`);
      if (res.success) setApproval(res.data);
    } catch (err) {
      console.warn('Error fetching approval detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && currentOrg) fetchApproval();
  }, [id, currentOrg]);

  const handleDecision = async (decision) => {
    setActionLoading(true);
    try {
      const endpoint =
        decision === 'approved'
          ? 'approve'
          : decision === 'rejected'
          ? 'reject'
          : 'request-information';

      await api.post(`/approvals/${id}/${endpoint}`, {
        decision_comment: comment,
      });

      fetchApproval();
      setComment('');
    } catch (err) {
      alert(err.message || 'Error processing approval decision');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading approval details..." size="lg" />;
  }

  if (!approval) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Approval request not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/approvals')} className="mt-4">
          Return to Approvals
        </Button>
      </div>
    );
  }

  const isSelf = approval.requested_by === user?.id;
  const canDecide = isManager && (!isSelf || profile?.role === 'admin') && approval.status === 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/approvals')}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {approval.request_type}
            </span>
            <Badge variant={approval.status}>{approval.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{approval.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Request Details" className="md:col-span-2 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description & Justification
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {approval.description || 'No description provided.'}
            </p>
          </div>

          {approval.decision_comment && (
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-1">Manager Decision Note</h4>
              <p className="text-xs text-slate-800 italic">"{approval.decision_comment}"</p>
              {approval.decided_at && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Decided at: {new Date(approval.decided_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Decision Form if Pending and Permitted */}
          {canDecide && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Add Decision Comment
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional explanation or condition for the decision..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleDecision('approved')}
                  loading={actionLoading}
                  icon={CheckCircle}
                >
                  Approve Request
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDecision('rejected')}
                  loading={actionLoading}
                  icon={XCircle}
                >
                  Reject Request
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision('info_requested')}
                  loading={actionLoading}
                  icon={HelpCircle}
                >
                  Request Information
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card title="Metadata">
          <div className="space-y-3 text-xs">
            {approval.amount !== null && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Amount</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ${Number(approval.amount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Requester</span>
              <span className="font-semibold text-slate-800">
                {approval.requester?.full_name || 'Member'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Date</span>
              <span className="text-slate-700">{new Date(approval.created_at).toLocaleDateString()}</span>
            </div>
            {approval.approver && (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Approver</span>
                <span className="font-semibold text-slate-800">{approval.approver.full_name}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApprovalDetailPage;

