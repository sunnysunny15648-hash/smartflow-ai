import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building, Shield, Sparkles, Database, Save, CheckCircle2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export const SettingsPage = () => {
  const { currentOrg, isAdmin, refreshUserData } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name || '');
      setDescription(currentOrg.description || '');
    }
  }, [currentOrg]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await api.patch(`/organizations/${currentOrg.id}`, { name, description });
      await refreshUserData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Error updating organization settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage workspace preferences, identifiers, and connected services</p>
      </div>

      {/* Organization Details */}
      <Card title="Workspace Profile" subtitle="General workspace identity">
        <form onSubmit={handleSave} className="space-y-4">
          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Workspace settings updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Organization Name
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Workspace Identifier / Slug
            </label>
            <input
              type="text"
              disabled
              value={currentOrg?.slug || ''}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Permanent unique system identifier for this tenant.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workspace mission and description..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" loading={loading} icon={Save}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Integration & Security Status */}
      <Card title="System Services & Integrations" subtitle="Operational platform health">
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900">Supabase PostgreSQL</p>
                <p className="text-slate-500 text-[11px]">Database, Storage, & Row Level Security</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              Connected
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900">Groq AI</p>
                <p className="text-slate-500 text-[11px]">Official @google/genai SDK Integration</p>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              Active
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;

