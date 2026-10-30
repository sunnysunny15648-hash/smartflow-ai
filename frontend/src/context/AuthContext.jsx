import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full user data & organizations from backend
  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data) {
        const { user: userData, organizations: orgs, currentOrganizationId, currentRole } = response.data;
        setProfile(userData);
        setOrganizations(orgs || []);

        const savedOrgId = localStorage.getItem('smartflow_active_org_id') || currentOrganizationId;
        const matchedOrg = (orgs || []).find((o) => o.id === savedOrgId) || orgs?.[0] || null;

        if (matchedOrg) {
          setCurrentOrg(matchedOrg);
          setRole(matchedOrg.role || currentRole);
          localStorage.setItem('smartflow_active_org_id', matchedOrg.id);
        } else {
          setCurrentOrg(null);
          setRole(null);
        }
      }
    } catch (err) {
      console.warn('Error loading user profile and organizations:', err);
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession) {
        loadUserData().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession) {
        await loadUserData();
      } else {
        setProfile(null);
        setOrganizations([]);
        setCurrentOrg(null);
        setRole(null);
        localStorage.removeItem('smartflow_active_org_id');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await loadUserData();
    return data;
  };

  const register = async ({ email, password, fullName, organizationName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // If session is already created (no email confirmation required), create organization immediately
    if (data.session) {
      try {
        await api.post('/organizations', {
          name: organizationName || `${fullName}'s Organization`,
          description: 'Primary workspace',
        });
        await loadUserData();
      } catch (orgErr) {
        console.warn('Organization auto-creation deferred:', orgErr);
      }
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('smartflow_active_org_id');
    setUser(null);
    setProfile(null);
    setCurrentOrg(null);
    setRole(null);
    setOrganizations([]);
  };

  const switchOrganization = (orgId) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      localStorage.setItem('smartflow_active_org_id', target.id);
      setCurrentOrg(target);
      setRole(target.role);
      // Reload page state or trigger context update
      window.location.reload();
    }
  };

  const value = {
    user,
    session,
    profile,
    organizations,
    currentOrg,
    role,
    loading,
    login,
    register,
    logout,
    switchOrganization,
    refreshUserData: loadUserData,
    isAdmin: role === 'admin',
    isManager: role === 'admin' || role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

