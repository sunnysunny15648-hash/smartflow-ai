import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12">
        <Card className="text-center py-8">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            You require an authorized role ({allowedRoles.join(' or ')}) to access this business module.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;

