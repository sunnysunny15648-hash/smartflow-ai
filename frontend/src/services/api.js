import axios from 'axios';
import { supabase } from './supabaseClient';

let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').trim().replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api/v1')) {
  rawBaseUrl += '/api/v1';
}

const api = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Supabase JWT and Active Organization ID
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      const activeOrgId = localStorage.getItem('smartflow_active_org_id');
      if (activeOrgId) {
        config.headers['X-Organization-Id'] = activeOrgId;
      }
    } catch (err) {
      console.warn('Failed to attach auth token to request', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error responses cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const errors = error.response?.data?.errors || [];
    return Promise.reject({
      message: errorMsg,
      errors,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

