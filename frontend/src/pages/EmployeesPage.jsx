import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const EmployeesPage = () => {
  const { currentOrg, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const fetchMembersAndDepts = async () => {
    try {
      setLoading(true);
      const [memRes, deptRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/members`),
        api.get('/departments'),
      ]);
      if (memRes.success) setMembers(memRes.data || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
    } catch (err) {
      console.warn('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchMembersAndDepts();
  }, [currentOrg]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${memberId}`, {
        role: newRole,
      });
      fetchMembersAndDepts();
    } catch (err) {
      alert(err.message || 'Error updating member role');
    }
  };

  const handleToggleActive = async (memberId, currentStatus) => {
    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${memberId}`, {
        is_active: !currentStatus,
      });
      fetchMembersAndDepts();
    } catch (err) {
      alert(err.message || 'Error updating member status');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      const res = await api.post(`/organizations/${currentOrg.id}/invitations`, {
        email: inviteEmail,
        role: inviteRole,
        department_id: inviteDept || null,
      });

      if (res.success) {
        setInviteModalOpen(false);
        setInviteEmail('');
        fetchMembersAndDepts();
      }
    } catch (err) {
      setInviteError(err.message || 'Error inviting member');
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const name = m.profiles?.full_name?.toLowerCase() || '';
    const email = m.profiles?.email?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team assignments, role permissions, and departmental alignment</p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)} icon={UserPlus}>
            Add Member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving member roster..." />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-200">
                          {m.profiles?.full_name ? m.profiles.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{m.profiles?.full_name || 'Member'}</p>
                          <p className="text-[11px] text-slate-400">{m.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <Badge variant="primary" className="uppercase text-[10px]">
                          {m.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.departments?.name || <span className="text-slate-400">General</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={m.is_active ? 'success' : 'default'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleActive(m.id, m.is_active)}
                          className={`text-xs font-semibold ${
                            m.is_active ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {m.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Add Organization Member"
        subtitle="Invite registered user to your workspace"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {inviteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{inviteError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Registered Email Address *
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Access Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={inviteLoading}>
              Add to Organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;

