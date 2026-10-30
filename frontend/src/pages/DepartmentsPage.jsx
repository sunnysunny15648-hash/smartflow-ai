import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Trash2, Edit2, Users } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const DepartmentsPage = () => {
  const { currentOrg, isManager, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.success) setDepartments(res.data || []);
    } catch (err) {
      console.warn('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) fetchDepartments();
  }, [currentOrg]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      if (editingDept) {
        await api.patch(`/departments/${editingDept.id}`, { name, description });
      } else {
        await api.post('/departments', { name, description });
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Error saving department');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (deptId) => {
    if (!window.confirm('Delete this department? Associated workflows and users will remain unassigned.')) return;
    try {
      await api.delete(`/departments/${deptId}`);
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Error deleting department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-xs text-slate-500 mt-1">Structure teams into operational functional units</p>
        </div>

        {isManager && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={Plus}>
            New Department
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading departments..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <Card key={dept.id} className="hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                </div>

                {isManager && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[36px]">
                {dept.description || 'General organizational functional team.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Active unit</span>
                <span>Created {new Date(dept.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        subtitle="Organize team ownership and process categorizations"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance & Accounting"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe department responsibilities..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saveLoading}>
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;

