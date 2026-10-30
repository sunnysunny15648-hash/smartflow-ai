import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { User, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const ProfilePage = () => {
  const { profile, user, role, currentOrg, refreshUserData } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      await refreshUserData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage personal account details and authentication information</p>
      </div>

      <Card title="Personal Information">
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{profile?.fullName || 'User'}</h3>
            <p className="text-xs text-slate-400">{profile?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Active Workspace Role:</span>
              <Badge variant="primary" className="uppercase font-mono text-[10px]">
                {role || 'Member'}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" loading={loading} icon={Save}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;

